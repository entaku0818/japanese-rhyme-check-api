// test/testApi.js
require('dotenv').config();
const admin = require('firebase-admin');
const fetch = require('node-fetch');
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithCustomToken } = require('firebase/auth');

// Firebaseクライアント初期化
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: `${process.env.FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.FIREBASE_PROJECT_ID
};

// クライアントSDKの初期化
const clientApp = initializeApp(firebaseConfig);

// Admin SDKの初期化
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  })
});

// カスタムトークンからIDトークンを取得
async function getIdToken(customToken) {
  const auth = getAuth(clientApp);
  const userCredential = await signInWithCustomToken(auth, customToken);
  const idToken = await userCredential.user.getIdToken();
  return idToken;
}

// APIをテストする関数
async function testApi(idToken) {
  const testCases = [
    {
      name: "基本的な韻",
      text: "空を見上げて 誰かを待ってて"
    },
    {
      name: "複数の韻",
      text: "雨が降って 心が踊って 未来が待ってる"
    },
    {
      name: "長めの文章",
      text: "明日への希望 胸に抱いて行こう 新しい道を探して"
    }
  ];

  console.log('\n=== API テスト開始 ===');

  try {
    // 1. 履歴取得APIのテスト
    console.log('\n1. GET /rhyme-history のテスト');
    let response = await fetch('http://localhost:3000/rhyme-history');
    let data = await response.json();
    console.log('履歴取得結果:', JSON.stringify(data, null, 2));

    // 2. 韻分析APIのテスト
    console.log('\n2. POST /check-rhyme のテスト');
    for (const testCase of testCases) {
      console.log(`\nテストケース: ${testCase.name}`);
      console.log(`テキスト: "${testCase.text}"`);
      
      response = await fetch('http://localhost:3000/check-rhyme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ text: testCase.text })
      });

      data = await response.json();
      console.log('分析結果:', JSON.stringify(data, null, 2));
      
      // APIレート制限を考慮して少し待機
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

  } catch (error) {
    console.error('テストエラー:', error);
  }
}

// メイン実行関数
async function runTests() {
  try {
    console.log('=== テスト実行開始 ===');
    
    // 1. カスタムトークンを生成
    console.log('\nステップ1: カスタムトークンを生成');
    const anonymousUser = await admin.auth().createUser({
      displayName: 'Anonymous User'
    });
    const customToken = await admin.auth().createCustomToken(anonymousUser.uid);
    console.log('Custom Token:', customToken);

    // 2. カスタムトークンからIDトークンを取得
    console.log('\nステップ2: IDトークンを取得');
    const idToken = await getIdToken(customToken);
    console.log('ID Token:', idToken);
    
    // 3. APIテストを実行
    console.log('\nステップ3: APIテストを実行');
    await testApi(idToken);
    
    console.log('\n=== テスト実行完了 ===');
  } catch (error) {
    console.error('実行エラー:', error);
  } finally {
    // Firebase Admin SDKの接続を終了
    await admin.app().delete();
    process.exit(0);
  }
}

// テストを実行
runTests();