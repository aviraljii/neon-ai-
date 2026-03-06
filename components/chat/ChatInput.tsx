'use client';

import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { SendButton } from './SendButton';
import { Image as ImageIcon, X } from 'lucide-react';
import { ImageUploadInput } from '@/components/upload/ImageUploadInput';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onImageSelect?: (imageUrl: string) => void;
  selectedImage?: string;
  onClearImage?: () => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  onImageSelect,
  selectedImage,
  onClearImage,
  isLoading = false,
  placeholder = 'Paste a product link or ask me something...',
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showImageUpload, setShowImageUpload] = useState(false);

  // Auto-expand textarea height based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Image Upload Section */}
      {showImageUpload && (
        <div className="border border-border/50 rounded-lg p-4 bg-card/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-foreground">Add Image</h3>
            <Button
              onClick={() => {
                setShowImageUpload(false);
                onClearImage?.();
              }}
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <ImageUploadInput onUploaded={(url) => {
            onImageSelect?.(url);
            setShowImageUpload(false);
          }} />
        </div>
      )}

      {/* Selected Image Preview */}
      {selectedImage && !showImageUpload && (
        <div className="border border-border/50 rounded-lg p-3 flex items-center gap-3 bg-card/50">
          <img src={selectedImage} alt="Selected" className="h-12 w-12 rounded object-cover" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate">Image attached</p>
          </div>
          <Button
            onClick={onClearImage}
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Input Area */}
      <div className="flex gap-3 items-end">
        <div className="flex-1 relative bg-card border border-border/50 rounded-3xl px-4 py-3 transition-all hover:border-border/80 focus-within:border-accent/50">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder={placeholder}
            className="w-full bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none resize-none max-h-30"
            rows={1}
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => setShowImageUpload(!showImageUpload)}
            disabled={isLoading || showImageUpload}
            size="icon"
            variant="outline"
            className="h-10 w-10 rounded-full"
            title="Attach image"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
          <SendButton onClick={onSend} disabled={!value.trim() && !selectedImage || isLoading} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
