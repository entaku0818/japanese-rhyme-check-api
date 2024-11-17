const express = require("express");
const kuromoji = require("kuromoji");
const app = express();
const port = 3000;

// JSONボディの解析ミドルウェア
app.use(express.json());


// 日本語をひらがなに変換する関数
const toHiragana = (text) => {
  return text
    .replace(/[ァ-ン]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60)) // カタカナ → ひらがな
    .replace(/[\u30fc]/g, ""); // 長音記号（ー）を除去
};

// 韻を判定する関数
function doesJapaneseRhyme(word1, word2) {
    const kuromoji = require("kuromoji");
  
    const getVowels = (text, callback) => {
        const hiraganaText = toHiragana(text); // ひらがなに変換
        kuromoji.builder({ dicPath: "node_modules/kuromoji/dict/" }).build((err, tokenizer) => {
          if (err) {
            console.error("形態素解析の初期化エラー:", err);
            callback(null);
            return;
          }
          const tokens = tokenizer.tokenize(hiraganaText);
          console.log(`Tokens for "${hiraganaText}":`, tokens); // トークンをログに出力
      
          if (tokens.length === 0) {
            console.error(`"${text}" の形態素解析結果が空です`);
            callback(null);
            return;
          }
      
          // 全てのトークンの読みを結合
          const fullReading = tokens.map((token) => token.reading || "").join("");
          console.log(`Full reading for "${text}": ${fullReading}`);
      
          if (fullReading) {
            console.log(`Full reading before vowel extraction: ${fullReading}`);
            const vowels = fullReading
              .replace(/[^アイウエオン]/g, "") // 母音と「ン」のみを残す
              .replace(/ー/g, ""); // 長音記号を削除
            console.log(`Extracted vowels: ${vowels}`);
            callback(vowels);
          } else {
            console.error(`"${text}" の読みが取得できませんでした`);
            callback(null);
          }
        });
      };
      
  
    const calculateSimilarity = (vowels1, vowels2) => {
      const minLength = Math.min(vowels1.length, vowels2.length);
      let matchCount = 0;
  
      for (let i = 1; i <= minLength; i++) {
        if (vowels1[vowels1.length - i] === vowels2[vowels2.length - i]) {
          matchCount++;
        }
      }
  
      const similarity = matchCount / minLength; // 一致率を計算
      console.log(`Similarity between "${vowels1}" and "${vowels2}" is: ${similarity}`);
      return similarity;
    };
  
    return new Promise((resolve) => {
      getVowels(word1, (vowels1) => {
        getVowels(word2, (vowels2) => {
          if (!vowels1 || !vowels2) {
            console.error("母音抽出に失敗しました");
            resolve(false);
          } else {
            const similarity = calculateSimilarity(vowels1, vowels2);
            resolve(similarity >= 0.5); // 類似性が50%以上なら韻を踏んでいると判定
          }
        });
      });
    });
  }
  

  

// 韻判定API
app.post("/check-rhyme", async (req, res) => {
  const { text1, text2 } = req.body;

  if (!text1 || !text2) {
    return res.status(400).json({ error: "Both 'text1' and 'text2' are required." });
  }

  try {
    const result = await doesJapaneseRhyme(text1, text2);
    res.json({ text1, text2, doesRhyme: result });
  } catch (error) {
    res.status(500).json({ error: "Error during rhyme check." });
  }
});

// サーバー起動
app.listen(port, () => {
  console.log(`日本語韻判定APIが http://localhost:${port} で起動しました`);
});
