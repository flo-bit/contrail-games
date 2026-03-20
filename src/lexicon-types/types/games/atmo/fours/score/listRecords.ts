import type {} from "@atcute/lexicons";
import * as v from "@atcute/lexicons/validations";
import type {} from "@atcute/lexicons/ambient";
import * as ComAtprotoLabelDefs from "@atcute/atproto/types/label/defs";
import * as ComAtprotoRepoStrongRef from "@atcute/atproto/types/repo/strongRef";
import * as GamesAtmoFoursPuzzle from "../puzzle.js";
import * as GamesAtmoFoursScore from "../score.js";

const _appBskyActorProfileSchema = /*#__PURE__*/ v.object({
  $type: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.literal(
      "games.atmo.fours.score.listRecords#appBskyActorProfile",
    ),
  ),
  /**
   * Small image to be displayed next to posts from account. AKA, 'profile picture'
   * @accept image/png, image/jpeg
   * @maxSize 1000000
   */
  avatar: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.blob()),
  /**
   * Larger horizontal image to display behind profile view.
   * @accept image/png, image/jpeg
   * @maxSize 1000000
   */
  banner: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.blob()),
  createdAt: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.datetimeString()),
  /**
   * Free-form profile description text.
   * @maxLength 2560
   * @maxGraphemes 256
   */
  description: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [
      /*#__PURE__*/ v.stringLength(0, 2560),
      /*#__PURE__*/ v.stringGraphemes(0, 256),
    ]),
  ),
  /**
   * @maxLength 640
   * @maxGraphemes 64
   */
  displayName: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [
      /*#__PURE__*/ v.stringLength(0, 640),
      /*#__PURE__*/ v.stringGraphemes(0, 64),
    ]),
  ),
  get joinedViaStarterPack() {
    return /*#__PURE__*/ v.optional(ComAtprotoRepoStrongRef.mainSchema);
  },
  /**
   * Self-label values, specific to the Bluesky application, on the overall account.
   */
  get labels() {
    return /*#__PURE__*/ v.optional(
      /*#__PURE__*/ v.variant([ComAtprotoLabelDefs.selfLabelsSchema]),
    );
  },
  get pinnedPost() {
    return /*#__PURE__*/ v.optional(ComAtprotoRepoStrongRef.mainSchema);
  },
  /**
   * Free-form pronouns text.
   * @maxLength 200
   * @maxGraphemes 20
   */
  pronouns: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.string(), [
      /*#__PURE__*/ v.stringLength(0, 200),
      /*#__PURE__*/ v.stringGraphemes(0, 20),
    ]),
  ),
  website: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.genericUriString()),
});
const _mainSchema = /*#__PURE__*/ v.query(
  "games.atmo.fours.score.listRecords",
  {
    params: /*#__PURE__*/ v.object({
      /**
       * Filter by DID or handle (triggers on-demand backfill)
       */
      actor: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.actorIdentifierString()),
      cursor: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
      /**
       * Embed the referenced puzzle record
       */
      hydratePuzzle: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.boolean()),
      /**
       * @minimum 1
       * @maximum 200
       * @default 50
       */
      limit: /*#__PURE__*/ v.optional(
        /*#__PURE__*/ v.constrain(/*#__PURE__*/ v.integer(), [
          /*#__PURE__*/ v.integerRange(1, 200),
        ]),
        50,
      ),
      /**
       * Sort direction (default: desc for dates/numbers/counts, asc for strings)
       */
      order: /*#__PURE__*/ v.optional(
        /*#__PURE__*/ v.string<"asc" | "desc" | (string & {})>(),
      ),
      /**
       * Include profile + identity info keyed by DID
       */
      profiles: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.boolean()),
      /**
       * Filter by puzzle.uri
       */
      puzzleUri: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
      /**
       * Full-text search across: puzzle.uri, state
       */
      search: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
      /**
       * Field to sort by (default: time_us)
       */
      sort: /*#__PURE__*/ v.optional(
        /*#__PURE__*/ v.string<"puzzleUri" | "state" | (string & {})>(),
      ),
      /**
       * Filter by state
       */
      state: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
    }),
    output: {
      type: "lex",
      schema: /*#__PURE__*/ v.object({
        cursor: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
        get profiles() {
          return /*#__PURE__*/ v.optional(
            /*#__PURE__*/ v.array(profileEntrySchema),
          );
        },
        get records() {
          return /*#__PURE__*/ v.array(recordSchema);
        },
      }),
    },
  },
);
const _profileEntrySchema = /*#__PURE__*/ v.object({
  $type: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.literal("games.atmo.fours.score.listRecords#profileEntry"),
  ),
  cid: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
  collection: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.nsidString()),
  did: /*#__PURE__*/ v.didString(),
  handle: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
  get record() {
    return /*#__PURE__*/ v.optional(appBskyActorProfileSchema);
  },
  rkey: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
  uri: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.resourceUriString()),
});
const _recordSchema = /*#__PURE__*/ v.object({
  $type: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.literal("games.atmo.fours.score.listRecords#record"),
  ),
  cid: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
  collection: /*#__PURE__*/ v.nsidString(),
  did: /*#__PURE__*/ v.didString(),
  get puzzle() {
    return /*#__PURE__*/ v.optional(refPuzzleRecordSchema);
  },
  get record() {
    return /*#__PURE__*/ v.optional(GamesAtmoFoursScore.mainSchema);
  },
  rkey: /*#__PURE__*/ v.string(),
  time_us: /*#__PURE__*/ v.integer(),
  uri: /*#__PURE__*/ v.resourceUriString(),
});
const _refPuzzleRecordSchema = /*#__PURE__*/ v.object({
  $type: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.literal(
      "games.atmo.fours.score.listRecords#refPuzzleRecord",
    ),
  ),
  cid: /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
  collection: /*#__PURE__*/ v.nsidString(),
  did: /*#__PURE__*/ v.didString(),
  get record() {
    return /*#__PURE__*/ v.optional(GamesAtmoFoursPuzzle.mainSchema);
  },
  rkey: /*#__PURE__*/ v.string(),
  time_us: /*#__PURE__*/ v.integer(),
  uri: /*#__PURE__*/ v.resourceUriString(),
});

