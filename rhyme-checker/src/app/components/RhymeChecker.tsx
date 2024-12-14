"use client"

import { useState, useEffect } from 'react';
import { AlertCircle, Loader2, LogIn, Check, Copy, LogOut, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAuth } from './AuthProvider';
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { toast } from '@/hooks/use-toast';
import { auth } from '../firebase';
import { useRhymeAnalysis, useShare } from '@/hooks';

const RhymeChecker: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [isClient, setIsClient] = useState<boolean>(false);
  
  const { text, setText, result, loading, error, checkRhyme } = useRhymeAnalysis(user, {
    apiUrl: `${process.env.NEXT_PUBLIC_API_URL}/check-rhyme`  
  });

  const {
    shareUrl,
    isCopied,
    handleShare
  } = useShare(result, text);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleClear = () => {
    setText('');
    window.location.reload();
  };

  const handleLogin = async (): Promise<void> => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch {
      const errorMessage = 'ログインに失敗しました';
      toast({
        variant: "destructive",
        title: "エラー",
        description: errorMessage,
      });
    }
  };

  const handleLogout = async (): Promise<void> => {
    try {
      await signOut(auth);
      toast({ description: "ログアウトしました" });
    } catch {
      toast({
        variant: "destructive",
        description: "ログアウトに失敗しました"
      });
    }
  };

  const handleTwitterShare = () => {
    if (!shareUrl) return;
    
    const shareText = `韻判定チェッカーで分析してみた！\n韻のスコア: ${result?.rhymeScore}/100\nフローのスコア: ${result?.flowScore}/100`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
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
              <p className="text-gray-600">韻の分析を始めるにはログインしてください</p>
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
        {!result && (
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
              ) : '韻を分析する'}
            </button>
          </CardContent>
        )}
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
              <button
              onClick={handleTwitterShare}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
            >
              <X size={18} />
              共有
            </button>
            <button
                onClick={handleClear}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                終了
              </button>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="flex justify-end mt-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
        >
          <LogOut size={18} />
          ログアウト
        </button>
      </div>
    </div>
  );
};

export default RhymeChecker;