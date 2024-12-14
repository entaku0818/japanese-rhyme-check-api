require('dotenv').config();
const express = require('express');
const OpenAI = require('openai');
const cors = require('cors');
const admin = require('firebase-admin');
const { version } = require('./package.json');


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
  origin: '*',
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    version,
    timestamp: new Date().toISOString(),
    status: 'ok'
  });
});

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
    const limit = parseInt(req.query.limit) || 20;
    const startAfter = req.query.startAfter;
    const sortBy = req.query.sort || 'newest'; 

    console.log('Request params:', { limit, startAfter, sortBy });

    let query = db.collection('rhymeAnalysis');
    
    switch (sortBy) {
      case 'oldest':
        query = query.orderBy('createdAt', 'asc');
        break;
      case 'likes':
        query = query.orderBy('likeCount', 'desc')
                    .orderBy('createdAt', 'desc'); 
        break;
      case 'newest':
      default:
        query = query.orderBy('createdAt', 'desc');
        break;
    }

    query = query.limit(limit);

    if (startAfter) {
      const startAfterDoc = await db.collection('rhymeAnalysis').doc(startAfter).get();
      console.log('StartAfter document exists:', startAfterDoc.exists);
      if (startAfterDoc.exists) {
        const startAfterData = startAfterDoc.data();
        query = query.startAfter(startAfterDoc);
      }
    }

    const snapshot = await query.get();
    
    const history = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      history.push({
        id: doc.id,
        text: data.text,
        analysis: data.analysis,
        createdAt: data.createdAt.toDate(),
        userName: data.userName || 'Anonymous',
        userPhotoURL: data.userPhotoURL || null,
        likeCount: data.likeCount || 0
      });
    });

    const lastDoc = snapshot.docs[snapshot.docs.length - 1];
    

    res.json({
      items: history,
      nextPageToken: lastDoc ? lastDoc.id : null,
      hasMore: history.length === limit,
      sortBy
    });
  } catch (error) {
    console.error('Firestore Error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      error: '履歴の取得に失敗しました'
    });
  }
});

// 韻の分析と保存を行うエンドポイント（認証必要）
app.post('/check-rhyme', authenticateUser, async (req, res) => {
  const { text } = req.body;
  const userId = req.user.uid;
  const userName = req.user.name || 'Anonymous';
  const userPhotoURL = req.user.picture || null;

  if (!text) {
    return res.status(400).json({
      error: 'テキストを指定してください'
    });
  }

  try {
    const result = await evaluateRhyme(text);

    const docRef = await db.collection('rhymeAnalysis').add({
      userId,
      text,
      analysis: result,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      userName,
      userPhotoURL,
      likeCount: 0 
    });

    res.json({
      id: docRef.id,
      text,
      userName,
      userPhotoURL,
      likeCount: 0, 
      ...result
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// ユーザープロフィール作成/更新エンドポイント
app.post('/user/profile', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { displayName, photoURL } = req.body;

    // 入力値の検証
    if (displayName && (displayName.length < 2 || displayName.length > 30)) {
      return res.status(400).json({ error: '表示名は2文字以上30文字以内で指定してください' });
    }

    if (photoURL && !photoURL.match(/^https?:\/\/.+/)) {
      return res.status(400).json({ error: '画像URLが不正です' });
    }

    // ユーザープロフィールの更新
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    const userData = {
      displayName: displayName || null,
      photoURL: photoURL || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (!userDoc.exists) {
      // 新規ユーザーの場合
      userData.createdAt = admin.firestore.FieldValue.serverTimestamp();
      await userRef.set(userData);
    } else {
      // 既存ユーザーの場合
      await userRef.update(userData);
    }


    res.json({
      message: 'プロフィールを更新しました',
      profile: userData
    });

  } catch (error) {
    console.error('Profile Update Error:', error);
    res.status(500).json({
      error: 'プロフィールの更新に失敗しました'
    });
  }
});


const getLikeStatus = async (userId, analysisId) => {
  const likeRef = db.collection('likes')
    .where('userId', '==', userId)
    .where('analysisId', '==', analysisId)
    .limit(1);
  
  const snapshot = await likeRef.get();
  return !snapshot.empty;
};

// いいね数を取得するエンドポイント
app.get('/rhyme-analysis/:id/likes', async (req, res) => {
  try {
    const { id } = req.params;
    const likeCountRef = db.collection('rhymeAnalysis').doc(id);
    const doc = await likeCountRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: '分析が見つかりません' });
    }

    const likeCount = doc.data().likeCount || 0;
    
    // ユーザーが認証されている場合、いいね状態も返す
    let isLiked = false;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        isLiked = await getLikeStatus(decodedToken.uid, id);
      } catch (error) {
        console.error('認証エラー:', error);
      }
    }

    res.json({
      likeCount,
      isLiked
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'いいね数の取得に失敗しました' });
  }
});

// いいねを追加/削除するエンドポイント
app.post('/rhyme-analysis/:id/like', authenticateUser, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.uid;

  try {
    const analysisRef = db.collection('rhymeAnalysis').doc(id);
    const analysisDoc = await analysisRef.get();

    if (!analysisDoc.exists) {
      return res.status(404).json({ error: '分析が見つかりません' });
    }

    const batch = db.batch();
    const likeRef = db.collection('likes').doc(`${userId}_${id}`);
    const likeDoc = await likeRef.get();

    if (likeDoc.exists) {
      // いいねを削除
      batch.delete(likeRef);
      batch.update(analysisRef, {
        likeCount: admin.firestore.FieldValue.increment(-1)
      });
    } else {
      // いいねを追加
      batch.set(likeRef, {
        userId,
        analysisId: id,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      batch.update(analysisRef, {
        likeCount: admin.firestore.FieldValue.increment(1)
      });
    }

    await batch.commit();

    // 更新後の状態を取得
    const updatedAnalysis = await analysisRef.get();
    const likeCount = updatedAnalysis.data().likeCount || 0;
    const isLiked = !likeDoc.exists;

    res.json({
      likeCount,
      isLiked
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'いいねの処理に失敗しました' });
  }
});

app.get('/rhyme-analysis/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = db.collection('rhymeAnalysis').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: '分析が見つかりませんでした' });
    }

    const data = doc.data();
    
    // ユーザーが認証されている場合、いいね状態も取得
    let isLiked = false;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        isLiked = await getLikeStatus(decodedToken.uid, id);
      } catch (error) {
        console.error('認証エラー:', error);
      }
    }

    res.json({
      id: doc.id,
      text: data.text,
      analysis: data.analysis,
      createdAt: data.createdAt.toDate(),
      userName: data.userName || 'Anonymous',
      userPhotoURL: data.userPhotoURL || null,
      likeCount: data.likeCount || 0,
      isLiked
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: '分析の取得に失敗しました' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});