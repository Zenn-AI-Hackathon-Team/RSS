import { createRoute, OpenAPIHono, type RouteHandler } from "@hono/zod-openapi";
import { z } from "zod";
import {
	Category,
	CategoryCreateBody,
	ErrorRes,
	Health,
	Link,
	ListLinksQuery,
	ListLinksRes,
	MoveCategoryBody,
	SearchQuery,
	SearchRes,
} from "@/app/api/[[...route]]/model/link";
import {
	authAdmin,
	db,
	serverTimestamp,
	type Timestamp,
} from "@/lib/firebaseAdmin";

/* =========================
 * Helpers
 * =======================*/
async function requireUid(authorization?: string): Promise<string> {
	if (!authorization?.startsWith("Bearer ")) {
		throw new Error("UNAUTHORIZED");
	}
	const token = authorization.slice("Bearer ".length).trim();
	try {
		const decoded = await authAdmin.verifyIdToken(token);
		return decoded.uid;
	} catch {
		throw new Error("UNAUTHORIZED");
	}
}

// Simple URL normalization: lower-case host, drop common tracking params, trim trailing slash (except root)
function normalizeUrl(raw: string): string {
	try {
		const u = new URL(raw);
		u.hostname = u.hostname.toLowerCase();
		const toDelete = [
			"utm_source",
			"utm_medium",
			"utm_campaign",
			"utm_term",
			"utm_content",
			"fbclid",
			"gclid",
			"ref",
		];
		for (const key of toDelete) u.searchParams.delete(key);
		// remove empty search
		if (u.searchParams.toString() === "") u.search = "";
		// remove trailing slash if not root
		if (u.pathname.endsWith("/") && u.pathname !== "/") {
			u.pathname = u.pathname.replace(/\/+$/, "");
		}
		return u.toString();
	} catch {
		return raw;
	}
}

function normalizeCategoryName(raw: string): {
	name: string;
	nameLower: string;
} {
	const name = raw.trim().replace(/\s+/g, " ");
	const nameLower = name.toLowerCase();
	return { name, nameLower };
}

/* =========================
 * Routes
 * =======================*/

// health
const healthRoute = createRoute({
	method: "get",
	path: "/healthz",
	summary: "Health check",
	description: "API サーバーが稼働しているか確認するためのエンドポイントです。",
	responses: {
		200: {
			description: "サーバーが稼働中",
			content: { "application/json": { schema: Health } },
		},
	},
});
const healthHandler: RouteHandler<typeof healthRoute> = (c) =>
	c.json({ ok: true });

// create link
const createLinkRoute = createRoute({
	method: "post",
	path: "/links",
	summary: "リンクを保存",
	description:
		"URLを送信すると OGP を取得して保存します。既存リンクがある場合は既存データを返し、存在しなければ新規作成します。",
	request: {
		headers: z.object({
			authorization: z.string().describe("Firebase ID トークン"),
		}),
		body: {
			required: true,
			content: {
				"application/json": { schema: z.object({ url: z.string().url() }) },
			},
		},
	},
	responses: {
		200: {
			description: "既存リンクを返却",
			content: { "application/json": { schema: Link } },
		},
		201: {
			description: "新規作成に成功",
			content: { "application/json": { schema: Link } },
		},
		401: {
			description: "認証エラー",
			content: { "application/json": { schema: ErrorRes } },
		},
		500: {
			description: "サーバー内部エラー",
			content: { "application/json": { schema: ErrorRes } },
		},
	},
});

