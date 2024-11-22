# Japanese Rhyme Analysis API

日本語のテキストの韻やフローを分析する REST API です。

## 機能

- 韻の強さを数値化（0-100）
- 韻のパターンを検出（頭韻、脚韻、母音韻など）
- テキストの流れやリズムを評価
- 改善案の提案

## インストール

```bash
npm install
```

`.env`ファイルを作成し、OpenAI APIキーを設定:

```
OPENAI_API_KEY=your_api_key_here
```

## 使用方法

サーバーの起動:

```bash
npm start
```

APIリクエストの例:

```bash
curl -X POST http://localhost:3000/check-rhyme \
  -H "Content-Type: application/json" \
  -d '{"text": "空を見上げて 誰かを待ってて"}'
```

## レスポンス形式

```json
{
  "rhymeScore": 85,
  "rhymePatterns": [
    {
      "words": ["見上げて", "待ってて"],
      "type": "語尾韻",
      "description": "「て」で韻を踏んでいる"
    }
  ],
  "flowScore": 90,
  "improvement": ""
}
```

## エラーハンドリング

- 400: テキストが指定されていない
- 500: API制限、解析エラーなど

## ライセンス

MIT