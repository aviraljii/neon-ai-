'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { ShoppingBag, Sparkles, Tag, MessageSquare, Heart } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-accent" />
            <span className="text-xl font-bold text-foreground">Neon AI</span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              asChild
              variant="outline"
              className="border-border text-foreground hover:bg-muted bg-transparent"
            >
              <Link href="/chat">Chat </Link>
            </Button>
            <Button
              asChild
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Link href="/chat">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 sm:py-32 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center space-y-6 sm:space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-sm text-muted-foreground">
                Your AI-powered fashion advisor
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-balance">
              Neon AI – Your Smart Shopping Assistant
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
              Analyze and compare clothing products from Amazon, Flipkart, Myntra, and Meesho with
              AI-powered recommendations. Get personalized suggestions based on budget, fabric,
              comfort, design, and occasion.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                asChild
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90 text-base"
              >
                <Link href="/chat">Start Chatting</Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-border text-foreground hover:bg-muted text-base bg-transparent"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground text-balance">
              Powerful Features
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Feature 1 */}
            <Card className="bg-card border-border p-6 sm:p-8 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="inline-flex p-3 rounded-lg bg-accent/20">
                  <Tag className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Product Comparison</h3>
                <p className="text-muted-foreground">
                  Compare 2-3 products side by side and instantly see which offers the best value
                  for your needs.
                </p>
              </div>
            </Card>

            {/* Feature 2 */}
            <Card className="bg-card border-border p-6 sm:p-8 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="inline-flex p-3 rounded-lg bg-secondary/20">
                  <ShoppingBag className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Budget Recommendations</h3>
                <p className="text-muted-foreground">
                  Get smart recommendations tailored to your budget and preferences. Find the
                  perfect outfit within your price range.
                </p>
              </div>
            </Card>

            {/* Feature 3 */}
            <Card className="bg-card border-border p-6 sm:p-8 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="inline-flex p-3 rounded-lg bg-accent/20">
                  <MessageSquare className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Smart AI Assistant</h3>
                <p className="text-muted-foreground">
                  Chat naturally with our friendly AI assistant. Get clear, honest, and helpful
                  recommendations in simple English that's easy to understand.
                </p>
              </div>
            </Card>

            {/* Feature 4 */}
            <Card className="bg-card border-border p-6 sm:p-8 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="inline-flex p-3 rounded-lg bg-secondary/20">
                  <Heart className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Affiliate Helper</h3>
                <p className="text-muted-foreground">
                  Generate captions, hashtags, and product descriptions for social media with one
                  click.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-3xl text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground text-balance">
              Ready to find your perfect outfit?
            </h2>
            <p className="text-lg text-muted-foreground text-balance">
              Paste a product link or describe what you're looking for. Let Neon AI guide your
              shopping journey.
            </p>
          </div>

          <Button
            asChild
            size="lg"
            className="bg-accent text-accent-foreground hover:bg-accent/90 text-base"
          >
            <Link href="/chat">Start Chatting Now</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto max-w-5xl text-center text-muted-foreground text-sm">
          <p>© 2026 Neon AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