const createLinkHandler: RouteHandler<typeof createLinkRoute> = async (c) => {
	try {
		const uid = await requireUid(c.req.header("authorization") ?? undefined);
		const { url } = await c.req.json<{ url: string }>();
		const normalizedUrl = normalizeUrl(url);

		const linksRef = db.collection("users").doc(uid).collection("links");

		// 既存確認
		const snap = await linksRef
			.where("url", "==", normalizedUrl)
			.limit(1)
			.get();
		if (!snap.empty) {
			const doc = snap.docs[0];
			const data = doc.data() as {
				url: string;
				title: string | null;
				description: string | null;
				imageUrl: string | null;
				categoryId: string | null;
				provider?: "youtube" | "x" | "instagram" | "generic";
				fetchStatus?: "ok" | "partial" | "failed";
				createdAt?: Timestamp;
				updatedAt?: Timestamp;
			};
			return c.json(
				{
					id: doc.id,
					url: data.url,
					title: data.title ?? null,
					description: data.description ?? null,
					imageUrl: data.imageUrl ?? null,
					categoryId: data.categoryId ?? null,
					provider: data.provider ?? "generic",
					fetchStatus: data.fetchStatus ?? "ok",
					createdAt: data.createdAt
						? data.createdAt.toDate().toISOString()
						: undefined,
					updatedAt: data.updatedAt
						? data.updatedAt.toDate().toISOString()
						: undefined,
				},
				200,
			);
		}

		// 新規作成
		const newDocRef = await linksRef.add({
			url: normalizedUrl,
			title: null,
			description: null,
			imageUrl: null,
			categoryId: null,
			provider: "generic",
			fetchStatus: "ok",
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp(),
		});

		const createdSnap = await newDocRef.get();
		const createdData = createdSnap.data() as
			| {
					createdAt?: Timestamp;
					updatedAt?: Timestamp;
			  }
			| undefined;
		return c.json(
			{
				id: createdSnap.id,
				url: normalizedUrl,
				title: null,
				description: null,
				imageUrl: null,
				categoryId: null,
				provider: "generic" as const,
				fetchStatus: "ok" as const,
				createdAt: createdData?.createdAt
					? createdData.createdAt.toDate().toISOString()
					: undefined,
				updatedAt: createdData?.updatedAt
					? createdData.updatedAt.toDate().toISOString()
					: undefined,
			},
			201,
		);
	} catch (e: any) {
		if (e?.message === "UNAUTHORIZED") {
			return c.json({ code: "UNAUTHORIZED", message: "Invalid token" }, 401);
		}
		return c.json({ code: "INTERNAL", message: "Unexpected error" }, 500);
	}
};

// list links
const listLinksRoute = createRoute({
	method: "get",
	path: "/links",
	summary: "リンク一覧取得",
	description:
		"保存済みリンクの一覧を取得します。カテゴリや未分類のフィルタリング、並び順を指定できます。",
	request: {
		headers: z.object({ authorization: z.string() }),
		query: ListLinksQuery,
	},
	responses: {
		200: {
			description: "一覧を返却",
			content: { "application/json": { schema: ListLinksRes } },
		},
		401: {
			description: "認証エラー",
			content: { "application/json": { schema: ErrorRes } },
		},
		500: {
			description: "サーバー内部エラー",
			content: { "application/json": { schema: ErrorRes } },
		},
	},
});
const listLinksHandler: RouteHandler<typeof listLinksRoute> = async (c) => {
	try {
		const uid = await requireUid(c.req.header("authorization") ?? undefined);
		const {
			categoryId,
			inbox,
			sort,
			limit = 20,
			cursor,
		} = c.req.valid("query");

		let q = db
			.collection("users")
			.doc(uid)
			.collection(
				"links",
			) as FirebaseFirestore.Query<FirebaseFirestore.DocumentData>;
		if (inbox === "true") {
			q = q.where("categoryId", "==", null);
		} else if (categoryId) {
			q = q.where("categoryId", "==", categoryId);
		}
		q = q.orderBy("createdAt", (sort as "asc" | "desc") ?? "desc");

		if (cursor) {
			const cursorSnap = await db
				.collection("users")
				.doc(uid)
				.collection("links")
				.doc(cursor)
				.get();
			if (cursorSnap.exists) {
				q = q.startAfter(cursorSnap);
			}
		}

		const snap = await q.limit(limit).get();
		const items = snap.docs.map((d) => {
			const data = d.data() as {
				url: string;
				title: string | null;
				description: string | null;
				imageUrl: string | null;
				categoryId: string | null;
				createdAt?: Timestamp;
				updatedAt?: Timestamp;
				provider?: "youtube" | "x" | "instagram" | "generic";
				fetchStatus?: "ok" | "partial" | "failed";
			};
			return {
				id: d.id,
				url: data.url,
				title: data.title ?? null,
				description: data.description ?? null,
				imageUrl: data.imageUrl ?? null,
				categoryId: data.categoryId ?? null,
				provider: data.provider ?? "generic",
				fetchStatus: data.fetchStatus ?? "ok",
				createdAt: data.createdAt
					? data.createdAt.toDate().toISOString()
					: undefined,
				updatedAt: data.updatedAt
					? data.updatedAt.toDate().toISOString()
					: undefined,
			};
		});
		return c.json({ items }, 200);
	} catch (e: any) {
		if (e?.message === "UNAUTHORIZED") {
			return c.json({ code: "UNAUTHORIZED", message: "Invalid token" }, 401);
		}
		return c.json({ code: "INTERNAL", message: "Unexpected error" }, 500);
	}
};

