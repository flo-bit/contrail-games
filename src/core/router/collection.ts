import type { Hono } from "hono";
import type { ContrailConfig, Database, RecordRow, QueryableField } from "../types";
import { getCollectionNames } from "../types";
import { resolvedQueryable } from "../queryable.generated";
import { queryRecords, getUsersByCollection } from "../db";
import { backfillUser } from "../backfill";
import { resolveHydrates } from "./hydrate";
import { resolveProfiles, collectDids } from "./profiles";
import { resolveActor } from "../identity";
import type { FormattedRecord } from "./helpers";
import { formatRecord, parseIntParam, fieldToParam } from "./helpers";

export function registerCollectionRoutes(
  app: Hono,
  db: Database,
  config: ContrailConfig
): void {
  for (const collection of getCollectionNames(config)) {
    const colConfig = config.collections[collection];
    const relations = colConfig.relations ?? {};
    const queryableFields: Record<string, QueryableField> =
      resolvedQueryable[collection] ?? colConfig.queryable ?? {};

    app.get(`/xrpc/${collection}.getRecords`, async (c) => {
      const params = new URL(c.req.url).searchParams;
      const limit = parseIntParam(params.get("limit"), 50);
      const cursor = parseIntParam(params.get("cursor"));
      const actor = params.get("actor") || params.get("did") || undefined;
      const wantProfiles = params.get("profiles") === "true";

      let did: string | undefined;
      if (actor) {
        const resolved = await resolveActor(db, actor);
        if (!resolved) return c.json({ error: "Could not resolve actor" }, 400);
        did = resolved;
        await backfillUser(db, did, collection, Date.now() + 10_000, config);
      }

      const filters: Record<string, string> = {};
      for (const [field, fieldConfig] of Object.entries(queryableFields)) {
        if (fieldConfig.type === "range") continue;
        const value = params.get(fieldToParam(field));
        if (value) filters[field] = value;
      }

      const rangeFilters: Record<string, { min?: string; max?: string }> = {};
      const countFilters: Record<string, number> = {};
      const rangeFields = new Set(
        Object.entries(queryableFields)
          .filter(([, c]) => c.type === "range")
          .map(([f]) => f)
      );
      parseMinMaxParams(
        params.getAll("min"),
        params.getAll("max"),
        rangeFields,
        rangeFilters,
        countFilters
      );

      const result = await queryRecords(db, config, {
        collection,
        did,
        limit,
        cursor,
        filters,
        rangeFilters,
        countFilters,
      });

      const rows = result.records;
      const hydrates = await resolveHydrates(
        db,
        relations,
        params.getAll("hydrate"),
        rows
      );

      const formattedRecords: FormattedRecord[] = rows.map((row) => {
        const formatted = formatRecord(row);
        if (row.counts) formatted.counts = row.counts;
        const h = hydrates[row.uri];
        if (h) formatted.hydrates = h;
        return formatted;
      });

      const allDids = collectDids(rows, hydrates);
      const profiles = wantProfiles
        ? await resolveProfiles(db, config, allDids)
        : undefined;

      return c.json({
        records: formattedRecords,
        cursor: result.cursor,
        ...(profiles ? { profiles } : {}),
      });
    });

    app.get(`/xrpc/${collection}.getRecord`, async (c) => {
      const uri = c.req.query("uri");
      if (!uri) return c.json({ error: "uri parameter required" }, 400);

      const row = await db
        .prepare(
          "SELECT uri, did, collection, rkey, cid, record, time_us, indexed_at FROM records WHERE uri = ? AND collection = ?"
        )
        .bind(uri, collection)
        .first<RecordRow>();

      if (!row) return c.json({ error: "Record not found" }, 404);

      const countRows = await db
        .prepare("SELECT type, count FROM counts WHERE uri = ?")
        .bind(uri)
        .all<{ type: string; count: number }>();

      const formatted = formatRecord(row);
      if (countRows.results?.length) {
        const counts: Record<string, number> = {};
        for (const cr of countRows.results) counts[cr.type] = cr.count;
        formatted.counts = counts;
      }

      const params = new URL(c.req.url).searchParams;
      const wantProfilesSingle = params.get("profiles") === "true";

      const hydrates = await resolveHydrates(
        db,
        relations,
        params.getAll("hydrate"),
        [row]
      );
      const h = hydrates[row.uri];
      if (h) formatted.hydrates = h;

      const allDids = collectDids([row], hydrates);
      const profilesSingle = wantProfilesSingle
        ? await resolveProfiles(db, config, allDids)
        : undefined;

      return c.json({
        ...formatted,
        ...(profilesSingle ? { profiles: profilesSingle } : {}),
      });
    });

    app.get(`/xrpc/${collection}.getUsers`, async (c) => {
      const limit = parseIntParam(c.req.query("limit"), 50) ?? 50;
      const cursor = parseIntParam(c.req.query("cursor"));
      return c.json(await getUsersByCollection(db, collection, limit, cursor));
    });

    app.get(`/xrpc/${collection}.getStats`, async (c) => {
      const row = await db
        .prepare(
          "SELECT COUNT(DISTINCT did) as unique_users, COUNT(*) as total_records, MAX(time_us) as last_record_time_us FROM records WHERE collection = ?"
        )
        .bind(collection)
        .first<{
          unique_users: number;
          total_records: number;
          last_record_time_us: number | null;
        }>();

      return c.json({
        collection,
        unique_users: row?.unique_users ?? 0,
        total_records: row?.total_records ?? 0,
        last_record_time_us: row?.last_record_time_us ?? null,
      });
    });

    for (const [queryName, handler] of Object.entries(
      colConfig.queries ?? {}
    )) {
      app.get(`/xrpc/${collection}.${queryName}`, async (c) => {
        const params = new URL(c.req.url).searchParams;
        return handler(db, params, config);
      });
    }
  }
}

function parseMinMaxParams(
  minValues: string[],
  maxValues: string[],
  rangeFields: Set<string>,
  rangeFilters: Record<string, { min?: string; max?: string }>,
  countFilters: Record<string, number>
): void {
  for (const [side, values] of [
    ["min", minValues],
    ["max", maxValues],
  ] as const) {
    for (const raw of values) {
      const sep = raw.indexOf(":");
      if (sep === -1) continue;
      const key = raw.slice(0, sep);
      const val = raw.slice(sep + 1);
      if (rangeFields.has(key)) {
        (rangeFilters[key] ??= {})[side] = val;
      } else if (side === "min") {
        const num = parseInt(val, 10);
        if (!isNaN(num)) countFilters[key] = num;
      }
    }
  }
}
