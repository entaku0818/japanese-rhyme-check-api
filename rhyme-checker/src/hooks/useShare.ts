import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

interface ShareProps {
  id: string | null;
  text: string;
}

export const useShare = ({ id, text }: ShareProps) => {
  const [shareUrl, setShareUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  useEffect(() => {
    if (id) {
      const baseUrl = window.location.origin;
      const ogpUrl = new URL(`${baseUrl}/api/og`);
      ogpUrl.searchParams.set('id', id);
      setShareUrl(ogpUrl.toString());
    }
  }, [id]);

  const handleShare = async (): Promise<void> => {
    if (!shareUrl) return;

    try {
      // シェアするテキストを作成
      const shareText = `韻判定チェッカーで分析してみた！\n${text}\n`;
      const fullShareText = `${shareText}${shareUrl}`;

      await navigator.clipboard.writeText(fullShareText);
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

  const handleTwitterShare = async (): Promise<void> => {
    if (!shareUrl) return;

    const shareText = `韻判定チェッカーで分析してみた！\n${text}\n`;
    const twitterUrl = new URL('https://twitter.com/intent/tweet');
    twitterUrl.searchParams.set('text', shareText);
    twitterUrl.searchParams.set('url', shareUrl);

    window.open(twitterUrl.toString(), '_blank', 'noopener,noreferrer');
  };

  return { 
    shareUrl, 
    isCopied, 
    handleShare,
    handleTwitterShare 
  };
};