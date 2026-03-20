// Auto-generated — do not edit. Run `pnpm generate` to regenerate.
import type { QueryableField } from "./types";

export const resolvedQueryable: Record<string, Record<string, QueryableField>> = {
  "games.atmo.fours.puzzle": {
    "createdAt": {
      "type": "range"
    }
  },
  "games.atmo.fours.puzzleList": {},
  "games.atmo.fours.score": {
    "puzzle.uri": {},
    "state": {}
  }
};

export interface ResolvedRelation {
  collection: string;
  groupBy: string;
  groups: Record<string, string>; // shortName → full token value
}

export const resolvedRelationsMap: Record<string, Record<string, ResolvedRelation>> = {};
