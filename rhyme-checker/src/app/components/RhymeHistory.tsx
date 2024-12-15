"use client"
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, Heart, User, Clock, ThumbsUp } from 'lucide-react';
import { SORT_OPTIONS, SortOption, useRhymeHistory } from '@/hooks/useRhymeHistory';
import { cn } from '@/lib/utils';

export const RhymeHistory: React.FC = () => {
  const { 
    history, 
    loading, 
    error, 
    hasMore, 
    loadMore, 
    toggleLike,
    sortBy,
    changeSort 
  } = useRhymeHistory();

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>分析履歴</CardTitle>
            <div className="flex gap-2">
            {Object.entries(SORT_OPTIONS).map(([value, label]) => (
              <button
                key={value}
                onClick={() => changeSort(value as SortOption)}
                className={cn(
                  "flex items-center gap-1 px-3 py-1.5 rounded text-sm transition-colors",
                  sortBy === value
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                {label}
              </button>
            ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="text-red-500">{error}</div>
          )}
          
          {history.map((item) => (
            <div key={item.id} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center space-x-2">
                {item.userPhotoURL ? (
                  <img 
                    src={item.userPhotoURL}
                    alt={item.userName}
                    className="w-8 h-8 rounded-full"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/default-avatar.png';
                    }}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-500" />
                  </div>
                )}
                <div className="font-medium">{item.userName}</div>
                <div className="text-sm text-gray-500">
                  {new Date(item.createdAt).toLocaleString()}
                </div>
              </div>
              <p className="text-lg text-gray-800">{item.text}</p>
              <div className="flex items-center justify-between">
                <div className="flex space-x-4">
                  <div>韻スコア: {item.analysis.rhymeScore}</div>
                  <div>フロースコア: {item.analysis.flowScore}</div>
                </div>
                <button
                  onClick={() => toggleLike(item.id)}
                  className="flex items-center gap-1 px-3 py-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <Heart 
                    className={cn(
                      "w-4 h-4 transition-colors",
                      item.isLiked ? "fill-red-500 text-red-500" : "text-gray-500"
                    )}
                  />
                  <span className="text-sm text-gray-700">
                    {item.likeCount || 0}
                  </span>
                </button>
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