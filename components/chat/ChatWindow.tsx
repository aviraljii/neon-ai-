'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { HistoryPanel } from './HistoryPanel';
import { SearchHistoryButton } from './SearchHistoryButton';
import { Sparkles } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { sendChatMessage } from '@/lib/api';
import { useHistoryManager } from '@/hooks/useHistoryManager';

export interface ChatMessage {
  id: string;
  content: string;
  isAi: boolean;
  isError?: boolean;
  imageUrl?: string;
}

export function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content:
        'Hello! I\'m Neon AI, your fashion assistant and affiliate marketing guide. I can help with outfit ideas, budget clothing suggestions, Pinterest growth strategy, Linktree setup, and commission-based product promotion. Tell me your budget, season, and occasion to get started.',
      isAi: true,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { history, isLoaded, addToHistory, removeFromHistory, clearHistory } = useHistoryManager();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;

    // Add to history
    if (input.trim()) {
      addToHistory(input);
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: input || (selectedImage ? '[Image attached]' : ''),
      isAi: false,
      imageUrl: selectedImage,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSelectedImage('');
    setIsLoading(true);

    try {
      // Prepare chat history for context
      const chatHistory: Array<{ role: 'user' | 'assistant'; content: string }> = messages
        .filter((msg) => msg.content.length > 0 && !msg.isError)
        .map((msg) => ({
          role: msg.isAi ? 'assistant' : 'user',
          content: msg.content,
        }));

      // Call the centralized API client
      const result = await sendChatMessage({
        message: userMessage.content,
        chatHistory,
        imageUrl: selectedImage,
      });

      if (!result.success || result.error) {
        throw new Error(result.error || 'Failed to get response from Neon AI');
      }

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: result.response,
        isAi: true,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unexpected error occurred';

      const errorChatMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: errorMessage.includes('AI service is temporarily unavailable')
          ? 'Neon AI is temporarily unavailable. Please try again in a moment.'
          : errorMessage,
        isAi: true,
        isError: true,
      };

      setMessages((prev) => [...prev, errorChatMessage]);
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectFromHistory = (message: string) => {
    setInput(message);
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <div className="border-b border-border/50 p-4 sm:p-6 bg-gradient-to-r from-purple-900/20 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-500 neon-glow-pulse">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  Neon AI Chat
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Fashion + Affiliate Mentor</p>
              </div>
            </div>
            <div className="md:hidden">
              <SearchHistoryButton
                onClick={() => setShowHistoryPanel(!showHistoryPanel)}
                hasHistory={history.length > 0}
              />
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4 sm:p-6" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                content={message.content}
                isAi={message.isAi}
                isError={message.isError}
                imageUrl={message.imageUrl}
                isTyping={false}
              />
            ))}
            {isLoading && <MessageBubble content="" isAi={true} isLoading={true} />}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t border-border/50 bg-card glassmorphism p-4 sm:p-6 space-y-3">
          <ChatInput
            value={input}
            onChange={setInput}
            onSend={handleSend}
            onImageSelect={setSelectedImage}
            selectedImage={selectedImage}
            onClearImage={() => setSelectedImage('')}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* History Panel - Desktop */}
      <HistoryPanel
        history={history}
        onSelectHistory={handleSelectFromHistory}
        onDeleteHistory={removeFromHistory}
        onClearHistory={clearHistory}
        isModal={false}
      />

      {/* History Panel - Mobile Modal */}
      <HistoryPanel
        history={history}
        onSelectHistory={handleSelectFromHistory}
        onDeleteHistory={removeFromHistory}
        onClearHistory={clearHistory}
        isOpen={showHistoryPanel}
        onClose={() => setShowHistoryPanel(false)}
        isModal={true}
      />
    </div>
  );
}
