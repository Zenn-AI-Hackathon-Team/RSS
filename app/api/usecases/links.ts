import { type LinkDoc, toLinkDTO } from "@/app/api/_shared/mappers";
import { normalizeUrl } from "@/app/api/_shared/normalizers";
import * as categoriesRepo from "@/app/api/repositories/categoriesRepo";
import * as linksRepo from "@/app/api/repositories/linksRepo";

export async function createLink(uid: string, rawUrl: string) {
	const url = normalizeUrl(rawUrl);
	const existing = await linksRepo.findByUrl(uid, url);
	if (existing) {
		return {
			link: toLinkDTO(existing.id, existing.data() as LinkDoc),
			created: false as const,
		};
	}
	const ref = await linksRepo.create(uid, {
		url,
		title: null,
		description: null,
		imageUrl: null,
		categoryId: null,
		provider: "generic",
		fetchStatus: "ok",
	});
	const snap = await ref.get();
	return {
		link: toLinkDTO(snap.id, snap.data() as LinkDoc),
		created: true as const,
	};
}

export async function listLinks(uid: string, opts: linksRepo.ListOptions) {
	const docs = await linksRepo.list(uid, opts);
	return docs.map((d) => toLinkDTO(d.id, d.data() as LinkDoc));
}

export async function getLink(uid: string, id: string) {
	const snap = await linksRepo.getById(uid, id);
	if (!snap.exists) throw new Error("LINK_NOT_FOUND");
	return toLinkDTO(snap.id, snap.data() as LinkDoc);
}

export async function moveCategory(
	uid: string,
	id: string,
	categoryId: string | null,
) {
	const linkSnap = await linksRepo.getById(uid, id);
	if (!linkSnap.exists) throw new Error("LINK_NOT_FOUND");
	if (categoryId) {
		const catSnap = await categoriesRepo.getById(uid, categoryId);
		if (!catSnap.exists) throw new Error("CATEGORY_NOT_FOUND");
	}
	const updated = await linksRepo.updateCategory(uid, id, categoryId);
	return toLinkDTO(updated.id, updated.data() as LinkDoc);
}

export async function searchLinks(
	uid: string,
	q: string,
	limit = 20,
	cursor?: string,
) {
	const docs = await linksRepo.searchByTitlePrefix(uid, q, limit, cursor);
	return docs.map((d) => toLinkDTO(d.id, d.data() as LinkDoc));
}
