'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageBubble } from './MessageBubble';
import { ImageUploadInput } from '@/components/upload/ImageUploadInput';
import { Send, Sparkles, AlertCircle, Image as ImageIcon, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { sendChatMessage } from '@/lib/api';

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
        'Hello! I\'m Neon AI, your shopping assistant. I can help you analyze clothing products, compare options, suggest items based on your budget, and generate social media content. Share a product link or ask me anything about fashion and clothing!',
      isAi: true,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: input || (selectedImage ? '[Image attached]' : ''),
      isAi: false,
      imageUrl: selectedImage,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSelectedImage('');
    setShowImageUpload(false);
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border/50 p-4 sm:p-6 bg-gradient-to-r from-purple-900/20 to-transparent">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-500 neon-glow-pulse">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Neon AI Chat
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Your Shopping Assistant</p>
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
      <div className="border-t border-border/50 bg-card glassmorphism">
        {/* Image Upload Section */}
        {showImageUpload && (
          <div className="border-b border-border p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-foreground">Add Image</h3>
              <Button
                onClick={() => {
                  setShowImageUpload(false);
                  setSelectedImage('');
                }}
                size="sm"
                variant="ghost"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <ImageUploadInput onUploaded={setSelectedImage} />
          </div>
        )}

        {/* Selected Image Preview */}
        {selectedImage && !showImageUpload && (
          <div className="border-b border-border p-4 sm:p-6 flex items-center gap-3">
            <img src={selectedImage} alt="Selected" className="h-12 w-12 rounded object-cover" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground truncate">Image attached</p>
            </div>
            <Button
              onClick={() => setSelectedImage('')}
              size="sm"
              variant="ghost"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 sm:p-6 space-y-3">
          <Input
            placeholder="Paste a product link or ask me something..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
            className="bg-background border-border"
          />
          <div className="flex gap-2">
            <Button
              onClick={() => setShowImageUpload(!showImageUpload)}
              disabled={isLoading || showImageUpload}
              size="icon"
              variant="outline"
              title="Attach image"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleSend}
              disabled={(!input.trim() && !selectedImage) || isLoading}
              size="icon"
              className="bg-gradient-to-r from-purple-600 to-cyan-500 text-white hover:shadow-lg hover:from-purple-500 hover:to-cyan-400 flex-1 transition-all"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
