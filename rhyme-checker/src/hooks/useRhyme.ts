"use client"
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/app/components/AuthProvider';

interface RhymeAnalysis {
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

interface LikeResponse {
  likeCount: number;
  isLiked: boolean;
}

export const useRhyme = (analysisId: string) => {
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<RhymeAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchAnalysis = async () => {
    setLoading(true);
    setError('');
    
    try {
      const headers: HeadersInit = {};
      if (user) {
        const token = await user.getIdToken();
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/rhyme-analysis/${analysisId}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(response.status === 404 ? '分析が見つかりませんでした' : '分析の取得に失敗しました');
      }

      const data: RhymeAnalysis = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async () => {
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
      
      // 分析の状態を更新
      setAnalysis(prev => 
        prev ? { 
          ...prev, 
          likeCount: data.likeCount, 
          isLiked: data.isLiked 
        } : null
      );

    } catch (err) {
      console.error('Error toggling like:', err);
      toast({
        description: "いいねの処理に失敗しました",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (analysisId) {
      fetchAnalysis();
    }
  }, [analysisId, user]); // analysisIdまたはuserが変更されたら再取得

  const refresh = () => {
    fetchAnalysis();
  };

  return { 
    analysis, 
    loading, 
    error,
    toggleLike,
    refresh
  };
};