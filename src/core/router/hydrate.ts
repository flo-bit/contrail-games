import type { RelationConfig, RecordRow, Database } from "../types";
import { getNestedValue, getRelationField } from "../types";
import { batchedInQuery, formatRecord } from "./helpers";

// --- Hydration: embed related records that point at the parent ---

function parseHydrateParams(
  values: string[],
  relations: Record<string, RelationConfig>
): Record<string, number> {
  const hydrates: Record<string, number> = {};
  for (const val of values) {
    const sep = val.indexOf(":");
    const name = sep === -1 ? val : val.slice(0, sep);
    const limit = sep === -1 ? 10 : parseInt(val.slice(sep + 1), 10);
    if (relations[name] && !isNaN(limit) && limit > 0) {
      hydrates[name] = limit;
    }
  }
  return hydrates;
}

export async function resolveHydrates(
  db: Database,
  relations: Record<string, RelationConfig>,
  hydrateParams: string[],
  records: RecordRow[]
): Promise<Record<string, Record<string, Record<string, any[]>>>> {
  const requested = parseHydrateParams(hydrateParams, relations);
  if (Object.keys(requested).length === 0 || records.length === 0) return {};

  const result: Record<string, Record<string, Record<string, any[]>>> = {};

  for (const [relName, hydrateLimit] of Object.entries(requested)) {
    const rel = relations[relName];
    const field = getRelationField(rel);
    const matchMode = rel.match ?? "uri";

    const matchValues = matchMode === "did"
      ? [...new Set(records.map((r) => r.did))]
      : records.map((r) => r.uri);

    if (matchValues.length === 0) continue;

    const maxRows = matchValues.length * hydrateLimit;
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
        ? String(getNestedValue(record, rel.groupBy) ?? "_other")
        : "_all";

      for (const parentUri of parentUris) {
        const targetUri = matchMode === "did" ? parentUri : matchedValue;

        if (!result[targetUri]) result[targetUri] = {};
        if (!result[targetUri][relName]) result[targetUri][relName] = {};
        if (!result[targetUri][relName][groupValue]) result[targetUri][relName][groupValue] = [];

        const group = result[targetUri][relName][groupValue];
        if (group.length < hydrateLimit) {
          group.push(formatRecord(row));
        }
      }
    }
  }

  return result;
}
