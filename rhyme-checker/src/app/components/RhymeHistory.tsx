"use client"
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, Heart, User } from 'lucide-react';
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
    <div className="mx-auto p-2 sm:p-4 space-y-4 w-full max-w-full sm:max-w-2xl">
      <Card className="w-full">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <CardTitle className="text-base sm:text-lg">分析履歴</CardTitle>
            <div className="flex flex-wrap gap-2">
              {Object.entries(SORT_OPTIONS).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => changeSort(value as SortOption)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded text-sm transition-colors",
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
            <div 
              key={item.id} 
              className="border rounded-lg p-3 sm:p-4 space-y-2 text-sm sm:text-base"
            >
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                {item.userPhotoURL ? (
                  <img 
                    src={item.userPhotoURL}
                    alt={item.userName}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/default-avatar.png';
                    }}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-gray-500" />
                  </div>
                )}
                <div className="font-medium break-words">{item.userName}</div>
                <div className="text-gray-500 text-xs sm:text-sm break-words">
                  {new Date(item.createdAt).toLocaleString()}
                </div>
              </div>
              <p className="text-gray-800 text-base sm:text-lg break-words">
                {item.text}
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                <div className="flex space-x-4 text-sm sm:text-base">
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
              className="w-full p-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm sm:text-base"
            >
              もっと見る
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};