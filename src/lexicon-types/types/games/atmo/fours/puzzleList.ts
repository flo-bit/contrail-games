import type {} from "@atcute/lexicons";
import * as v from "@atcute/lexicons/validations";
import type {} from "@atcute/lexicons/ambient";

const _mainSchema = /*#__PURE__*/ v.record(
  /*#__PURE__*/ v.string(),
  /*#__PURE__*/ v.object({
    $type: /*#__PURE__*/ v.literal("games.atmo.fours.puzzleList"),
    /**
     * Ordered list of AT URIs pointing to games.atmo.fours.puzzle records.
     */
    puzzles: /*#__PURE__*/ v.array(/*#__PURE__*/ v.resourceUriString()),
  }),
);

type main$schematype = typeof _mainSchema;

export interface mainSchema extends main$schematype {}

export const mainSchema = _mainSchema as mainSchema;

export interface Main extends v.InferInput<typeof mainSchema> {}

declare module "@atcute/lexicons/ambient" {
  interface Records {
    "games.atmo.fours.puzzleList": mainSchema;
  }
}
