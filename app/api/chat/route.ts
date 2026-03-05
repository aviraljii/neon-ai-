import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ChatHistoryMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const FALLBACK_RESPONSE = 'Sorry, Neon AI is temporarily unavailable.';
const MODEL_TIMEOUT_MS = 20000;
const MAX_HISTORY_ITEMS = 12;
const SYSTEM_PROMPT = `You are Neon AI, a friendly and helpful shopping assistant.

Your job:
Help users analyze clothing products and recommend the best option.

Rules:
- Always reply in simple English.
- Be friendly and helpful.
- Always consider budget in Indian Rupees.
- Explain fabric quality and comfort.
- Give honest verdict.
- Keep answers structured.

You can:
- Analyze clothing products from Amazon, Flipkart, Myntra, and Meesho
- Compare products and explain pros/cons
- Suggest what fits a budget
- Give fashion advice
- Generate social media content

Remember:
- Speak like a helpful friend, not a robot
- Never make up fake reviews or ratings
- If information is limited, say so honestly
- Always explain why a product is good or not good
- Help users save money and make smart choices`;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function sanitizeChatHistory(input: unknown): ChatHistoryMessage[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item) => {
      if (!isObject(item)) return null;
      const role = item.role === 'assistant' ? 'assistant' : item.role === 'user' ? 'user' : null;
      const content = typeof item.content === 'string' ? item.content.trim() : '';
      if (!role || !content) return null;
      return { role, content };
    })
    .filter((item): item is ChatHistoryMessage => Boolean(item))
    .slice(-MAX_HISTORY_ITEMS);
}

function getSafeErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Unknown error';
}

function isGreetingMessage(message: string): boolean {
  return /^(hi|hii|hiii|hyy|hie|hello|helo|hey|heyy|good morning|gm|good afternoon|good evening)\b/i.test(message.trim());
}

function fallbackResponseForMessage(message: string): string {
  const trimmed = message.trim();

  if (isGreetingMessage(trimmed)) {
    return 'Hi! I am Neon AI. I can help with outfit ideas, product comparisons, and budget-friendly fashion picks. What are you shopping for today?';
  }

  const isMensSummerShirtQuery =
    /(men|mens|man|male|boys)/i.test(trimmed) &&
    /(summer|hot|heat)/i.test(trimmed) &&
    /(shirt|shirts)/i.test(trimmed);

  if (isMensSummerShirtQuery) {
    return `Great choice. For men's summer shirts, go for breathable fabrics and relaxed fits.

Top picks:
- Linen shirt (best cooling, smart casual)
- Cotton poplin shirt (lightweight, office + daily wear)
- Cotton-linen blend shirt (less wrinkling than pure linen)
- Seersucker shirt (airy texture, good for humid weather)

Best colors for summer:
- White, sky blue, mint, beige, light grey

Fit tips:
- Prefer regular/relaxed fit over slim fit in heat
- Short sleeves for outdoor use, full sleeves for sun protection

Budget guide:
- Under Rs 999: basic cotton shirts
- Rs 1000-1999: better cotton-linen blends
- Rs 2000+: premium linen options

If you want, I can suggest 5 specific shirt options by your budget.`;
  }

  const isFashionRelated = /(fashion|outfit|dress|shirt|jeans|kurti|saree|shoe|style|fabric|clothing|look|myntra|amazon|flipkart|meesho)/i.test(trimmed);
  if (isFashionRelated) {
    return `Here is a quick fashion recommendation:
- Tell me your budget, occasion, and preferred fit
- I will suggest fabric, color, and style options
- I can also give shortlist picks for Amazon, Flipkart, Myntra, and Meesho

Example: "Men summer shirts under Rs 1500 for office wear"`;
  }

  return 'I can help with fashion, product comparisons, budget shopping, and styling. Tell me what you want to buy and your budget.';
}

function timeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`AI request timed out after ${ms}ms`)), ms);
  });
}

export async function POST(request: NextRequest) {
  try {
    let requestBody: unknown;

    try {
      requestBody = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, response: '', error: 'Invalid JSON request body' },
        { status: 400 }
      );
    }

    if (!isObject(requestBody)) {
      return NextResponse.json(
        { success: false, response: '', error: 'Request body must be a JSON object' },
        { status: 400 }
      );
    }

    const message = typeof requestBody.message === 'string' ? requestBody.message : '';
    const chatHistory = sanitizeChatHistory(requestBody.chatHistory);

    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      return NextResponse.json(
        { success: false, response: '', error: 'Message is required' },
        { status: 400 }
      );
    }

    // Fast-path greetings so chat remains responsive even if AI provider is down.
    if (isGreetingMessage(trimmedMessage)) {
      return NextResponse.json({
        success: true,
        response:
          'Hi! I am Neon AI. I can help you with outfit ideas, product comparisons, fabric advice, and budget shopping picks. What would you like to shop for?',
      });
    }

    let aiResponse = '';
    let aiFailure: unknown = null;

    try {
      aiResponse = await callAIWithSDK(trimmedMessage, chatHistory);
    } catch (error) {
      aiFailure = error;
      aiResponse = fallbackResponseForMessage(trimmedMessage);
      console.error('Chat AI error:', getSafeErrorMessage(error));
    }

    // Keep the same shape expected by ChatWindow/lib/api
    return NextResponse.json({
      success: true,
      response: aiResponse,
      ...(aiFailure ? { fallback: true } : {}),
    });
  } catch (error) {
    console.error('Chat route unexpected error:', getSafeErrorMessage(error));
    return NextResponse.json(
      { success: true, response: FALLBACK_RESPONSE, fallback: true },
      { status: 200 }
    );
  }
}

async function callAIWithSDK(
  userMessage: string,
  chatHistory: ChatHistoryMessage[]
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);

  const preferredModel = (process.env.GEMINI_MODEL || '').trim();
  const modelCandidates = Array.from(
    new Set([
      preferredModel,
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-1.5-flash',
      'gemini-1.5-flash-8b',
      'gemini-1.5-pro',
    ])
  ).filter(Boolean);

  const history = chatHistory.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  const systemPrompt = SYSTEM_PROMPT;

  let lastError: unknown = null;

  for (const modelName of modelCandidates) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
      });

      const chat = model.startChat({ history });
      const result = await Promise.race([chat.sendMessage(userMessage), timeoutPromise(MODEL_TIMEOUT_MS)]);
      const response = await result.response;
      const text = response.text().trim();

      if (text) {
        return text;
      }
      throw new Error(`Model ${modelName} returned an empty response`);
    } catch (error) {
      lastError = error;
      console.error(`Gemini model failed (${modelName}):`, getSafeErrorMessage(error));
    }
  }

  throw lastError ?? new Error('All Gemini models failed');
}
