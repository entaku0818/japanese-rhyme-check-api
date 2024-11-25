// hooks/useRhymeHistory.ts
"use client"
import { useState, useEffect } from 'react';

interface RhymeHistoryItem {
  id: string;
  text: string;
  analysis: {
    rhymeScore: number;
    flowScore: number;
    rhymePatterns: Array<{
      words: string[];
      type: string;
      description: string;
    }>;
  };
  createdAt: string;
  userName: string;
  userPhotoURL: string | null;
}

interface RhymeHistoryResponse {
  items: RhymeHistoryItem[];
  nextPageToken: string | null;
  hasMore: boolean;
}

export const useRhymeHistory = () => {
  const [history, setHistory] = useState<RhymeHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasMore, setHasMore] = useState(true);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);

  const fetchHistory = async (pageToken?: string) => {
    setLoading(true);
    setError('');
    
    try {
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/rhyme-history`);
      if (pageToken) {
        url.searchParams.set('startAfter', pageToken);
      }

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('履歴の取得に失敗しました');

      const data: RhymeHistoryResponse = await response.json();
      
      setHistory(prev => pageToken ? [...prev, ...data.items] : data.items);
      setNextPageToken(data.nextPageToken);
      setHasMore(data.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : '履歴の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading && nextPageToken) {
      fetchHistory(nextPageToken);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return { history, loading, error, hasMore, loadMore };
};