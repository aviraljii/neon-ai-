import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_PRIMARY_MODEL = 'gemini-2.5-flash';
const DEFAULT_FALLBACK_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash-latest'];

const SYSTEM_PROMPT = `You are Neon AI, an intelligent fashion shopping assistant and affiliate marketing guide.

Neon AI was created by Aviral Kaushik.
Aviral Kaushik is the founder and developer of Neon AI.
He built Neon AI to help people find the best fashion products, compare prices, and get smart outfit suggestions.

Help users with:
- Identify products from shopping links
- Explain products in simple words
- Compare prices on Amazon, Flipkart, Myntra, and Meesho
- Suggest complete outfits based on the selected product
- Share similar buying links from major e-commerce platforms
- Explain fabric, comfort, occasions, and price range

Rules:
- Keep replies simple, practical, and beginner-friendly.
- Always use Indian Rupees (₹) for pricing.
- Never invent live prices. If a price is unavailable, write "Not available right now".
- If the user sends a product link, your response MUST include these sections in this exact order:

1) Product Summary
- Product Name:
- Brand:
- Category:
- Simple Explanation:

2) Price Comparison
- Amazon:
- Flipkart:
- Myntra:
- Meesho:
- Best Deal:

3) Outfit Recommendation
- Item 1
- Item 2
- Item 3
- Item 4

4) Product Insights
- Fabric Type:
- Comfort Level:
- Suitable Occasions:
- Price Range Category:

5) Buying Links (Similar Products)
- Amazon:
- Flipkart:
- Myntra:

Behavior for common user intents:
- "Is this product good?" -> explain pros, styling tips, and value for money.
- "Where should I buy this?" -> focus on best platform and why.
- "Who is Aviral Kaushik?" -> Reply exactly:
"Aviral Kaushik is the creator and developer of Neon AI. He built Neon AI to help people find the best fashion products, compare prices, and get smart outfit suggestions."`;

type ChatRequestBody = {
  message?: string;
  chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
};

type ExtractedProductContext = {
  sourcePlatform?: string;
  productName?: string;
  brand?: string;
  category?: string;
  sourceLink: string;
};

const SUPPORTED_PLATFORMS = ['amazon', 'flipkart', 'myntra', 'meesho'] as const;

function extractFirstUrl(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s)]+/i);
  return match ? match[0] : null;
}

