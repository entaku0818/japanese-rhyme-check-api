"use client"

import { useState, useEffect } from 'react';
import { AlertCircle, Loader2, LogIn, Share2, Check, Copy } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAuth } from './AuthProvider';
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

import { toast } from '@/hooks/use-toast';
import { auth } from '../firebase';

interface RhymePattern {
  type: string;
  words: string[];
  description: string;
}

interface AnalysisResult {
  rhymeScore: number;
  flowScore: number;
  rhymePatterns: RhymePattern[];
  improvement?: string;
}

const RhymeChecker: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [text, setText] = useState<string>('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isClient, setIsClient] = useState<boolean>(false);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (result) {
      const baseUrl = window.location.origin;
      const ogpUrl = new URL(`${baseUrl}/api/og`);
      
      // OGP画像用のパラメータを設定
      ogpUrl.searchParams.set('rhymeScore', result.rhymeScore.toString());
      ogpUrl.searchParams.set('flowScore', result.flowScore.toString());
      ogpUrl.searchParams.set('text', text);
      ogpUrl.searchParams.set('patterns', encodeURIComponent(JSON.stringify(result.rhymePatterns)));

      setShareUrl(ogpUrl.toString());
    }
  }, [result, text]);

  const handleLogin = async (): Promise<void> => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account',
        // Cookieを許可
        cookie_policy: 'single_host_origin',
      });
      
      console.log('ログイン開始...');  // デバッグログ
      const result = await signInWithPopup(auth, provider);
      console.log('ログイン成功:', result.user.email);  // デバッグログ
      
    } catch (error: any) {  // エラー型を any に変更
      console.error('ログインエラーの詳細:', error);  // 詳細なエラー情報
      
      // FirebaseAuthError の詳細情報を表示
      if (error.code) {
        console.error('エラーコード:', error.code);
      }
      if (error.message) {
        console.error('エラーメッセージ:', error.message);
      }
      
      let errorMessage = 'ログインに失敗しました';
      
      // 具体的なエラーメッセージを設定
      switch (error.code) {
        case 'auth/popup-blocked':
          errorMessage = 'ポップアップがブロックされました。ポップアップを許可してください。';
          break;
        case 'auth/popup-closed-by-user':
          errorMessage = 'ログインがキャンセルされました。';
          break;
        case 'auth/unauthorized-domain':
          errorMessage = '現在のドメインでの認証が許可されていません。';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Google認証が有効になっていません。';
          break;
        default:
          errorMessage = `ログインエラー: ${error.message}`;
      }
      
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "エラー",
        description: errorMessage,
      });
    }
  };

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
      
      const response = await fetch('http://localhost:3000/check-rhyme', {
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

      const data: AnalysisResult = await response.json();
      setResult(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

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

  if (!isClient || authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="animate-spin" size={24} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">韻判定チェッカーへようこそ</h2>
              <p className="text-gray-600">
                韻の分析を始めるにはログインしてください
              </p>
            </div>
            <button
              onClick={handleLogin}
              className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-black rounded-lg hover:bg-gray-50 transition-colors"
            >
              <LogIn size={20} />
              Googleでログイン
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>韻判定チェッカー</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-32 p-2 border rounded-md"
            placeholder="テキストを入力してください..."
          />
          <button
            onClick={checkRhyme}
            disabled={loading}
            className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 disabled:bg-blue-300 flex items-center justify-center"
          >
            {loading ? (
              <><Loader2 className="animate-spin mr-2" size={18} /> 分析中...</>
            ) : (
              '韻を分析する'
            )}
          </button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">韻のスコア</h3>
                <div className="text-2xl font-bold">{result.rhymeScore}/100</div>
              </div>
              <div>
                <h3 className="font-medium">フローのスコア</h3>
                <div className="text-2xl font-bold">{result.flowScore}/100</div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">検出された韻のパターン</h3>
              {result.rhymePatterns.map((pattern, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-md mb-2">
                  <div className="font-medium text-sm text-gray-600">{pattern.type}</div>
                  <div className="text-sm">単語: {pattern.words.join(', ')}</div>
                  <div className="text-sm text-gray-600">{pattern.description}</div>
                </div>
              ))}
            </div>

            {result.improvement && (
              <div>
                <h3 className="font-medium mb-2">改善案</h3>
                <div className="bg-blue-50 p-3 rounded-md text-sm">
                  {result.improvement}
                </div>
              </div>
            )}
            <div className="flex justify-end mt-4">
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  {isCopied ? <Check size={18} /> : <Copy size={18} />}
                  {isCopied ? 'コピーしました' : 'URLをコピー'}
                </button>
              </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RhymeChecker;