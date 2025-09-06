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
		categoryId: z.string().optional(),
		inbox: z.enum(["true", "false"]).optional(),
		sort: z.enum(["asc", "desc"]).default("desc").optional(),
		limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
		cursor: z.string().optional(),
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
		q: z.string().min(1),
		limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
		cursor: z.string().optional(),
	})
	.openapi("SearchQuery");

export const SearchRes = ListLinksRes.openapi("SearchRes");
