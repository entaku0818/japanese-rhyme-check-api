// hooks/useShare.ts
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { AnalysisResult } from '@/app/types';

export const useShare = (result: AnalysisResult | null, text: string) => {
  const [shareUrl, setShareUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  useEffect(() => {
    if (result) {
      const baseUrl = window.location.origin;
      const ogpUrl = new URL(`${baseUrl}/api/og`);
      ogpUrl.searchParams.set('rhymeScore', result.rhymeScore.toString());
      ogpUrl.searchParams.set('flowScore', result.flowScore.toString());
      ogpUrl.searchParams.set('text', text);
      ogpUrl.searchParams.set('patterns', encodeURIComponent(JSON.stringify(result.rhymePatterns)));
      setShareUrl(ogpUrl.toString());
    }
  }, [result, text]);

  const handleShare = async (): Promise<void> => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      toast({
        description: "URLをクリップボードにコピーしました",
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('共有に失敗しました:', error);
      toast({
        variant: "destructive",
        description: "コピーに失敗しました",
      });
    }
  };

  return { shareUrl, isCopied, handleShare };
};