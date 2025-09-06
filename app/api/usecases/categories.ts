import { toCategoryDTO } from "@/app/api/_shared/mappers";
import { normalizeCategoryName } from "@/app/api/_shared/normalizers";
import * as categoriesRepo from "@/app/api/repositories/categoriesRepo";

export async function listCategories(uid: string) {
	const docs = await categoriesRepo.list(uid);
	return docs.map((d) => toCategoryDTO(d.id, d.data() as { name: string }));
}

export async function createCategory(uid: string, rawName: string) {
	const { name, nameLower } = normalizeCategoryName(rawName);
	const dup = await categoriesRepo.findByNameLower(uid, nameLower);
	if (dup) throw new Error("ALREADY_EXISTS");
	const ref = await categoriesRepo.create(uid, { name, nameLower });
	return { id: ref.id, name, count: 0 } as const;
}
