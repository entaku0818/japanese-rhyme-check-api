// hooks/useRhymeAnalysis.ts
import { useState } from 'react';
import { User } from 'firebase/auth';
import { AnalysisResult } from '@/app/types';

interface UseRhymeAnalysisProps {
    apiUrl: string;
  }

export const useRhymeAnalysis = (user: User | null, { apiUrl }: UseRhymeAnalysisProps) => {
    const [text, setText] = useState<string>('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const checkRhyme = async (): Promise<void> => {
    if (!text.trim()) {
      setError('テキストを入力してください');
      return;
    }

    if (!user) {
      setError('分析するにはログインが必要です');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API エラーが発生しました');
      }

      setResult(await response.json());
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return { text, setText, result, loading, error, checkRhyme };
};