// get link
const getLinkRoute = createRoute({
	method: "get",
	path: "/links/{id}",
	summary: "リンク詳細取得",
	description:
		"指定したリンク ID の詳細情報（タイトル、OGP画像、カテゴリなど）を返します。",
	request: {
		headers: z.object({ authorization: z.string() }),
		params: z.object({ id: z.string().describe("リンクのID") }),
	},
	responses: {
		200: {
			description: "詳細情報",
			content: { "application/json": { schema: Link } },
		},
		404: {
			description: "存在しない",
			content: { "application/json": { schema: ErrorRes } },
		},
		401: {
			description: "認証エラー",
			content: { "application/json": { schema: ErrorRes } },
		},
		500: {
			description: "サーバー内部エラー",
			content: { "application/json": { schema: ErrorRes } },
		},
	},
});
const getLinkHandler: RouteHandler<typeof getLinkRoute> = async (c) => {
	try {
		const uid = await requireUid(c.req.header("authorization") ?? undefined);
		const { id } = c.req.valid("param");
		const ref = db.collection("users").doc(uid).collection("links").doc(id);
		const snap = await ref.get();
		if (!snap.exists)
			return c.json({ code: "NOT_FOUND", message: "Link not found" }, 404);

		const data = snap.data() as {
			url: string;
			title: string | null;
			description: string | null;
			imageUrl: string | null;
			categoryId: string | null;
			createdAt?: Timestamp;
			updatedAt?: Timestamp;
			provider?: "youtube" | "x" | "instagram" | "generic";
			fetchStatus?: "ok" | "partial" | "failed";
		};
		return c.json(
			{
				id: snap.id,
				url: data.url,
				title: data.title ?? null,
				description: data.description ?? null,
				imageUrl: data.imageUrl ?? null,
				categoryId: data.categoryId ?? null,
				provider: data.provider ?? "generic",
				fetchStatus: data.fetchStatus ?? "ok",
				createdAt: data.createdAt
					? data.createdAt.toDate().toISOString()
					: undefined,
				updatedAt: data.updatedAt
					? data.updatedAt.toDate().toISOString()
					: undefined,
			},
			200,
		);
	} catch (e: any) {
		if (e?.message === "UNAUTHORIZED") {
			return c.json({ code: "UNAUTHORIZED", message: "Invalid token" }, 401);
		}
		return c.json({ code: "INTERNAL", message: "Unexpected error" }, 500);
	}
};

