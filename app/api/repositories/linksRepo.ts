import { db, serverTimestamp } from "@/lib/firebaseAdmin";

export type ListOptions = {
	categoryId?: string;
	inbox?: "true" | "false";
	sort?: "asc" | "desc";
	limit?: number;
	cursor?: string;
};

function col(uid: string) {
	// users/{uid}/links コレクション参照
	return db.collection("users").doc(uid).collection("links");
}

export async function findByUrl(uid: string, url: string) {
	// URL 完全一致で既存リンクを検索（正規化後のURL想定）
	const snap = await col(uid).where("url", "==", url).limit(1).get();
	return snap.empty ? null : snap.docs[0];
}

export async function create(
	uid: string,
	data: {
		url: string;
		title: string | null;
		description: string | null;
		imageUrl: string | null;
		categoryId: string | null;
		provider: "youtube" | "x" | "instagram" | "generic";
		fetchStatus: "ok" | "partial" | "failed";
	},
) {
	// 新規リンク作成（作成/更新時刻はサーバ時刻）
	const ref = await col(uid).add({
		...data,
		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp(),
	});
	return ref;
}

export async function getById(uid: string, id: string) {
	return await col(uid).doc(id).get();
}

export async function list(uid: string, opts: ListOptions) {
	// 一覧取得：Inbox/カテゴリ絞り込み、作成日時でソート、カーソル/件数対応
	let q: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = col(uid);
	if (opts.inbox === "true") {
		q = q.where("categoryId", "==", null);
	} else if (opts.categoryId) {
		q = q.where("categoryId", "==", opts.categoryId);
	}
	q = q.orderBy("createdAt", (opts.sort as "asc" | "desc") ?? "desc");

	if (opts.cursor) {
		const cursorSnap = await col(uid).doc(opts.cursor).get();
		if (cursorSnap.exists) {
			q = q.startAfter(cursorSnap);
		}
	}
	const limit = opts.limit ?? 20;
	const snap = await q.limit(limit).get();
	return snap.docs;
}

export async function updateCategory(
	uid: string,
	id: string,
	categoryId: string | null,
) {
	// categoryId を更新し updatedAt を進める
	const ref = col(uid).doc(id);
	await ref.update({
		categoryId: categoryId ?? null,
		updatedAt: serverTimestamp(),
	});
	return ref.get();
}

export async function updateAutoCategoryMeta(
	uid: string,
	id: string,
	meta: { method: string; confidence: number; model?: string },
) {
	// 自動分類のメタ情報（手法/信頼度/モデル名）を保存
	const ref = col(uid).doc(id);
	await ref.set(
		{
			autoCategory: {
				method: meta.method,
				confidence: meta.confidence,
				model: meta.model,
			},
			updatedAt: serverTimestamp(),
		},
		{ merge: true },
	);
	return ref.get();
}

export async function searchByTitlePrefix(
	uid: string,
	q: string,
	limit = 20,
	cursor?: string,
) {
	const linksRef = col(uid);
	let searchQ = linksRef
		.where("title", ">=", q)
		.where("title", "<", `${q}\uf8ff`)
		.orderBy("title", "asc");

	if (cursor) {
		const cursorSnap = await linksRef.doc(cursor).get();
		if (cursorSnap.exists) {
			searchQ = searchQ.startAfter(cursorSnap);
		}
	}
	const snap = await searchQ.limit(limit).get();
	return snap.docs;
}

export async function moveAllFromCategoryToInbox(uid: string, categoryId: string) {
    // 指定カテゴリの全リンクを Inbox(null) へ移動（バッチ更新）
    const linksRef = col(uid);
    const snap = await linksRef.where("categoryId", "==", categoryId).get();
    if (snap.empty) return 0;
    let updated = 0;
    const batchSize = 400; // 500未満で安全側
    for (let i = 0; i < snap.docs.length; i += batchSize) {
        const chunk = snap.docs.slice(i, i + batchSize);
        const batch = db.batch();
        for (const doc of chunk) {
            batch.update(doc.ref, { categoryId: null, updatedAt: serverTimestamp() });
            updated++;
        }
        await batch.commit();
    }
    return updated;
}


export async function countByCategoryId(
	uid: string,
	categoryId: string | null,
) {
	// 指定されたカテゴリIDのリンク数を取得
	let q: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = col(uid);

	if (categoryId === null) {
		// inbox (categoryId が null) の場合
		q = q.where("categoryId", "==", null);
	} else {
		// 特定のカテゴリの場合
		q = q.where("categoryId", "==", categoryId);
	}

	const snap = await q.count().get();
	return snap.data().count;
}

export async function countByCategoriesBatch(
	uid: string,
	categoryIds: (string | null)[],
) {
	// 複数のカテゴリIDのリンク数を一括取得
	const counts: { [key: string]: number } = {};

	// Firestore のクエリ制限を考慮して、並列実行
	const promises = categoryIds.map(async (categoryId) => {
		const count = await countByCategoryId(uid, categoryId);
		const key = categoryId || "inbox";
		counts[key] = count;
	});

	await Promise.all(promises);
	return counts;
}
