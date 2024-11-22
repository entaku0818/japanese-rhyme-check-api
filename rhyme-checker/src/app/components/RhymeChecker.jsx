"use client"

import { useState } from 'react';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const RhymeChecker = () => {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checkRhyme = async () => {
    if (!text.trim()) {
      setError('テキストを入力してください');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:3000/check-rhyme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('API エラーが発生しました');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RhymeChecker;