// move category
const moveRoute = createRoute({
	method: "patch",
	path: "/links/{id}/category",
	summary: "カテゴリ変更",
	description:
		"リンクを別のカテゴリへ移動します。`categoryId` を null にすると未分類 (Inbox) に移動します。",
	request: {
		headers: z.object({ authorization: z.string() }),
		params: z.object({ id: z.string().describe("リンクのID") }),
		body: {
			required: true,
			content: { "application/json": { schema: MoveCategoryBody } },
		},
	},
	responses: {
		200: {
			description: "変更後のリンクを返却",
			content: { "application/json": { schema: Link } },
		},
		404: {
			description: "存在しない",
			content: { "application/json": { schema: ErrorRes } },
		},
		401: {
			description: "認証エラー",
			content: { "application/json": { schema: ErrorRes } },
		},
		500: {
			description: "サーバー内部エラー",
			content: { "application/json": { schema: ErrorRes } },
		},
	},
});
const moveHandler: RouteHandler<typeof moveRoute> = async (c) => {
	try {
		const uid = await requireUid(c.req.header("authorization") ?? undefined);
		const { id } = c.req.valid("param");
		const { categoryId } = (await c.req.json()) as {
			categoryId: string | null;
		};

		const userRef = db.collection("users").doc(uid);
		const linkRef = userRef.collection("links").doc(id);
		const linkSnap = await linkRef.get();
		if (!linkSnap.exists) {
			return c.json({ code: "NOT_FOUND", message: "Link not found" }, 404);
		}

		if (categoryId) {
			const catRef = userRef.collection("categories").doc(categoryId);
			const catSnap = await catRef.get();
			if (!catSnap.exists) {
				return c.json(
					{ code: "NOT_FOUND", message: "Category not found" },
					404,
				);
			}
		}

		await linkRef.update({
			categoryId: categoryId ?? null,
			updatedAt: serverTimestamp(),
		});
		const updated = await linkRef.get();
		const data = updated.data() as {
			url: string;
			title: string | null;
			description: string | null;
			imageUrl: string | null;
			categoryId: string | null;
			createdAt?: Timestamp;
			updatedAt?: Timestamp;
			provider?: "youtube" | "x" | "instagram" | "generic";
			fetchStatus?: "ok" | "partial" | "failed";
		};

		return c.json(
			{
				id: updated.id,
				url: data.url,
				title: data.title ?? null,
				description: data.description ?? null,
				imageUrl: data.imageUrl ?? null,
				categoryId: data.categoryId ?? null,
				provider: data.provider ?? "generic",
				fetchStatus: data.fetchStatus ?? "ok",
				createdAt: data.createdAt
					? data.createdAt.toDate().toISOString()
					: undefined,
				updatedAt: data.updatedAt
					? data.updatedAt.toDate().toISOString()
					: undefined,
			},
			200,
		);
	} catch (e: any) {
		if (e?.message === "UNAUTHORIZED") {
			return c.json({ code: "UNAUTHORIZED", message: "Invalid token" }, 401);
		}
		return c.json({ code: "INTERNAL", message: "Unexpected error" }, 500);
	}
};

// list categories
const listCatsRoute = createRoute({
	method: "get",
	path: "/categories",
	summary: "カテゴリ一覧取得",
	description: "利用可能なカテゴリの一覧と、それぞれのリンク件数を返します。",
	request: { headers: z.object({ authorization: z.string() }) },
	responses: {
		200: {
			description: "カテゴリ一覧",
			content: {
				"application/json": { schema: z.object({ items: z.array(Category) }) },
			},
		},
		401: {
			description: "認証エラー",
			content: { "application/json": { schema: ErrorRes } },
		},
	},
});
const listCatsHandler: RouteHandler<typeof listCatsRoute> = async (c) => {
	try {
		const uid = await requireUid(c.req.header("authorization") ?? undefined);
		const catsRef = db.collection("users").doc(uid).collection("categories");
		const snap = await catsRef.get();
		const items = snap.docs.map((d) => ({
			id: d.id,
			name: (d.data().name as string) ?? "",
		}));
		return c.json({ items }, 200);
	} catch {
		return c.json({ code: "UNAUTHORIZED", message: "Invalid token" }, 401);
	}
};

