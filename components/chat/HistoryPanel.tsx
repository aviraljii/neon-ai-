'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HistoryItem } from '@/hooks/useHistoryManager';
import { Trash2, Search, X, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HistoryPanelProps {
  history: HistoryItem[];
  onSelectHistory: (message: string) => void;
  onDeleteHistory: (id: string) => void;
  onClearHistory: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  isModal?: boolean; // For mobile
}

export function HistoryPanel({
  history,
  onSelectHistory,
  onDeleteHistory,
  onClearHistory,
  isOpen = true,
  onClose,
  isModal = false,
}: HistoryPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredHistory, setFilteredHistory] = useState<HistoryItem[]>(history);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredHistory(history);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredHistory(history.filter((item) => item.message.toLowerCase().includes(query)));
    }
  }, [searchQuery, history]);

  const handleSelectItem = (message: string) => {
    onSelectHistory(message);
    if (isModal && onClose) {
      onClose();
    }
  };

  const panelContent = (
    <div className="flex flex-col h-full bg-card border-l border-border/50">
      {/* Header */}
      <div className="p-4 border-b border-border/50 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Search History</h2>
          {isModal && onClose && (
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-background border-border/50"
          />
        </div>
      </div>

      {/* History List */}
      {filteredHistory.length > 0 ? (
        <ScrollArea className="flex-1">
          <div className="divide-y divide-border/30">
            {filteredHistory.map((item) => (
              <div
                key={item.id}
                className="group p-3 hover:bg-muted/50 transition-colors cursor-pointer border-b border-border/20"
                onClick={() => handleSelectItem(item.message)}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground line-clamp-2 break-words">
                      {item.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(item.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteHistory(item.id);
                    }}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'No matching history' : 'No search history yet'}
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      {history.length > 0 && (
        <div className="border-t border-border/50 p-3">
          <Button
            onClick={onClearHistory}
            variant="outline"
            size="sm"
            className="w-full text-destructive hover:bg-destructive/10"
          >
            Clear All History
          </Button>
        </div>
      )}
    </div>
  );

  // Mobile Modal View
  if (isModal) {
    return (
      <>
        {/* Overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={onClose}
          />
        )}
        {/* Modal */}
        <div
          className={cn(
            'fixed inset-y-0 right-0 w-full max-w-sm bg-card z-50 transform transition-transform duration-300 md:hidden',
            isOpen ? 'translate-x-0' : 'translate-x-full'
          )}
        >
          {panelContent}
        </div>
      </>
    );
  }

  // Desktop Sidebar View
  return (
    <div className="hidden md:flex md:w-80 md:flex-col">
      {panelContent}
    </div>
  );
}
