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

/* =========================
 * Helpers
 * =======================*/
async function requireUid(authorization?: string): Promise<string> {
	if (!authorization?.startsWith("Bearer ")) {
		throw new Error("UNAUTHORIZED");
	}
	return "demo-uid"; // TODO: Firebase Admin verifyIdToken
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

		// TODO: URL 正規化（utm除去・小文字化など）
		const normalizedUrl = url;

		// TODO: Firestore lookup (uid, normalizedUrl)
		const existing = null; // 既存が見つかったらオブジェクトにする

		if (existing) {
			// 既存があれば 200
			return c.json(existing, 200);
		}

		// 新規作成フロー
		// 1. OGP をサーバーで取得 (title, description, imageUrl)
		// 2. AI分類 → categoryId（信頼度低ければ null）
		// 3. Firestore 保存
		const created = {
			id: "link_123",
			url,
			title: "Example Title",
			description: null,
			imageUrl: null,
			categoryId: null,
			provider: "generic" as const,
			fetchStatus: "ok" as const,
			createdAt: new Date().toISOString(),
			uid,
		};

		return c.json(created, 201);
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
	},
});
const listLinksHandler: RouteHandler<typeof listLinksRoute> = async (c) => {
	try {
		await requireUid(c.req.header("authorization") ?? undefined);
		return c.json({ items: [] }, 200);
	} catch {
		return c.json({ code: "UNAUTHORIZED", message: "Invalid token" }, 401);
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
	},
});
const getLinkHandler: RouteHandler<typeof getLinkRoute> = async (c) => {
	try {
		await requireUid(c.req.header("authorization") ?? undefined);
		const doc = null; // TODO: Firestore lookup
		if (!doc)
			return c.json({ code: "NOT_FOUND", message: "Link not found" }, 404);
		return c.json(doc, 200);
	} catch {
		return c.json({ code: "UNAUTHORIZED", message: "Invalid token" }, 401);
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
	},
});
const moveHandler: RouteHandler<typeof moveRoute> = async (c) => {
	try {
		const uid = await requireUid(c.req.header("authorization") ?? undefined);
		const { id } = c.req.valid("param");
		const { categoryId } = await c.req.json();
		return c.json(
			{
				id,
				url: "https://example.com",
				title: "Example",
				description: null,
				imageUrl: null,
				categoryId,
				createdAt: new Date().toISOString(),
				uid,
			},
			200,
		);
	} catch (e: any) {
		if (e?.message === "UNAUTHORIZED") {
			return c.json({ code: "UNAUTHORIZED", message: "Invalid token" }, 401);
		}
		return c.json({ code: "NOT_FOUND", message: "Link not found" }, 404);
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
		await requireUid(c.req.header("authorization") ?? undefined);
		return c.json(
			{ items: [{ id: "cat_design", name: "デザイン", count: 12 }] },
			200,
		);
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
	},
});
const createCatHandler: RouteHandler<typeof createCatRoute> = async (c) => {
	try {
		await requireUid(c.req.header("authorization") ?? undefined);
		const { name } = await c.req.json();
		return c.json({ id: "cat_new", name, count: 0 }, 201);
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
		await requireUid(c.req.header("authorization") ?? undefined);
		return c.json({ items: [] }, 200);
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
