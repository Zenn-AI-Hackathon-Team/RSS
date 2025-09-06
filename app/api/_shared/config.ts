export const config = {
  // 自動カテゴリ付与のフラグ（環境変数ではなくここで制御）
  // true: 有効 / false: 無効
  enableAutoCategory: true,
  // しきい値未満など曖昧な場合にLLMを使うか（llm_onlyモードでは常に使用）
  enableAutoCategoryLLM: true,

  // 埋め込み類似度を採用するしきい値（0〜1）
  autoCategoryThreshold: (() => {
    const v = Number(process.env.AUTO_CATEGORY_THRESHOLD ?? "0.3");
    return Number.isFinite(v) ? v : 0.3;
  })(),

  // 使うモデル名やAPIエンドポイント
  embeddingModel:
    process.env.AUTO_CATEGORY_EMBEDDING_MODEL || "text-embedding-3-small",
  llmModel: process.env.AUTO_CATEGORY_LLM_MODEL || "gpt-4o-mini",
  openaiBaseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  openaiApiKey: process.env.OPENAI_API_KEY || "",

  // 自動分類のモード（環境変数ではなくここで制御）
  // 'embedding_first': 埋め込みでの一致がしきい値未満のときだけ LLM を使う（既定）
  // 'llm_only': 常に LLM のみで判定（埋め込みは使わない）
  autoCategoryMode: 'embedding_first' as 'embedding_first' | 'llm_only',

  // Gemini フォールバック設定（OpenAI失敗時）
  geminiApiKey: process.env.GOOGLE_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-1.5-flash",
  geminiBaseUrl:
    process.env.GEMINI_BASE_URL ||
    "https://generativelanguage.googleapis.com/v1beta",
} as const;
