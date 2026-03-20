import type {} from "@atcute/lexicons";
import * as v from "@atcute/lexicons/validations";
import type {} from "@atcute/lexicons/ambient";
import * as ComAtprotoRepoStrongRef from "@atcute/atproto/types/repo/strongRef";

const _guessSchema = /*#__PURE__*/ v.object({
  $type: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.literal("games.atmo.fours.score#guess"),
  ),
  /**
   * The four words selected in this guess.
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
const _lostSchema = /*#__PURE__*/ v.literal("games.atmo.fours.score#lost");
const _mainSchema = /*#__PURE__*/ v.record(
  /*#__PURE__*/ v.tidString(),
  /*#__PURE__*/ v.object({
    $type: /*#__PURE__*/ v.literal("games.atmo.fours.score"),
    /**
     * Ordered list of guesses made during the game. Each guess is a group of four words.
     */
    get guesses() {
      return /*#__PURE__*/ v.array(guessSchema);
    },
    /**
     * Reference to the puzzle this score is for.
     */
    get puzzle() {
      return ComAtprotoRepoStrongRef.mainSchema;
    },
    /**
     * The outcome of the game.
     */
    state: /*#__PURE__*/ v.string<
      | "games.atmo.fours.score#lost"
      | "games.atmo.fours.score#won"
      | (string & {})
    >(),
  }),
);
const _wonSchema = /*#__PURE__*/ v.literal("games.atmo.fours.score#won");

type guess$schematype = typeof _guessSchema;
type lost$schematype = typeof _lostSchema;
type main$schematype = typeof _mainSchema;
type won$schematype = typeof _wonSchema;

export interface guessSchema extends guess$schematype {}
export interface lostSchema extends lost$schematype {}
export interface mainSchema extends main$schematype {}
export interface wonSchema extends won$schematype {}

export const guessSchema = _guessSchema as guessSchema;
export const lostSchema = _lostSchema as lostSchema;
export const mainSchema = _mainSchema as mainSchema;
export const wonSchema = _wonSchema as wonSchema;

export interface Guess extends v.InferInput<typeof guessSchema> {}
export type Lost = v.InferInput<typeof lostSchema>;
export interface Main extends v.InferInput<typeof mainSchema> {}
export type Won = v.InferInput<typeof wonSchema>;

declare module "@atcute/lexicons/ambient" {
  interface Records {
    "games.atmo.fours.score": mainSchema;
  }
}
