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

    // APIからデータを取得
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
              <div style={{ fontSize: '24px', color: '#888' }}>フロウの評価</div>
              <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#2196F3' }}>
                {data.analysis.flowScore.toFixed(1)}
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
            {data.text}
          </div>

          {/* フッター */}
          <div
            style={{
              fontSize: '20px',
              color: '#888',
              textAlign: 'right',
              marginTop: '20px',
              paddingRight: '20px'
            }}
          >
            <a 
              href="https://rhyme-check.vercel.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                textDecoration: 'none',
                color: 'inherit',
                transition: 'color 0.2s ease',
              }}
              onMouseOver={(e) => e.currentTarget.style.color = '#666'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#888'}
            >
              韻を踏んだらいい韻じゃない？
            </a>
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