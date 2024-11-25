// components/RhymeHistory.tsx
"use client"
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useRhymeHistory } from '@/hooks/useRhymeHistory';

export const RhymeHistory: React.FC = () => {
  const { history, loading, error, hasMore, loadMore } = useRhymeHistory();

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>分析履歴</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="text-red-500">{error}</div>
          )}
          
          {history.map((item) => (
            <div key={item.id} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center space-x-2">
                {item.userPhotoURL && (
                  <img 
                    src={item.userPhotoURL} 
                    alt={item.userName} 
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div className="font-medium">{item.userName}</div>
                <div className="text-sm text-gray-500">
                  {new Date(item.createdAt).toLocaleString()}
                </div>
              </div>
              <p className="text-gray-700">{item.text}</p>
              <div className="flex space-x-4">
                <div>韻スコア: {item.analysis.rhymeScore}</div>
                <div>フロースコア: {item.analysis.flowScore}</div>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-center p-4">
              <Loader2 className="animate-spin" />
            </div>
          )}
          
          {hasMore && !loading && (
            <button
              onClick={loadMore}
              className="w-full p-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              もっと見る
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};