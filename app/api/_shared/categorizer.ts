// カテゴリ自動割当のためのユーティリティ
// 方針：
//  - 埋め込みでリンクテキストとカテゴリ名の類似度を計算
//  - 類似度がしきい値を超えれば採用
//  - 超えなければ（フラグON時のみ）LLMにフォールバック
//  - 判定結果やカテゴリ埋め込みは Firestore にキャッシュ

import { config } from "@/app/api/_shared/config";
import * as categoriesRepo from "@/app/api/repositories/categoriesRepo";
import * as linksRepo from "@/app/api/repositories/linksRepo";
import { db, serverTimestamp } from "@/lib/firebaseAdmin";

type Method = "embedding" | "llm" | "none";

export type AutoCategoryResult = {
	categoryId: string | null;
	confidence: number;
	method: Method;
};

const EMBEDDING_MODEL = config.embeddingModel;
const CHAT_MODEL = config.llmModel;
const BASE_URL = config.openaiBaseUrl;

function isEnabled() {
	// 全体の自動分類ON/OFF
	return config.enableAutoCategory;
}

function llmEnabled() {
	// LLMフォールバックのON/OFF
	return config.enableAutoCategoryLLM;
}

function threshold() {
	// 類似度の採用しきい値
	return config.autoCategoryThreshold;
}

function getApiKey() {
	// OpenAI互換APIキー（埋め込み/LLMで使用）
	return config.openaiApiKey;
}

function norm(vec: number[]) {
	let s = 0;
	for (const x of vec) s += x * x;
	return Math.sqrt(s) || 1;
}

function cosineSimilarity(a: number[], b: number[]) {
	// コサイン類似度
	const n = Math.min(a.length, b.length);
	let dot = 0;
	for (let i = 0; i < n; i++) dot += a[i] * b[i];
	return dot / (norm(a) * norm(b));
}

async function embedBatch(texts: string[]): Promise<number[][]> {
	// テキスト配列を一括で埋め込み取得
	const key = getApiKey();
	if (!key) throw new Error("OPENAI_API_KEY_MISSING");
	console.log(
		`[autoCategory] embedBatch model=${EMBEDDING_MODEL} size=${texts.length}`,
	);
	const started = Date.now();
	const res = await fetch(`${BASE_URL}/embeddings`, {
		method: "POST",
		headers: {
			"content-type": "application/json",
			authorization: `Bearer ${key}`,
		},
		body: JSON.stringify({ model: EMBEDDING_MODEL, input: texts }),
	}).catch((e) => {
		console.error(`[autoCategory] embeddings request failed:`, e);
		throw e;
	});
	if (!res.ok) {
		const t = await res.text().catch(() => "");
		console.error(
			`[autoCategory] embeddings http_error status=${res.status} body=${t.slice(
				0,
				200,
			)}`,
		);
		throw new Error(`Embedding failed: ${res.status}`);
	}
	const json = (await res.json()) as { data: Array<{ embedding: number[] }> };
	console.log(`[autoCategory] embedBatch ok in ${Date.now() - started}ms`);
	return json.data.map((d) => d.embedding);
}

async function embedSingle(text: string): Promise<number[]> {
	const [v] = await embedBatch([text]);
	return v;
}

async function ensureCategoryEmbeddings(
	uid: string,
	cats: Array<{
		id: string;
		name: string;
		nameLower?: string;
		embedding?: number[];
		embeddingModel?: string;
	}>,
): Promise<
	Array<{ id: string; name: string; nameLower: string; embedding: number[] }>
