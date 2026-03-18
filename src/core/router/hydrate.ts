import type { RelationConfig, ReferenceConfig, RecordRow, Database } from "../types";
import { getNestedValue, getRelationField } from "../types";
import { batchedInQuery, formatRecord } from "./helpers";

// --- Hydration: embed related records ---

export function parseHydrateParams(
  params: URLSearchParams,
  relations: Record<string, RelationConfig>,
  references: Record<string, ReferenceConfig>
): { relations: Record<string, number>; references: Set<string> } {
  const relHydrates: Record<string, number> = {};
  const refHydrates = new Set<string>();
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  for (const relName of Object.keys(relations)) {
    const val = params.get(`hydrate${capitalize(relName)}`);
    if (val) {
      const limit = parseInt(val, 10);
      if (!isNaN(limit) && limit > 0) {
        relHydrates[relName] = limit;
      }
    }
  }

  for (const refName of Object.keys(references)) {
    const val = params.get(`hydrate${capitalize(refName)}`);
    if (val === "true" || val === "1") {
      refHydrates.add(refName);
    }
  }

  return { relations: relHydrates, references: refHydrates };
}

// Per-relation hydrate result: array for ungrouped, Record<group, array> for grouped
export type HydrateResult = Record<string, Record<string, any[] | Record<string, any[]>>>;

export async function resolveHydrates(
  db: Database,
  relations: Record<string, RelationConfig>,
  requested: Record<string, number>,
  records: RecordRow[]
): Promise<HydrateResult> {
  if (Object.keys(requested).length === 0 || records.length === 0) return {};

  // Accumulate grouped results first, then flatten ungrouped ones
  const grouped: Record<string, Record<string, Record<string, any[]>>> = {};

  for (const [relName, hydrateLimit] of Object.entries(requested)) {
    const rel = relations[relName];
    const field = getRelationField(rel);
    const matchMode = rel.match ?? "uri";

    const matchValues = matchMode === "did"
      ? [...new Set(records.map((r) => r.did))]
      : records.map((r) => r.uri);

    if (matchValues.length === 0) continue;

    // Fetch more rows than needed since the limit applies per-group, not total
    const groupCount = rel.groupBy ? 10 : 1; // estimate; overfetch is fine
    const maxRows = matchValues.length * hydrateLimit * groupCount;
    const relatedRows = await batchedInQuery<RecordRow>(
      db,
      `SELECT uri, did, collection, rkey, record, time_us FROM records
       WHERE collection = ? AND json_extract(record, '$.${field}') IN (__IN__)
       ORDER BY time_us DESC
       LIMIT ${maxRows}`,
      [rel.collection],
      matchValues
    );

    for (const row of relatedRows) {
      const record = row.record ? JSON.parse(row.record) : null;
      const matchedValue = getNestedValue(record, field);
      if (!matchedValue) continue;

      const parentUris = matchMode === "did"
        ? records.filter((r) => r.did === matchedValue).map((r) => r.uri)
        : [matchedValue];

      const groupValue = rel.groupBy
        ? String(getNestedValue(record, rel.groupBy) ?? "other")
        : "_flat";

      for (const parentUri of parentUris) {
        const targetUri = matchMode === "did" ? parentUri : matchedValue;

        if (!grouped[targetUri]) grouped[targetUri] = {};
        if (!grouped[targetUri][relName]) grouped[targetUri][relName] = {};
        if (!grouped[targetUri][relName][groupValue]) grouped[targetUri][relName][groupValue] = [];

        const group = grouped[targetUri][relName][groupValue];
        if (group.length < hydrateLimit) {
          group.push(formatRecord(row));
        }
      }
    }
  }

  // Convert to final shape: ungrouped relations become flat arrays
  const result: HydrateResult = {};
  for (const [uri, rels] of Object.entries(grouped)) {
    result[uri] = {};
    for (const [relName, groups] of Object.entries(rels)) {
      if (relations[relName].groupBy) {
        result[uri][relName] = groups;
      } else {
        result[uri][relName] = groups["_flat"] ?? [];
      }
    }
  }

  return result;
}

// --- References: embed records that our records point at ---

export type ReferenceResult = Record<string, Record<string, any>>;

export async function resolveReferences(
  db: Database,
  references: Record<string, ReferenceConfig>,
  requested: Set<string>,
  records: RecordRow[]
): Promise<ReferenceResult> {
  if (requested.size === 0 || records.length === 0) return {};

  const result: ReferenceResult = {};

  for (const refName of requested) {
    const ref = references[refName];
    if (!ref) continue;

    // Extract target URIs from our records
    const targetMap = new Map<string, string[]>(); // targetUri → parentUris[]
    for (const r of records) {
      const parsed = r.record ? JSON.parse(r.record) : null;
      const targetValue = parsed ? getNestedValue(parsed, ref.field) : null;
      if (!targetValue) continue;
      if (!targetMap.has(targetValue)) targetMap.set(targetValue, []);
      targetMap.get(targetValue)!.push(r.uri);
    }

    const targetUris = [...targetMap.keys()];
    if (targetUris.length === 0) continue;

    const rows = await batchedInQuery<RecordRow>(
      db,
      `SELECT uri, did, collection, rkey, record, time_us FROM records
       WHERE collection = ? AND uri IN (__IN__)`,
      [ref.collection],
      targetUris
    );

    for (const row of rows) {
      const parentUris = targetMap.get(row.uri) ?? [];
      for (const parentUri of parentUris) {
        if (!result[parentUri]) result[parentUri] = {};
        result[parentUri][refName] = formatRecord(row);
      }
    }
  }

  return result;
}
