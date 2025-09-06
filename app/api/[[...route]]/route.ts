export const runtime = "nodejs";

import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { handle } from "hono/vercel";
import { linksApi } from "./linksApi";

const app = new OpenAPIHono()
	.basePath("/api")
	.route("/", linksApi)
	.doc("/specification", {
		openapi: "3.0.0",
		info: { title: "API", version: "1.0.0" },
	})
	.get("/doc", swaggerUI({ url: "/api/specification" }));

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);

export type AppType = typeof app;
