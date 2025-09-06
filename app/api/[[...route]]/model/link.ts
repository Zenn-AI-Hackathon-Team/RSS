import { z } from "@hono/zod-openapi";

export const ClassifyBody = z
	.object({
		url: z.string().url().openapi({ example: "https://example.com" }),
	})
	.openapi("ClassifyBody");

export const ClassifyResult = z
	.object({
		category: z.string(),
		tags: z.array(z.string()).max(5),
	})
	.openapi("ClassifyResult");

export const Health = z.object({ ok: z.boolean() }).openapi("Health");
