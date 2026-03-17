import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Database, ContrailConfig } from "../types";
import { registerAdminRoutes } from "./admin";
import { registerCollectionRoutes } from "./collection";

export function createApp(
  db: Database,
  config: ContrailConfig,
  adminSecret?: string
): Hono {
  const app = new Hono();
  app.use("*", cors());

  app.get("/", (c) => c.json({ status: "ok" }));
  app.get("/health", (c) => c.json({ status: "ok" }));
  app.get("/xrpc/_health", (c) => c.json({ status: "ok" }));

  registerAdminRoutes(app, db, config, adminSecret);
  registerCollectionRoutes(app, db, config);

  return app;
}
