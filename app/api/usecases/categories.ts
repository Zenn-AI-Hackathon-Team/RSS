import { normalizeCategoryName } from "@/app/api/_shared/normalizers";
import * as categoriesRepo from "@/app/api/repositories/categoriesRepo";
import * as linksRepo from "@/app/api/repositories/linksRepo";
import * as countsRepo from "@/app/api/repositories/countsRepo";

export async function listCategories(uid: string) {
    const docs = await categoriesRepo.list(uid);
    const raw = docs.map((d) => ({ id: d.id, data: d.data() as any }));

    // 1) まず非正規化済みの linkCount があるものはそれを使う
    const categories = raw.map((r) => ({
        id: r.id,
        name: r.data?.name as string,
        description: (r.data?.description ?? null) as string | null,
        linkCount: typeof r.data?.linkCount === "number" ? (r.data.linkCount as number) : null,
    }));

    // 2) Inbox のカウントを meta から取得（なければ fallback）
    let inboxCount = await countsRepo.getInboxCount(uid);

    // 3) linkCount が未設定のカテゴリのみ、最小限の fallback 集計
    const missingIds = categories.filter((c) => c.linkCount === null).map((c) => c.id);
    let fallbackCounts: Record<string, number> = {};
    let fallbackInbox: number | null = null;
    if (missingIds.length > 0 || inboxCount === null) {
        const target: (string | null)[] = [...missingIds];
        if (inboxCount === null) target.push(null);
        const batchCounts = await linksRepo.countByCategoriesBatch(uid, target);
        fallbackCounts = batchCounts;
        if (inboxCount === null) inboxCount = batchCounts.inbox ?? 0;
        // 注意: batchCounts には missingIds のみ含まれる
    }

    const result = [
        {
            id: "inbox",
            name: "Inbox",
            count: inboxCount ?? 0,
        },
        ...categories.map((c) => ({
            id: c.id,
            name: c.name,
            description: c.description,
            count: c.linkCount ?? fallbackCounts[c.id] ?? 0,
        })),
    ];

    return result;
}

export async function createCategory(uid: string, rawName: string, description?: string | null) {
    const { name, nameLower } = normalizeCategoryName(rawName);
    const dup = await categoriesRepo.findByNameLower(uid, nameLower);
    if (dup) throw new Error("ALREADY_EXISTS");
    const ref = await categoriesRepo.create(uid, { name, nameLower, description: description ?? null });
    return { id: ref.id, name, description: description ?? null, count: 0 } as const;
}

export async function updateCategoryName(uid: string, id: string, rawName: string, description?: string | null) {
    const { name, nameLower } = normalizeCategoryName(rawName);
    // 存在確認
    const current = await categoriesRepo.getById(uid, id);
    if (!current.exists) throw new Error("CATEGORY_NOT_FOUND");
    // 重複チェック（同じIDは許容）
    const dup = await categoriesRepo.findByNameLower(uid, nameLower);
    if (dup && dup.id !== id) throw new Error("ALREADY_EXISTS");
    const updated = await categoriesRepo.updateName(uid, id, { name, nameLower, description: description ?? null });
    const data = updated.data() as any;
    return { id: updated.id, name, description: data?.description ?? description ?? null } as const;
}

export async function deleteCategory(uid: string, id: string) {
    const current = await categoriesRepo.getById(uid, id);
    if (!current.exists) throw new Error("CATEGORY_NOT_FOUND");
    // 関連リンクは Inbox(null) へ移動
    const moved = await linksRepo.moveAllFromCategoryToInbox(uid, id);
    // Inbox カウントに合計件数を加算（カテゴリ側はDoc削除されるため減算不要）
    await countsRepo.incrementInboxCount(uid, moved);
    await categoriesRepo.remove(uid, id);
}
