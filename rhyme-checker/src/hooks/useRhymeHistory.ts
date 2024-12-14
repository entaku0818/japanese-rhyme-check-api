"use client"
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/app/components/AuthProvider';

type SortOption = 'newest' | 'oldest' | 'likes';

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
  likeCount: number;
  isLiked?: boolean;
}

interface RhymeHistoryResponse {
  items: RhymeHistoryItem[];
  nextPageToken: string | null;
  hasMore: boolean;
}

interface LikeResponse {
  likeCount: number;
  isLiked: boolean;
}

export const useRhymeHistory = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<RhymeHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasMore, setHasMore] = useState(true);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const fetchHistory = async (pageToken?: string, sort: SortOption = sortBy) => {
    setLoading(true);
    setError('');
    
    try {
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/rhyme-history`);
      url.searchParams.set('sort', sort);
      if (pageToken) {
        url.searchParams.set('startAfter', pageToken);
      }

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('履歴の取得に失敗しました');

      const data: RhymeHistoryResponse = await response.json();
      
      // ユーザーがログインしている場合、各項目のいいね状態を取得
      if (user) {
        const itemsWithLikeStatus = await Promise.all(
          data.items.map(async (item) => {
            const likeStatus = await fetchLikeStatus(item.id);
            return { ...item, isLiked: likeStatus.isLiked };
          })
        );
        setHistory(prev => pageToken ? [...prev, ...itemsWithLikeStatus] : itemsWithLikeStatus);
      } else {
        setHistory(prev => pageToken ? [...prev, ...data.items] : data.items);
      }
      
      setNextPageToken(data.nextPageToken);
      setHasMore(data.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : '履歴の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const changeSort = async (newSort: SortOption) => {
    if (newSort !== sortBy) {
      setSortBy(newSort);
      setNextPageToken(null);
      await fetchHistory(undefined, newSort);
    }
  };

  const fetchLikeStatus = async (analysisId: string): Promise<LikeResponse> => {
    if (!user) return { likeCount: 0, isLiked: false };

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/rhyme-analysis/${analysisId}/likes`,
        {
          headers: {
            Authorization: `Bearer ${await user.getIdToken()}`
          }
        }
      );
      if (!response.ok) throw new Error('いいね状態の取得に失敗しました');
      return await response.json();
    } catch (err) {
      console.error('Error fetching like status:', err);
      return { likeCount: 0, isLiked: false };
    }
  };

  const toggleLike = async (analysisId: string) => {
    if (!user) {
      toast({
        description: "いいねするにはログインが必要です",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/rhyme-analysis/${analysisId}/like`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${await user.getIdToken()}`
          }
        }
      );

      if (!response.ok) throw new Error('いいねの処理に失敗しました');

      const data: LikeResponse = await response.json();
      
      // 履歴の状態を更新
      setHistory(prev => prev.map(item => 
        item.id === analysisId
          ? { ...item, likeCount: data.likeCount, isLiked: data.isLiked }
          : item
      ));

    } catch (err) {
      console.error('Error toggling like:', err);
      toast({
        description: "いいねの処理に失敗しました",
        variant: "destructive"
      });
    }
  };

  const loadMore = () => {
    if (hasMore && !loading && nextPageToken) {
      fetchHistory(nextPageToken);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]); 

  return { 
    history, 
    loading, 
    error, 
    hasMore, 
    loadMore,
    toggleLike,
    sortBy,
    changeSort
  };
};