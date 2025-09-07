// Backfill auto-category for existing links with null categoryId
// Usage: npx -y tsx scripts/devtest/backfill_auto_category.ts <UID> [LIMIT]

import fs from "node:fs";
import path from "node:path";

function loadEnvFile(file = ".env") {
	try {
		const p = path.resolve(process.cwd(), file);
		const content = fs.readFileSync(p, "utf8");
		for (const raw of content.split(/\r?\n/)) {
			const line = raw.trim();
			if (!line || line.startsWith("#")) continue;
			const m = line.match(/^(\w[\w_]*)=(.*)$/);
			if (!m) continue;
			const key = m[1];
			let val = m[2];
			if (
				(val.startsWith('"') && val.endsWith('"')) ||
				(val.startsWith("'") && val.endsWith("'"))
			) {
				val = val.slice(1, -1);
			}
			val = val.replace(/\\n/g, "\n");
			if (process.env[key] == null) process.env[key] = val;
		}
	} catch {}
}

async function main() {
	loadEnvFile();
	const uid = process.argv[2];
	const limit = Number(process.argv[3] || 50);
	if (!uid) {
		console.error("Usage: backfill_auto_category.ts <UID> [LIMIT]");
		process.exit(1);
	}
	console.log(`[backfill] start uid=${uid} limit=${limit}`);

	const { db } = await import("../../lib/firebaseAdmin");
	const { autoAssignCategory } = await import(
		"../../app/api/_shared/categorizer"
	);
	const { updateCategory, updateAutoCategoryMeta } = await import(
		"../../app/api/repositories/linksRepo"
	);

	// Fetch inbox (categoryId == null) without orderBy to avoid composite index
	const snap = await db
		.collection("users")
		.doc(uid)
		.collection("links")
		.where("categoryId", "==", null)
		.limit(limit)
		.get();
	const docs = snap.docs;
	console.log(`[backfill] inbox_count=${docs.length}`);
	let updated = 0;
	for (const d of docs) {
		const data = d.data() as any;
		const id = d.id;
		const url = data?.url as string;
		const title = (data?.title ?? null) as string | null;
		const description = (data?.description ?? null) as string | null;
		console.log(`[backfill] try link=${id} url=${url}`);
		const res = await autoAssignCategory(uid, { id, url, title, description });
		if (res.categoryId) {
			await updateCategory(uid, id, res.categoryId);
			await updateAutoCategoryMeta(uid, id, {
				method: res.method,
				confidence: res.confidence,
			});
			updated++;
			console.log(
				`[backfill] updated link=${id} -> cat=${res.categoryId} via ${res.method}`,
			);
		} else {
			console.log(`[backfill] skipped link=${id} (no match)`);
		}
	}
	console.log(`done. processed=${docs.length} updated=${updated}`);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
