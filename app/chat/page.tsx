'use client';

import { ChatWindow } from '@/components/chat/ChatWindow';
import { Button } from '@/components/ui/button';
import { Sparkles, Home } from 'lucide-react';
import Link from 'next/link';

export default function ChatPage() {
  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top Navigation */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Sparkles className="h-5 w-5 text-accent" />
            <span className="font-bold text-foreground hidden sm:inline">Neon AI</span>
          </Link>

          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-foreground hover:bg-muted"
            >
              <Link href="/">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Home</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-hidden">
        <ChatWindow />
      </div>
    </div>
  );
}
