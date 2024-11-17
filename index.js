require('dotenv').config();
const express = require('express');
const OpenAI = require('openai');
const app = express();

app.use(express.json());

if (!process.env.OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY is not set in environment variables');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function evaluateRhyme(text) {
  const prompt = `
以下の日本語テキストに含まれる韻を分析し、必ずJSON形式で回答してください。
他の説明は一切不要です。

テキスト: "${text}"

以下の形式の JSON だけを返してください：
スコアはちゃんと0から100の間の数値で返してください。あなたは厳しめの評価者です。
{
  "rhymeScore": （0から100の間の数値。韻の強さを表す）,
  "rhymePatterns": [
    {
      "words": [韻を踏んでいる単語や句の配列],
      "type": "韻のタイプ（頭韻、脚韻、母音韻など）",
      "description": "その韻についての簡単な説明（30文字以内）"
    }
  ],
  "flowScore": （0から100の間の数値。文章の流れやリズムの良さ）,
  "improvement": （改善案。ない場合は空文字。50文字以内）
}

例えば、「空を見上げて 誰かを待ってて」というテキストなら：
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
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "あなたは日本語の韻とフロウの専門家です。ラップやポエトリーの分析に長けています。必ずJSON形式で回答してください。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const content = response.choices[0].message.content.trim();
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('JSONが見つかりませんでした');
      }
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw content:', content);
      throw new Error('応答の解析に失敗しました');
    }
  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    if (error.code === 'insufficient_quota') {
      throw new Error('APIの利用制限に達しました。しばらく待ってから再試行してください。');
    } else if (error.code === 'rate_limit_exceeded') {
      throw new Error('APIリクエストが多すぎます。しばらく待ってから再試行してください。');
    } else {
      throw new Error('分析中にエラーが発生しました: ' + error.message);
    }
  }
}


// APIエンドポイント
app.post('/check-rhyme', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({
      error: 'テキストを指定してください'
    });
  }

  try {
    const result = await evaluateRhyme(text);
    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});