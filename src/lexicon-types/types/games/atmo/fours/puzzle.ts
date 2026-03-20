import type {} from "@atcute/lexicons";
import * as v from "@atcute/lexicons/validations";
import type {} from "@atcute/lexicons/ambient";

const _groupSchema = /*#__PURE__*/ v.object({
  $type: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.literal("games.atmo.fours.puzzle#group"),
  ),
  /**
   * The category name that describes what the four words have in common.
   * @maxLength 400
   * @maxGraphemes 100
   */
  category: /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [
    /*#__PURE__*/ v.stringLength(0, 400),
    /*#__PURE__*/ v.stringGraphemes(0, 100),
  ]),
  /**
   * Difficulty level of the group. 0 = easiest, 3 = hardest.
   * @minimum 0
   * @maximum 3
   */
  difficulty: /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.integer(), [
    /*#__PURE__*/ v.integerRange(0, 3),
  ]),
  /**
   * The four words belonging to this group.
   * @minLength 4
   * @maxLength 4
   */
  words: /*#__PURE__*/ v.constrain(
    /*#__PURE__*/ v.array(
      /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [
        /*#__PURE__*/ v.stringLength(0, 200),
        /*#__PURE__*/ v.stringGraphemes(0, 50),
      ]),
    ),
    [/*#__PURE__*/ v.arrayLength(4, 4)],
  ),
});
const _mainSchema = /*#__PURE__*/ v.record(
  /*#__PURE__*/ v.tidString(),
  /*#__PURE__*/ v.object({
    $type: /*#__PURE__*/ v.literal("games.atmo.fours.puzzle"),
    /**
     * Whether the puzzle author allows this puzzle to be used in daily puzzle feeds.
     */
    allowDaily: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.boolean()),
    /**
     * Client-declared timestamp when the puzzle was created.
     */
    createdAt: /*#__PURE__*/ v.datetimeString(),
    /**
     * The four groups that make up the puzzle.
     * @minLength 4
     * @maxLength 4
     */
    get groups() {
      return /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.array(groupSchema), [
        /*#__PURE__*/ v.arrayLength(4, 4),
      ]);
    },
  }),
);

type group$schematype = typeof _groupSchema;
type main$schematype = typeof _mainSchema;

export interface groupSchema extends group$schematype {}
export interface mainSchema extends main$schematype {}

export const groupSchema = _groupSchema as groupSchema;
export const mainSchema = _mainSchema as mainSchema;

export interface Group extends v.InferInput<typeof groupSchema> {}
export interface Main extends v.InferInput<typeof mainSchema> {}

declare module "@atcute/lexicons/ambient" {
  interface Records {
    "games.atmo.fours.puzzle": mainSchema;
  }
}
