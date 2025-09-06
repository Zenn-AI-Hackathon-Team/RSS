import { db, serverTimestamp } from "@/lib/firebaseAdmin";

function col(uid: string) {
	return db.collection("users").doc(uid).collection("categories");
}

export async function create(
	uid: string,
	data: { name: string; nameLower: string },
) {
	const ref = await col(uid).add({ ...data, createdAt: serverTimestamp() });
	return ref;
}

export async function findByNameLower(uid: string, nameLower: string) {
	const snap = await col(uid)
		.where("nameLower", "==", nameLower)
		.limit(1)
		.get();
	return snap.empty ? null : snap.docs[0];
}

export async function list(uid: string) {
	const snap = await col(uid).get();
	return snap.docs;
}

export async function getById(uid: string, id: string) {
	return await col(uid).doc(id).get();
}
