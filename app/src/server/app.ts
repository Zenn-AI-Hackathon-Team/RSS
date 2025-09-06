import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { zValidator } from "@hono/zod-validator";

const Health = z.object({ ok: z.boolean() }).openapi("Health");
const ClassifyBody = z
	.object({ url: z.string().url() })
	.openapi("ClassifyBody");
const ClassifyResult = z
	.object({
		category: z.string(),
		tags: z.array(z.string()).max(5),
	})
	.openapi("ClassifyResult");

export const app = new OpenAPIHono()
	.openapi(
		createRoute({
			method: "get",
			path: "/healthz",
			responses: {
				200: {
					description: "Health",
					content: { "application/json": { schema: Health } },
				},
			},
		}),
		(c) => c.json({ ok: true }),
	)
	.openapi(
		createRoute({
			method: "post",
			path: "/classify",
			request: {
				body: {
					content: { "application/json": { schema: ClassifyBody } },
					required: true,
				},
			},
			responses: {
				200: {
					description: "Classification",
					content: { "application/json": { schema: ClassifyResult } },
				},
			},
		}),
		async (c) => {
			const { url } = (await c.req.json()) as { url: string };
			const result = { category: "engineering", tags: ["nextjs", "hono"] };
			return c.json(result);
		},
	)
	.doc("/openapi.json", {
		openapi: "3.1.0",
		info: { title: "My App API", version: "1.0.0" },
	})

	.get("/docs", (c) =>
		c.html(`<!doctype html><html><head>
  <meta charset="utf-8"/><title>Swagger UI</title>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css"/>
  <style>body{margin:0}</style>
</head><body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
  <script>addEventListener('load',()=>{window.ui=SwaggerUIBundle({
    url:'/api/openapi.json', dom_id:'#swagger-ui', presets:[SwaggerUIBundle.presets.apis]
  })})</script>
</body></html>`),
	);

export type AppType = typeof app;
