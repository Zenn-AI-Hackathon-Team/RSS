import { db, serverTimestamp } from "@/lib/firebaseAdmin";

function col(uid: string) {
	// users/{uid}/categories コレクション参照
	return db.collection("users").doc(uid).collection("categories");
}

export async function create(
	uid: string,
	data: { name: string; nameLower: string },
) {
	// カテゴリ作成（名前と小文字化した名前、作成時刻を保存）
	const ref = await col(uid).add({ ...data, createdAt: serverTimestamp() });
	return ref;
}

export async function findByNameLower(uid: string, nameLower: string) {
	// nameLower 一致で既存カテゴリを検索（重複チェック）
	const snap = await col(uid)
		.where("nameLower", "==", nameLower)
		.limit(1)
		.get();
	return snap.empty ? null : snap.docs[0];
}

export async function list(uid: string) {
	// カテゴリ一覧を取得（DTO用）
	const snap = await col(uid).get();
	return snap.docs;
}

export async function listRaw(uid: string) {
	// 同上。内部メタ（埋め込み等）用途の生doc取得という意図を明示
	const snap = await col(uid).get();
	return snap.docs;
}

export async function getById(uid: string, id: string) {
	// 指定IDのカテゴリを取得
	return await col(uid).doc(id).get();
}

export async function updateEmbedding(
	uid: string,
	id: string,
	embedding: number[],
	embeddingModel: string,
) {
	// カテゴリdocに埋め込みベクトルとモデル名、更新時刻を保存
	const ref = col(uid).doc(id);
	await ref.set(
		{
			embedding,
			embeddingModel,
			embeddingUpdatedAt: serverTimestamp(),
		},
		{ merge: true },
	);
}