> {
	// カテゴリ名＋（オプションで）カテゴリ内リンクのタイトル/説明を材料に埋め込みを作成し保存
	const toCompute: { idx: number; text: string }[] = [];
	const out: Array<{
		id: string;
		name: string;
		nameLower: string;
		embedding: number[];
	}> = cats.map((c) => ({
		id: c.id,
		name: c.name,
		nameLower: (c.nameLower || c.name || "").toLowerCase(),
		embedding: c.embedding || [],
	}));

	// 期待するモデル識別子（例: text-embedding-3-small+cat_examples）
	const expectedModel = config.enableCategoryExampleEmbedding
		? `${EMBEDDING_MODEL}+cat_examples`
		: EMBEDDING_MODEL;
	for (let i = 0; i < cats.length; i++) {
		const c = cats[i];
		const needs =
			!c.embedding ||
			c.embedding.length === 0 ||
			c.embeddingModel !== expectedModel;
		if (!needs) continue;

		// 入力テキスト構築
		let text = c.name || "";
		if (config.enableCategoryExampleEmbedding) {
			try {
				const sample = await linksRepo.list(uid, {
					categoryId: c.id,
					sort: "desc",
					limit: config.categoryExampleSampleSize,
				});
				const parts: string[] = [];
				for (const d of sample) {
					const data = d.data() as any;
					if (data?.title) parts.push(String(data.title));
					if (data?.description) parts.push(String(data.description));
				}
				if (parts.length > 0) {
					const joined = parts.join("\n");
					const limited = joined.slice(0, config.categoryExampleTextMaxChars);
					text = `${c.name}\n${limited}`;
				}
			} catch (e) {
				// 読み取り失敗時はカテゴリ名のみ
			}
		}
		toCompute.push({ idx: i, text });
	}
	if (toCompute.length > 0) {
		const embeds = await embedBatch(toCompute.map((t) => t.text));
		const batch: Array<{
			id: string;
			embedding: number[];
			embeddingModel: string;
		}> = [];
		for (let k = 0; k < toCompute.length; k++) {
			const { idx } = toCompute[k];
			out[idx].embedding = embeds[k];
			batch.push({
				id: cats[idx].id,
				embedding: embeds[k],
				embeddingModel: expectedModel,
			});
		}
		// Persist embeddings back to category docs (best-effort)
		await Promise.all(
			batch.map((b) =>
				categoriesRepo
					.updateEmbedding(uid, b.id, b.embedding, b.embeddingModel)
					.catch(() => void 0),
			),
		);
	}
	return out;
}

async function llmChooseCategory(
	text: string,
	cats: Array<{ id: string; name: string }>,
): Promise<{ categoryId: string | null; confidence: number }> {
	// LLMにテキストとカテゴリ一覧を渡し、最適なカテゴリを1つ選ばせる
	const key = getApiKey();
	if (!key && !config.geminiApiKey) return { categoryId: null, confidence: 0 };
	console.log(
		`[autoCategory] llm request model=${CHAT_MODEL} cats=${cats.length} textLen=${text.length}`,
	);
	const system =
		"You are a strict classifier. Choose the best category id given the input text. If none fits, return null.";
	const user = JSON.stringify({ text, categories: cats }, null, 2);
	const started = Date.now();
	let res: Response | null = null;
	if (key) {
		try {
			// Some newer models (e.g., gpt-5 family) require 'max_completion_tokens'
			// instead of 'max_tokens'. Select the key based on model name.
			const maxKey = CHAT_MODEL.startsWith("gpt-5")
				? "max_completion_tokens"
				: "max_tokens";
			const payload: any = {
				model: CHAT_MODEL,
				messages: [
					{ role: "system", content: system },
					{
						role: "user",
						content:
							'Given categories (id,name) and text, respond ONLY with a compact JSON: {\n  "id": <string|null>,\n  "confidence": <number between 0 and 1>\n}.\n' +
							"Pick the most suitable category id or null if unsure. Here is the payload:\n\n" +
							user,
					},
				],
				response_format: { type: "json_object" },
			};
			payload[maxKey] = 100;
			// gpt-5 系は temperature=0 を受け付けないため省略（デフォルト=1）
			if (!CHAT_MODEL.startsWith("gpt-5")) {
				payload.temperature = 0;
			}

			res = await fetch(`${BASE_URL}/chat/completions`, {
				method: "POST",
				headers: {
					"content-type": "application/json",
					authorization: `Bearer ${key}`,
				},
				body: JSON.stringify(payload),
			});
		} catch (e) {
			console.error(`[autoCategory] llm request failed:`, e);
			res = null;
		}
	}

	if (res?.ok) {
		const data = (await res.json()) as any;
		console.log(`[autoCategory] llm ok in ${Date.now() - started}ms`);
		const content: string | undefined = data.choices?.[0]?.message?.content;
		if (!content) return { categoryId: null, confidence: 0 };
		try {
			const parsed = JSON.parse(content);
			const id = typeof parsed.id === "string" ? parsed.id : null;
			const conf =
				typeof parsed.confidence === "number" ? parsed.confidence : 0.5;
			return { categoryId: id, confidence: conf };
		} catch {
			console.error(
				`[autoCategory] llm parse_error content=${content.slice(0, 200)}`,
			);
			// fallthrough to Gemini
		}
	} else {
		const status = res ? res.status : "no_response";
		let body = "";
		try {
			body = res ? await res.text() : "";
		} catch {}
		console.error(
			`[autoCategory] llm http_error status=${status} body=${body.slice(
				0,
				200,
			)}`,
		);
		// continue to Gemini fallback if available
	}

	// Gemini fallback
	if (!config.geminiApiKey) return { categoryId: null, confidence: 0 };
	try {
		const gemUrl = `${config.geminiBaseUrl}/models/${encodeURIComponent(
			config.geminiModel,
		)}:generateContent?key=${encodeURIComponent(config.geminiApiKey)}`;
		const prompt =
			`Given categories (id,name) and text, respond ONLY with compact JSON: {"id": <string|null>, "confidence": <number 0..1>}. Pick one id or null.\n` +
			JSON.stringify({ text, categories: cats });
		console.log(`[autoCategory] gemini request model=${config.geminiModel}`);
		const gRes = await fetch(gemUrl, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
		});
		if (!gRes.ok) {
			const t = await gRes.text().catch(() => "");
			console.error(
				`[autoCategory] gemini http_error status=${gRes.status} body=${t.slice(
					0,
					200,
				)}`,
			);
			return { categoryId: null, confidence: 0 };
		}
		const gJson: any = await gRes.json();
		const textOut: string | undefined =
			gJson.candidates?.[0]?.content?.parts?.[0]?.text;
		if (!textOut) return { categoryId: null, confidence: 0 };
		try {
			// Gemini は ```json ...``` 形式で返すことがあるため除去してからパース
			let body = String(textOut).trim();
			const fence = body.match(/```(json)?\s*([\s\S]*?)\s*```/i);
			if (fence) body = fence[2];
			// フェンスがない場合に備えて、最初のJSONブロック抽出も試みる
			if (!fence) {
				const m = body.match(/\{[\s\S]*\}/);
				if (m) body = m[0];
			}
			const parsed = JSON.parse(body);
			const id = typeof parsed.id === "string" ? parsed.id : null;
			const conf =
				typeof parsed.confidence === "number" ? parsed.confidence : 0.5;
			console.log(`[autoCategory] gemini ok id=${id} conf=${conf}`);
			return { categoryId: id, confidence: conf };
		} catch {
			console.error(
				`[autoCategory] gemini parse_error content=${(textOut || "").slice(
					0,
					200,
				)}`,
			);
			return { categoryId: null, confidence: 0 };
		}
	} catch (e) {
		console.error(`[autoCategory] gemini request failed:`, e);
		return { categoryId: null, confidence: 0 };
	}
}

