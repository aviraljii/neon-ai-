'use client';

import { useState, useEffect, useCallback } from 'react';

export interface HistoryItem {
  id: string;
  message: string;
  timestamp: number;
}

const STORAGE_KEY = 'neon-chat-history';
const MAX_HISTORY = 50;

export function useHistoryManager() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setHistory(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
    setIsLoaded(true);
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save history:', error);
    }
  }, [history, isLoaded]);

  const addToHistory = useCallback((message: string) => {
    if (!message.trim()) return;
    
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      message: message.trim(),
      timestamp: Date.now(),
    };

    setHistory((prev) => [newItem, ...prev.slice(0, MAX_HISTORY - 1)]);
  }, []);

  const removeFromHistory = useCallback((id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const searchHistory = useCallback((query: string): HistoryItem[] => {
    if (!query.trim()) return history;
    const lowerQuery = query.toLowerCase();
    return history.filter((item) => item.message.toLowerCase().includes(lowerQuery));
  }, [history]);

  return {
    history,
    isLoaded,
    addToHistory,
    removeFromHistory,
    clearHistory,
    searchHistory,
  };
}