function toTitleCase(input: string): string {
  return input
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function slugToReadableText(slug: string): string {
  return toTitleCase(
    slug
      .replace(/[-_]+/g, ' ')
      .replace(/\b\d+\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

function guessCategory(productName = ''): string {
  const normalized = productName.toLowerCase();
  const rules: Array<{ keywords: string[]; category: string }> = [
    { keywords: ['shirt', 'shirting'], category: 'Shirt' },
    { keywords: ['t-shirt', 'tee'], category: 'T-Shirt' },
    { keywords: ['jean', 'denim'], category: 'Jeans' },
    { keywords: ['pant', 'trouser', 'chino'], category: 'Pants' },
    { keywords: ['shoe', 'sneaker', 'loafer', 'heel', 'sandal'], category: 'Footwear' },
    { keywords: ['dress', 'gown'], category: 'Dress' },
    { keywords: ['kurti', 'kurta'], category: 'Kurti/Kurta' },
    { keywords: ['bag', 'handbag', 'tote'], category: 'Bag' },
  ];

  const matched = rules.find((rule) => rule.keywords.some((keyword) => normalized.includes(keyword)));
  return matched?.category || 'Fashion Product';
}

function guessBrand(productName = ''): string {
  const tokens = productName.split(' ').filter(Boolean);
  if (!tokens.length) {
    return 'Not clearly mentioned';
  }

  const stopWords = new Set([
    'men',
    'mens',
    'women',
    'womens',
    'boys',
    'girls',
    'unisex',
    'kid',
    'kids',
  ]);

  const brandTokens: string[] = [];
  for (const token of tokens) {
    if (stopWords.has(token.toLowerCase())) {
      break;
    }
    brandTokens.push(token);
    if (brandTokens.length === 4) {
      break;
    }
  }

  return brandTokens.length ? brandTokens.join(' ') : 'Not clearly mentioned';
}

function detectPlatform(url: URL): string | undefined {
  const host = url.hostname.toLowerCase();
  const matched = SUPPORTED_PLATFORMS.find((platform) => host.includes(platform));
  return matched ? toTitleCase(matched) : undefined;
}

function parseBuyHatkePath(pathname: string): Pick<ExtractedProductContext, 'sourcePlatform' | 'productName'> {
  const normalizedPath = pathname.replace(/^\/+/, '');
  const buyHatkeMatch = normalizedPath.match(
    /^(amazon|flipkart|myntra|meesho)-(.+)-price-in-india-\d+-\d+$/i
  );

  if (!buyHatkeMatch) {
    return {};
  }

  const sourcePlatform = toTitleCase(buyHatkeMatch[1].toLowerCase());
  const productSlug = buyHatkeMatch[2];
  const productName = slugToReadableText(productSlug);
  return { sourcePlatform, productName };
}

function parseDirectProductPath(url: URL): Pick<ExtractedProductContext, 'sourcePlatform' | 'productName'> {
  const sourcePlatform = detectPlatform(url);
  const segments = url.pathname.split('/').filter(Boolean);
  const platform = sourcePlatform?.toLowerCase();

  if (!platform || !segments.length) {
    return { sourcePlatform };
  }

  if (platform === 'myntra') {
    const candidate = segments.find((segment) => segment.includes('-') && !/^\d+$/.test(segment));
    if (candidate) {
      return { sourcePlatform, productName: slugToReadableText(candidate) };
    }
  }

  if (platform === 'flipkart') {
    const candidate = segments.find((segment) => segment.includes('-'));
    if (candidate) {
      return { sourcePlatform, productName: slugToReadableText(candidate) };
    }
  }

  if (platform === 'amazon') {
    const index = segments.findIndex((segment) => segment.toLowerCase() === 'dp');
    if (index > 0 && segments[index - 1]) {
      return { sourcePlatform, productName: slugToReadableText(segments[index - 1]) };
    }
  }

  if (platform === 'meesho') {
    const candidate = segments.find((segment) => segment.includes('-'));
    if (candidate) {
      return { sourcePlatform, productName: slugToReadableText(candidate) };
    }
  }

  return { sourcePlatform };
}

function extractProductContextFromMessage(message: string): ExtractedProductContext | null {
  const urlString = extractFirstUrl(message);
  if (!urlString) {
    return null;
  }

  try {
    const url = new URL(urlString);
    const host = url.hostname.toLowerCase();

    let context: ExtractedProductContext = {
      sourceLink: urlString,
    };

    if (host.includes('buyhatke.com')) {
      context = { ...context, ...parseBuyHatkePath(url.pathname) };
    } else {
      context = { ...context, ...parseDirectProductPath(url) };
    }

    const productName = context.productName;
    return {
      ...context,
      brand: guessBrand(productName),
      category: guessCategory(productName),
    };
  } catch {
    return null;
  }
}

function getSimilarSearchLink(platform: string, query: string): string {
  const encoded = encodeURIComponent(query);
  if (platform === 'Amazon') {
    return `https://www.amazon.in/s?k=${encoded}`;
  }
  if (platform === 'Flipkart') {
    return `https://www.flipkart.com/search?q=${encoded}`;
  }
  return `https://www.myntra.com/${encoded}`;
}

function buildLinkAwarePrompt(userMessage: string, extracted: ExtractedProductContext): string {
  const productName = extracted.productName || 'Not clearly available from URL';
  const brand = extracted.brand || 'Not clearly mentioned';
  const category = extracted.category || 'Fashion Product';
  const sourcePlatform = extracted.sourcePlatform || 'Unknown platform';
  const searchQuery = extracted.productName || `${category} fashion product`;

  return `${userMessage}

Parsed product details from the URL:
- Source Platform: ${sourcePlatform}
- Product Name: ${productName}
- Brand: ${brand}
- Category: ${category}
- Source Link: ${extracted.sourceLink}

Use these similar buying links:
- Amazon: ${getSimilarSearchLink('Amazon', searchQuery)}
- Flipkart: ${getSimilarSearchLink('Flipkart', searchQuery)}
- Myntra: ${getSimilarSearchLink('Myntra', searchQuery)}

Price comparison guidance:
- If you cannot verify live prices, write "Not available right now" for that platform.
- In "Best Deal", choose from available verified prices only.
- If no verified prices are available, write: "Best Deal: Need live price check right now."`;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Unknown error';
}

function getModelCandidates(): string[] {
  const primary = (process.env.GEMINI_MODEL || DEFAULT_PRIMARY_MODEL).trim();
  const envFallbacks = (process.env.GEMINI_FALLBACK_MODELS || '')
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean);

  const merged = [primary, ...envFallbacks, ...DEFAULT_FALLBACK_MODELS];
  return [...new Set(merged)];
}

function isModelAvailabilityError(message: string): boolean {
  const text = message.toLowerCase();
  return (
    text.includes('not found') ||
    text.includes('is not supported') ||
    (text.includes('model') && text.includes('not available'))
  );
}

function isCreatorQuestion(message: string): boolean {
  const normalized = message.trim().toLowerCase();
  return (
    normalized.includes('who is aviral kaushik') ||
    normalized.includes('who\'s aviral kaushik') ||
    normalized.includes('who created neon ai') ||
    normalized.includes('who made neon ai') ||
    normalized.includes('creator of neon ai')
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ChatRequestBody;
    const userMessage = (body.message || '').trim();

    if (!userMessage) {
      return NextResponse.json(
        { success: false, response: '', error: 'Message is required' },
        { status: 400 }
      );
    }

    if (isCreatorQuestion(userMessage)) {
      return NextResponse.json({
        success: true,
        response:
          'Aviral Kaushik is the creator and developer of Neon AI. He built Neon AI to help people find the best fashion products, compare prices, and get smart outfit suggestions.',
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, response: '', error: 'GEMINI_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const extractedProduct = extractProductContextFromMessage(userMessage);
    const enrichedMessage = extractedProduct
      ? buildLinkAwarePrompt(userMessage, extractedProduct)
      : userMessage;

    const history = Array.isArray(body.chatHistory)
      ? body.chatHistory
          .filter((entry) => entry.content?.trim())
          .slice(-6)
          .map((entry) => ({
            role: entry.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: entry.content.trim() }],
          }))
      : [];

    // Gemini requires the first content item to be "user".
    while (history.length && history[0].role !== 'user') {
      history.shift();
    }

    const contents = [
      ...history,
      {
        role: 'user' as const,
        parts: [{ text: enrichedMessage }],
      },
    ];

    let responseText = '';
    let selectedModel = '';
    const modelErrors: string[] = [];
    const candidates = getModelCandidates();

    for (const modelName of candidates) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: SYSTEM_PROMPT,
        });

        const result = await model.generateContent({
          contents,
          generationConfig: {
            temperature: 0.35,
            topP: 0.9,
            maxOutputTokens: 1200,
          },
        });

        responseText = result.response.text().trim();
        selectedModel = modelName;
        break;
      } catch (error) {
        const message = getErrorMessage(error);
        modelErrors.push(`${modelName}: ${message}`);

        if (!isModelAvailabilityError(message)) {
          throw new Error(message);
        }
      }
    }

    if (!selectedModel) {
      throw new Error(`All configured Gemini models failed. ${modelErrors.join(' | ')}`);
    }

    return NextResponse.json({
      success: true,
      response: responseText || 'I can help with fashion and affiliate marketing. Ask me anything.',
      model: selectedModel,
    });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error('Chat API error:', message);
    return NextResponse.json(
      { success: false, response: '', error: `Failed to generate response from Gemini: ${message}` },
      { status: 500 }
    );
  }
}
