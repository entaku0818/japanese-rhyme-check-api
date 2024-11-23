// next.config.ts
import type { NextConfig } from 'next'

const config: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups'  // ポップアップを許可しつつ、セキュリティも確保
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless'  // 追加のセキュリティレイヤー
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-site'  // 同じサイトからのリソース読み込みのみを許可
          }
        ],
      },
    ]
  },
}

export default config