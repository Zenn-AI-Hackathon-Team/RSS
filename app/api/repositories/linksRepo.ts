import { db, serverTimestamp } from "@/lib/firebaseAdmin";

export type ListOptions = {
	categoryId?: string;
	inbox?: "true" | "false";
	sort?: "asc" | "desc";
	limit?: number;
	cursor?: string;
};

function col(uid: string) {
	return db.collection("users").doc(uid).collection("links");
}

export async function findByUrl(uid: string, url: string) {
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
	const ref = col(uid).doc(id);
	await ref.update({
		categoryId: categoryId ?? null,
		updatedAt: serverTimestamp(),
	});
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
