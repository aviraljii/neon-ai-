'use client';

import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface SendButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export function SendButton({ onClick, disabled = false, isLoading = false }: SendButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || isLoading}
      size="icon"
      className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 text-white hover:shadow-lg hover:from-purple-500 hover:to-cyan-400 transition-all duration-200 flex-shrink-0"
      title="Send message (Ctrl+Enter)"
    >
      <Send className="h-4 w-4" />
    </Button>
  );
}
