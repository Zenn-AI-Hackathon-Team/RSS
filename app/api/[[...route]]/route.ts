export const runtime = "nodejs";

import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { handle } from "hono/vercel";
import { api } from "./api";

const app = new OpenAPIHono().basePath("/api").route("/", api);

app.openAPIRegistry.registerComponent("securitySchemes", "bearerAuth", {
	type: "http",
	scheme: "bearer",
	bearerFormat: "JWT",
	description: "Firebase IDトークンを Bearer トークンとして指定します。",
});

app
	.doc("/specification", {
		openapi: "3.0.0",
		info: { title: "API", version: "1.0.0" },
	})
	.get("/doc", swaggerUI({ url: "/api/specification" }));

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const PATCH = handle(app);

export type AppType = typeof app;