type appBskyActorProfile$schematype = typeof _appBskyActorProfileSchema;
type main$schematype = typeof _mainSchema;
type profileEntry$schematype = typeof _profileEntrySchema;
type record$schematype = typeof _recordSchema;
type refPuzzleRecord$schematype = typeof _refPuzzleRecordSchema;

export interface appBskyActorProfileSchema extends appBskyActorProfile$schematype {}
export interface mainSchema extends main$schematype {}
export interface profileEntrySchema extends profileEntry$schematype {}
export interface recordSchema extends record$schematype {}
export interface refPuzzleRecordSchema extends refPuzzleRecord$schematype {}

export const appBskyActorProfileSchema =
  _appBskyActorProfileSchema as appBskyActorProfileSchema;
export const mainSchema = _mainSchema as mainSchema;
export const profileEntrySchema = _profileEntrySchema as profileEntrySchema;
export const recordSchema = _recordSchema as recordSchema;
export const refPuzzleRecordSchema =
  _refPuzzleRecordSchema as refPuzzleRecordSchema;

export interface AppBskyActorProfile extends v.InferInput<
  typeof appBskyActorProfileSchema
> {}
export interface ProfileEntry extends v.InferInput<typeof profileEntrySchema> {}
export interface Record extends v.InferInput<typeof recordSchema> {}
export interface RefPuzzleRecord extends v.InferInput<
  typeof refPuzzleRecordSchema
> {}

export interface $params extends v.InferInput<mainSchema["params"]> {}
export interface $output extends v.InferXRPCBodyInput<mainSchema["output"]> {}

declare module "@atcute/lexicons/ambient" {
  interface XRPCQueries {
    "games.atmo.fours.score.listRecords": mainSchema;
  }
}
