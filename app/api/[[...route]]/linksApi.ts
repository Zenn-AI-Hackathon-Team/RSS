import { OpenAPIHono, createRoute, RouteHandler } from "@hono/zod-openapi";
import { ClassifyBody, ClassifyResult, Health } from "./model/link";

const healthRoute = createRoute({
	method: "get",
	path: "/healthz",
	responses: {
		200: {
			description: "OK",
			content: { "application/json": { schema: Health } },
		},
	},
});
const healthHandler: RouteHandler<typeof healthRoute> = (c) =>
	c.json({ ok: true });

const classifyRoute = createRoute({
	method: "post",
	path: "/links/classify",
	request: {
		body: {
			required: true,
			content: { "application/json": { schema: ClassifyBody } },
		},
	},
	responses: {
		200: {
			description: "Classification",
			content: { "application/json": { schema: ClassifyResult } },
		},
	},
});
const classifyHandler: RouteHandler<typeof classifyRoute> = async (c) => {
	const { url } = (await c.req.json()) as { url: string };
	return c.json({ category: "engineering", tags: ["nextjs", "hono"] });
};

export const linksApi = new OpenAPIHono()
	.openapi(healthRoute, healthHandler)
	.openapi(classifyRoute, classifyHandler);
