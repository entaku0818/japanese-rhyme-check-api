// src/app/api/og/route.tsx
import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

interface RhymeAnalysis {
  text: string;
  analysis: {
    rhymeScore: number;
    flowScore: number;
  };
  userName: string;
  createdAt: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      throw new Error('ID is required')
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/rhyme-analysis/${id}`,
      { next: { revalidate: 60 } } 
    );

    if (!response.ok) {
      throw new Error(response.status === 404 ? 'Document not found' : 'Failed to fetch data');
    }

    const data: RhymeAnalysis = await response.json();

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
                {data.analysis.rhymeScore.toFixed(1)}
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
              <div style={{ fontSize: '24px', color: '#888' }}>フローの評価</div>
              <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#2196F3' }}>
                {data.analysis.flowScore.toFixed(1)}
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
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
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {data.text}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              fontSize: '20px',
              color: '#888',
              marginTop: '20px',
              paddingRight: '20px'
            }}
          >
            <div style={{ color: 'white' }}>
              韻を踏んだらいい韻じゃない？
            </div>
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