export async function autoAssignCategory(
	uid: string,
	link: {
		id: string;
		url: string;
		title?: string | null;
		description?: string | null;
	},
): Promise<AutoCategoryResult> {
	// 自動分類のエントリポイント
	if (!isEnabled()) return { categoryId: null, confidence: 0, method: "none" };
	const apiKey = getApiKey();
	// OpenAIキーもGeminiキーも無ければ処理不可
	if (!apiKey && !config.geminiApiKey)
		return { categoryId: null, confidence: 0, method: "none" };
	console.log(
		`[autoCategory] start uid=${uid} link=${link.id} mode=${
			config.autoCategoryMode
		} flags llm=${llmEnabled()} threshold=${threshold()}`,
	);

	const catDocs = await categoriesRepo.listRaw(uid);
	if (catDocs.length === 0)
		return { categoryId: null, confidence: 0, method: "none" };

	const textParts: string[] = [];
	// タイトル/説明/ドメイン名を特徴として使用
	if (link.title) textParts.push(link.title);
	if (link.description) textParts.push(link.description);
	try {
		const h = new URL(link.url).hostname;
		textParts.push(h);
	} catch {}
	const text = textParts.join("\n").trim();
	if (!text) {
		console.warn(`[autoCategory] no_text uid=${uid} link=${link.id}`);
		return { categoryId: null, confidence: 0, method: "none" };
	}

	// llm_only モードの場合は埋め込みをスキップしてLLMのみで判定
	if (config.autoCategoryMode === "llm_only") {
		console.log(`[autoCategory] mode=llm_only uid=${uid} link=${link.id}`);
		if (llmEnabled()) {
			const llm = await llmChooseCategory(
				text,
				(await categoriesRepo.listRaw(uid)).map((d) => ({
					id: d.id,
					name: (d.data() as any)?.name ?? "",
				})),
			);
			const chosen = llm.categoryId ?? null;
			if (chosen) {
				console.log(
					`[autoCategory] llm ok uid=${uid} link=${
						link.id
					} cat=${chosen} conf=${(llm.confidence ?? 0).toFixed(3)}`,
				);
				await db
					.collection("users")
					.doc(uid)
					.collection("links")
					.doc(link.id)
					.set(
						{
							autoCategory: {
								method: "llm",
								confidence: llm.confidence ?? 0.5,
								model: CHAT_MODEL,
								decidedAt: serverTimestamp(),
							},
						},
						{ merge: true },
					)
					.catch(() => void 0);
				return {
					categoryId: chosen,
					confidence: llm.confidence ?? 0.5,
					method: "llm",
				};
			}
		}
		console.log(
			`[autoCategory] none uid=${uid} link=${link.id} reason=llm_only_no_choice`,
		);
		return { categoryId: null, confidence: 0, method: "none" };
	}

	// Prepare categories and ensure embeddings
	const cats = catDocs.map((d) => {
		const data = d.data() as any;
		return {
			id: d.id,
			name: data?.name ?? "",
			nameLower: data?.nameLower ?? (data?.name || "").toLowerCase(),
			embedding: data?.embedding as number[] | undefined,
			embeddingModel: data?.embeddingModel as string | undefined,
		};
	});
	let ensuredCats: Awaited<ReturnType<typeof ensureCategoryEmbeddings>>;
	try {
		ensuredCats = await ensureCategoryEmbeddings(uid, cats);
	} catch {
		// Embedding API failed; bail out safely
		ensuredCats = cats.map((c) => ({
			id: c.id,
			name: c.name,
			nameLower: c.nameLower || c.name.toLowerCase(),
			embedding: [],
		}));
	}

	// Compute link embedding
	let linkVec: number[] = [];
	try {
		linkVec = await embedSingle(text);
	} catch {
		linkVec = [];
	}

	if (linkVec.length > 0) {
		let best = { id: "", score: -1 };
		for (const c of ensuredCats) {
			if (!c.embedding || c.embedding.length === 0) continue;
			const s = cosineSimilarity(linkVec, c.embedding);
			if (s > best.score) best = { id: c.id, score: s };
		}
		// 類似度がしきい値以上なら埋め込みでカテゴリ決定
		// しきい値未満なら（設定ON時のみ）LLMで再判定
		if (best.id && best.score >= threshold()) {
			// ログ: 埋め込みで採用
			console.log(
				`[autoCategory] embedding ok uid=${uid} link=${link.id} cat=${
					best.id
				} score=${best.score.toFixed(3)}`,
			);
			// 判定メタを保存（ベストエフォート）
			await db
				.collection("users")
				.doc(uid)
				.collection("links")
				.doc(link.id)
				.set(
					{
						autoCategory: {
							method: "embedding",
							confidence: best.score,
							model: EMBEDDING_MODEL,
							decidedAt: serverTimestamp(),
						},
					},
					{ merge: true },
				)
				.catch(() => void 0);
			return {
				categoryId: best.id,
				confidence: best.score,
				method: "embedding",
			};
		}
	}

	if (llmEnabled()) {
		// しきい値に届かない場合のみLLMで再判定
		const llm = await llmChooseCategory(
			text,
			cats.map((c) => ({ id: c.id, name: c.name })),
		);
		const chosen = cats.find((c) => c.id === llm.categoryId)?.id ?? null;
		if (chosen) {
			// ログ: LLMで採用
			console.log(
				`[autoCategory] llm ok uid=${uid} link=${link.id} cat=${chosen} conf=${(
					llm.confidence ?? 0
				).toFixed(3)}`,
			);
			await db
				.collection("users")
				.doc(uid)
				.collection("links")
				.doc(link.id)
				.set(
					{
						autoCategory: {
							method: "llm",
							confidence: llm.confidence ?? 0.5,
							model: CHAT_MODEL,
							decidedAt: serverTimestamp(),
						},
					},
					{ merge: true },
				)
				.catch(() => void 0);
			return {
				categoryId: chosen,
				confidence: llm.confidence ?? 0.5,
				method: "llm",
			};
		}
	}

	// ログ: 未割当（テキスト不足/しきい値未満/フォールバック無効 など）
	console.log(
		`[autoCategory] none uid=${uid} link=${link.id} reason=no_match_or_disabled`,
	);
	return { categoryId: null, confidence: 0, method: "none" };
}
