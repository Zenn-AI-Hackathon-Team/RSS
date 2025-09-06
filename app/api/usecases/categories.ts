import { normalizeCategoryName } from "@/app/api/_shared/normalizers";
import * as categoriesRepo from "@/app/api/repositories/categoriesRepo";
import * as linksRepo from "@/app/api/repositories/linksRepo";

export async function listCategories(uid: string) {
	const docs = await categoriesRepo.list(uid);
	const categories = docs.map((d) => ({
		id: d.id,
		...(d.data() as { name: string }),
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
			count: counts[c.id] || 0,
		})),
	];

	return result;
}

export async function createCategory(uid: string, rawName: string) {
	const { name, nameLower } = normalizeCategoryName(rawName);
	const dup = await categoriesRepo.findByNameLower(uid, nameLower);
	if (dup) throw new Error("ALREADY_EXISTS");
	const ref = await categoriesRepo.create(uid, { name, nameLower });
	return { id: ref.id, name, count: 0 } as const;
}