// create category
const createCatRoute = createRoute({
	method: "post",
	path: "/categories",
	summary: "カテゴリ作成",
	description: "新しいカテゴリを作成します。",
	request: {
		headers: z.object({ authorization: z.string() }),
		body: {
			required: true,
			content: { "application/json": { schema: CategoryCreateBody } },
		},
	},
	responses: {
		201: {
			description: "作成に成功",
			content: { "application/json": { schema: Category } },
		},
		401: {
			description: "認証エラー",
			content: { "application/json": { schema: ErrorRes } },
		},
		409: {
			description: "重複カテゴリ名",
			content: { "application/json": { schema: ErrorRes } },
		},
	},
});
const createCatHandler: RouteHandler<typeof createCatRoute> = async (c) => {
	try {
		const uid = await requireUid(c.req.header("authorization") ?? undefined);
		const body = (await c.req.json()) as { name: string };
		const { name, nameLower } = normalizeCategoryName(body.name);
		const catsRef = db.collection("users").doc(uid).collection("categories");
		const dupSnap = await catsRef
			.where("nameLower", "==", nameLower)
			.limit(1)
			.get();
		if (!dupSnap.empty) {
			return c.json(
				{ code: "ALREADY_EXISTS", message: "Category name already exists" },
				409,
			);
		}
		const docRef = await catsRef.add({
			name,
			nameLower,
			createdAt: serverTimestamp(),
		});
		return c.json({ id: docRef.id, name, count: 0 }, 201);
	} catch {
		return c.json({ code: "UNAUTHORIZED", message: "Invalid token" }, 401);
	}
};

// search
const searchRoute = createRoute({
	method: "get",
	path: "/search",
	summary: "リンク検索",
	description:
		"タイトルやカテゴリ名を対象に検索を行います。結果は関連度順に返されます。",
	request: {
		headers: z.object({ authorization: z.string() }),
		query: SearchQuery,
	},
	responses: {
		200: {
			description: "検索結果",
			content: { "application/json": { schema: SearchRes } },
		},
		401: {
			description: "認証エラー",
			content: { "application/json": { schema: ErrorRes } },
		},
	},
});
const searchHandler: RouteHandler<typeof searchRoute> = async (c) => {
	try {
		const uid = await requireUid(c.req.header("authorization") ?? undefined);
		const { q, limit = 20, cursor } = c.req.valid("query");
		const linksRef = db.collection("users").doc(uid).collection("links");
		// Firestore prefix match using range query
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
		const querySnap = await searchQ.limit(limit).get();
		const items = querySnap.docs.map((d) => {
			const data = d.data() as {
				url: string;
				title: string | null;
				description: string | null;
				imageUrl: string | null;
				categoryId: string | null;
				createdAt?: Timestamp;
				updatedAt?: Timestamp;
				provider?: "youtube" | "x" | "instagram" | "generic";
				fetchStatus?: "ok" | "partial" | "failed";
			};
			return {
				id: d.id,
				url: data.url,
				title: data.title ?? null,
				description: data.description ?? null,
				imageUrl: data.imageUrl ?? null,
				categoryId: data.categoryId ?? null,
				provider: data.provider ?? "generic",
				fetchStatus: data.fetchStatus ?? "ok",
				createdAt: data.createdAt
					? data.createdAt.toDate().toISOString()
					: undefined,
				updatedAt: data.updatedAt
					? data.updatedAt.toDate().toISOString()
					: undefined,
			};
		});
		return c.json({ items }, 200);
	} catch {
		return c.json({ code: "UNAUTHORIZED", message: "Invalid token" }, 401);
	}
};

/* =========================
 * export
 * =======================*/
export const api = new OpenAPIHono()
	.openapi(healthRoute, healthHandler)
	.openapi(createLinkRoute, createLinkHandler)
	.openapi(listLinksRoute, listLinksHandler)
	.openapi(getLinkRoute, getLinkHandler)
	.openapi(moveRoute, moveHandler)
	.openapi(listCatsRoute, listCatsHandler)
	.openapi(createCatRoute, createCatHandler)
	.openapi(searchRoute, searchHandler);

export default api;
