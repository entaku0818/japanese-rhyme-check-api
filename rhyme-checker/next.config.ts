// next.config.ts
import type { NextConfig } from 'next'

const config: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
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