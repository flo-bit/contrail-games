import type { ContrailConfig } from "./core/types";

export const config: ContrailConfig = {
  namespace: "games.atmo",
  collections: {
    "games.atmo.fours.puzzle": {
      relations: {
        scores: {
          collection: "games.atmo.fours.score",
        },
      },
    },
    "games.atmo.fours.puzzleList": {},
    "games.atmo.fours.score": {
      references: {
        puzzle: {
          collection: "games.atmo.fours.puzzle",
          field: "puzzle.uri",
        },
      },
    },
  },
};
