import { z } from "@hono/zod-openapi";

export const Health = z.object({ ok: z.boolean() }).openapi("Health");

export const ErrorRes = z
	.object({
		code: z.string(),
		message: z.string(),
	})
	.openapi("ErrorRes");

export const Category = z
	.object({
		id: z.string(),
		name: z.string(),
		count: z.number().int().optional(),
	})
	.openapi("Category");

export const CategoryCreateBody = z
	.object({
		name: z.string().min(1),
	})
	.openapi("CategoryCreateBody");

export const Link = z
	.object({
		id: z.string(),
		url: z.string().url(),
		title: z.string().nullable(),
		description: z.string().nullable(),
		imageUrl: z.string().url().nullable(),
		categoryId: z.string().nullable(),
		provider: z.enum(["youtube", "x", "instagram", "generic"]).optional(),
		fetchStatus: z.enum(["ok", "partial", "failed"]).optional(),
		createdAt: z.string().datetime().optional(),
		updatedAt: z.string().datetime().optional(),
	})
	.openapi("Link");

export const CreateLinkBody = z
	.object({
		url: z.string().url(),
		create: z.boolean().default(false).optional(),
	})
	.openapi("CreateLinkBody");

export const ListLinksQuery = z
	.object({
		categoryId: z.string().optional().openapi({
			description:
				"カテゴリID。'inbox' が 'true' のときは指定しないでください（無視されます）。",
		}),
		inbox: z
			.enum(["true", "false"]) // boolean を文字列で受けるAPI仕様
			.optional()
			.openapi({
				description:
					"未分類（Inbox）のみを対象にするフラグ。'true' の場合、'categoryId' は無視されます。",
			}),
		sort: z
			.enum(["asc", "desc"])
			.default("desc")
			.optional()
			.openapi({
				description: "作成日時の並び順。既定は 'desc'（新しい順）。",
			}),
		limit: z.coerce
			.number()
			.int()
			.min(1)
			.max(100)
			.default(20)
			.optional()
			.openapi({ description: "取得件数。1〜100、既定は20。" }),
		cursor: z.string().optional().openapi({
			description:
				"ページネーション用カーソル。前回のレスポンスで取得した最後のアイテムのドキュメントIDを指定してください（startAfter に使用）。",
		}),
	})
	.openapi("ListLinksQuery");

export const ListLinksRes = z
	.object({ items: z.array(Link) })
	.openapi("ListLinksRes");

export const MoveCategoryBody = z
	.object({ categoryId: z.string().nullable() })
	.openapi("MoveCategoryBody");

export const SearchQuery = z
	.object({
		q: z
			.string()
			.min(1)
			.openapi({
				description: "検索キーワード。タイトル・カテゴリ名を対象にします。",
			}),
		limit: z.coerce
			.number()
			.int()
			.min(1)
			.max(100)
			.default(20)
			.optional()
			.openapi({ description: "取得件数。1〜100、既定は20。" }),
		cursor: z.string().optional().openapi({
			description:
				"ページネーション用カーソル。前回のレスポンスで取得した最後のアイテムのドキュメントIDを指定してください。",
		}),
	})
	.openapi("SearchQuery");

export const SearchRes = ListLinksRes.openapi("SearchRes");
