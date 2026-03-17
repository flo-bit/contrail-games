import { createApp } from "../core/router";
import { initSchema } from "../core/db";
import { runIngestCycle } from "../core/jetstream";
import { config as rawConfig } from "../config";
import { validateConfig, resolveConfig } from "../core/types";

const config = resolveConfig(rawConfig);
validateConfig(config);

let schemaReady = false;

async function ensureSchema(db: D1Database): Promise<void> {
  if (!schemaReady) {
    await initSchema(db, config);
    schemaReady = true;
  }
}

interface Env {
  DB: D1Database;
  ADMIN_SECRET?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    await ensureSchema(env.DB);
    return createApp(env.DB, config, env.ADMIN_SECRET).fetch(request);
  },

  async scheduled(
    _event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    await ensureSchema(env.DB);
    ctx.waitUntil(runIngestCycle(env.DB, config));
  },
};
