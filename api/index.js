require('dotenv').config();
const express = require('express');
const OpenAI = require('openai');
const cors = require('cors');
const admin = require('firebase-admin');

// Firebase Admin SDKの初期化
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  })
});

// Firestoreの初期化
const db = admin.firestore();

const app = express();

app.use(cors({
  origin: 'http://localhost:8080',
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// 認証ミドルウェア
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '認証が必要です' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('認証エラー:', error);
    res.status(401).json({ error: '認証に失敗しました' });
  }
};

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
      throw new Error('分析中にエラーが発生しました: ' + error.code + ":" + error.message);
    }
  }
}

// 全体の履歴を取得するエンドポイント（認証不要）
app.get('/rhyme-history', async (req, res) => {
  try {
    // ページネーションのためのパラメータ
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const startAfter = req.query.startAfter;

    let query = db.collection('rhymeAnalysis')
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (startAfter) {
      const startAfterDoc = await db.collection('rhymeAnalysis').doc(startAfter).get();
      if (startAfterDoc.exists) {
        query = query.startAfter(startAfterDoc);
      }
    }

    const snapshot = await query.get();
    
    const history = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      // ユーザー情報を取得（非同期処理は省略）
      history.push({
        id: doc.id,
        text: data.text,
        analysis: data.analysis,
        createdAt: data.createdAt.toDate(),
        userName: data.userName || 'Anonymous',
        userPhotoURL: data.userPhotoURL || null
      });
    });

    const lastDoc = snapshot.docs[snapshot.docs.length - 1];
    
    res.json({
      items: history,
      nextPageToken: lastDoc ? lastDoc.id : null,
      hasMore: history.length === limit
    });
  } catch (error) {
    console.error('Firestore Error:', error);
    res.status(500).json({
      error: '履歴の取得に失敗しました'
    });
  }
});

// 韻の分析と保存を行うエンドポイント（認証必要）
app.post('/check-rhyme', authenticateUser, async (req, res) => {
  const { text } = req.body;
  const userId = req.user.uid;

  if (!text) {
    return res.status(400).json({
      error: 'テキストを指定してください'
    });
  }

  try {
    // ユーザー情報を取得
    const result = await evaluateRhyme(text);

    // Firestoreに分析結果を保存
    const docRef = await db.collection('rhymeAnalysis').add({
      userId,
      text,
      analysis: result,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      id: docRef.id,
      text,
      ...result
    });
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