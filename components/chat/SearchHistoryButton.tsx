'use client';

import { Button } from '@/components/ui/button';
import { History } from 'lucide-react';

interface SearchHistoryButtonProps {
  onClick: () => void;
  hasHistory?: boolean;
}

export function SearchHistoryButton({ onClick, hasHistory = false }: SearchHistoryButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant="ghost"
      size="sm"
      className="text-foreground hover:bg-muted gap-2"
      title="View search history"
    >
      <History className="h-4 w-4" />
      <span className="hidden sm:inline">History</span>
      {hasHistory && (
        <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-accent/20 text-accent ml-1">
          ✓
        </span>
      )}
    </Button>
  );
}
