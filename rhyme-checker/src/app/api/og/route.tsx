// src/app/api/og/route.tsx
import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import React from 'react'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const rhymeScore = parseFloat(searchParams.get('rhymeScore') || '0')
    const flowScore = parseFloat(searchParams.get('flowScore') || '0')
    const text = searchParams.get('text') || ''

    return new ImageResponse(
      (
        <div
          style={{
            backgroundColor: '#1a1a1a',
            height: '100%',
            width: '100%',
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
            color: 'white',
          }}
        >
          {/* スコア表示 */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: '#2a2a2a',
                padding: '20px',
                borderRadius: '12px',
                width: '45%',
              }}
            >
              <div style={{ fontSize: '24px', color: '#888' }}>韻の評価</div>
              <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#4CAF50' }}>
                {rhymeScore.toFixed(1)}
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: '#2a2a2a',
                padding: '20px',
                borderRadius: '12px',
                width: '45%',
              }}
            >
              <div style={{ fontSize: '24px', color: '#888' }}>フロウの評価</div>
              <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#2196F3' }}>
                {flowScore.toFixed(1)}
              </div>
            </div>
          </div>

          {/* テキスト表示 */}
          <div
            style={{
              fontSize: '32px',
              lineHeight: '1.4',
              margin: '20px 0',
              padding: '20px',
              background: '#2a2a2a',
              borderRadius: '12px',
              flex: 1,
              wordBreak: 'break-all',
            }}
          >
            {text}
          </div>

        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (error) {
    console.error('OG画像生成エラー:', error);
    
    // エラー時のフォールバック画像を返す
    return new ImageResponse(
      (
        <div
          style={{
            backgroundColor: '#1a1a1a',
            height: '100%',
            width: '100%',
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}
        >
          <div style={{ fontSize: '32px', color: '#ff4444' }}>
            画像の生成に失敗しました
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  }
}