import { autoAssignCategory } from "@/app/api/_shared/categorizer";
import { type LinkDoc, toLinkDTO } from "@/app/api/_shared/mappers";
import { normalizeUrl } from "@/app/api/_shared/normalizers";
import { fetchOGP } from "@/app/api/_shared/ogp";
import * as categoriesRepo from "@/app/api/repositories/categoriesRepo";
import * as linksRepo from "@/app/api/repositories/linksRepo";
import * as countsRepo from "@/app/api/repositories/countsRepo";
import { db, serverTimestamp } from "@/lib/firebaseAdmin";

export async function createLink(uid: string, rawUrl: string) {
	// 入力URLを正規化（クエリの不要パラメータ除去・末尾スラッシュ調整など）
	console.log(`[uc.createLink] start uid=${uid} rawUrl=${rawUrl}`);
	const url = normalizeUrl(rawUrl);
	console.log(`[uc.createLink] normalized url=${url}`);
	const existing = await linksRepo.findByUrl(uid, url);
	if (existing) {
		// 既に同一URLのリンクがある場合は新規作成せず既存データを返す
		console.log(`[uc.createLink] found existing id=${existing.id}`);
		return {
			link: toLinkDTO(existing.id, existing.data() as LinkDoc),
			created: false as const,
		};
	}
	// OGP取得で title/description/imageUrl/provider を収集
	console.log(`[uc.createLink] fetchOGP start url=${url}`);
	const ogp = await fetchOGP(url);
	console.log(
		`[uc.createLink] fetchOGP done title=${String(ogp.title)} img=${String(ogp.imageUrl)} status=${ogp.fetchStatus} provider=${ogp.provider}`,
	);
    const ref = await linksRepo.create(uid, {
        url,
        title: ogp.title,
        description: ogp.description,
        imageUrl: ogp.imageUrl,
        categoryId: null,
        provider: ogp.provider,
        fetchStatus: ogp.fetchStatus,
    });
    const snap = await ref.get();

    // 自動カテゴリ割当（ベストエフォート）：
	// 1) 埋め込みで既存カテゴリとの類似度を算出
	// 2) しきい値未満なら（必要に応じて）LLMでフォールバック
    let decided: { categoryId: string | null; method?: string; confidence?: number } = {
        categoryId: null,
    };
    try {
        console.log(`[uc.createLink] autoAssignCategory start id=${snap.id}`);
        const assigned = await autoAssignCategory(uid, {
            id: snap.id,
            url,
            title: ogp.title,
            description: ogp.description,
        });
        if (assigned.categoryId) {
            console.log(
                `[uc.createLink] autoAssignCategory decided cat=${assigned.categoryId} method=${assigned.method} conf=${assigned.confidence}`,
            );
            decided = {
                categoryId: assigned.categoryId,
                method: assigned.method,
                confidence: assigned.confidence,
            };
        } else {
            console.log(`[uc.createLink] autoAssignCategory no-decision`);
        }
    } catch {
        // 自動分類の失敗は無視（未分類のまま）
        console.warn(`[uc.createLink] autoAssignCategory error (ignored)`);
    }

    // 最終的なカテゴリー状態に応じてカウントを更新
    if (decided.categoryId) {
        // null -> categoryId への確定移動を、リンク更新と同一バッチで反映
        const linkRef = db.collection("users").doc(uid).collection("links").doc(snap.id);
        const batch = db.batch();
        batch.update(linkRef, { categoryId: decided.categoryId, updatedAt: serverTimestamp() });
        categoriesRepo.incrementLinkCountInBatch(uid, decided.categoryId, 1, batch);
        await batch.commit();
        // 自動カテゴリのメタを保存（別書き込みでOK）
        await linksRepo.updateAutoCategoryMeta(uid, snap.id, {
            method: decided.method ?? "embedding",
            confidence: decided.confidence ?? 0,
        });
    } else {
        // Inbox に確定
        await countsRepo.incrementInboxCount(uid, 1);
    }

    const latest = await ref.get();
    console.log(`[uc.createLink] done id=${latest.id}`);
    return {
        link: toLinkDTO(latest.id, latest.data() as LinkDoc),
        created: true as const,
    };
}

export async function listLinks(uid: string, opts: linksRepo.ListOptions) {
	// 条件（カテゴリ/Inbox/ソート/ページング）に基づき一覧を取得
	const docs = await linksRepo.list(uid, opts);
	return docs.map((d) => toLinkDTO(d.id, d.data() as LinkDoc));
}

export async function getLink(uid: string, id: string) {
	// 指定IDのリンクを取得。存在しなければエラー
	const snap = await linksRepo.getById(uid, id);
	if (!snap.exists) throw new Error("LINK_NOT_FOUND");
	return toLinkDTO(snap.id, snap.data() as LinkDoc);
}

export async function moveCategory(
    uid: string,
    id: string,
    categoryId: string | null,
) {
    // リンクとカテゴリの存在を確認し、categoryId を更新
    const linkSnap = await linksRepo.getById(uid, id);
    if (!linkSnap.exists) throw new Error("LINK_NOT_FOUND");
    if (categoryId) {
        const catSnap = await categoriesRepo.getById(uid, categoryId);
        if (!catSnap.exists) throw new Error("CATEGORY_NOT_FOUND");
    }
    // 旧カテゴリを参照
    const prev = (linkSnap.data() as LinkDoc).categoryId ?? null;

    // カテゴリ変更とカウント増減を同一バッチで適用
    const linkRef = db.collection("users").doc(uid).collection("links").doc(id);
    const batch = db.batch();
    batch.update(linkRef, { categoryId: categoryId ?? null, updatedAt: serverTimestamp() });
    if (prev === null) {
        countsRepo.incrementInboxCountInBatch(uid, -1, batch);
    } else {
        categoriesRepo.incrementLinkCountInBatch(uid, prev, -1, batch);
    }
    if (categoryId === null) {
        countsRepo.incrementInboxCountInBatch(uid, 1, batch);
    } else {
        categoriesRepo.incrementLinkCountInBatch(uid, categoryId, 1, batch);
    }
    await batch.commit();

    const updated = await linkRef.get();
    return toLinkDTO(updated.id, updated.data() as LinkDoc);
}

export async function searchLinks(
	uid: string,
	q: string,
	limit = 20,
	cursor?: string,
) {
	// タイトルの前方一致検索（簡易検索）
	const docs = await linksRepo.searchByTitlePrefix(uid, q, limit, cursor);
	return docs.map((d) => toLinkDTO(d.id, d.data() as LinkDoc));
}
