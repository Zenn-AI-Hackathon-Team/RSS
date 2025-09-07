import { normalizeCategoryName } from "@/app/api/_shared/normalizers";
import * as categoriesRepo from "@/app/api/repositories/categoriesRepo";
import * as linksRepo from "@/app/api/repositories/linksRepo";

export async function listCategories(uid: string) {
    const docs = await categoriesRepo.list(uid);
    const categories = docs.map((d) => ({
        id: d.id,
        ...(d.data() as { name: string; description?: string | null }),
    }));

	// 全カテゴリIDと inbox (null) のリンク数を取得
	const categoryIds: (string | null)[] = categories.map((c) => c.id);
	categoryIds.push(null); // inbox用
	const counts = await linksRepo.countByCategoriesBatch(uid, categoryIds);

	// inbox カテゴリを追加
    const result = [
        {
            id: "inbox",
            name: "Inbox",
            count: counts.inbox || 0,
        },
        ...categories.map((c) => ({
            id: c.id,
            name: c.name,
            description: c.description ?? null,
            count: counts[c.id] || 0,
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
    await linksRepo.moveAllFromCategoryToInbox(uid, id);
    await categoriesRepo.remove(uid, id);
}
