import BetterSqlite3 from "better-sqlite3";
import type { Database, Statement } from "../core/types";

export function createSqliteDatabase(path: string): Database {
  const raw = new BetterSqlite3(path);
  raw.pragma("journal_mode = WAL");

  function wrapStatement(
    stmt: BetterSqlite3.Statement,
    boundValues: any[] = []
  ): Statement {
    return {
      bind(...values: any[]): Statement {
        return wrapStatement(stmt, values);
      },
      async run() {
        return stmt.run(...boundValues);
      },
      async all<T>() {
        return { results: stmt.all(...boundValues) as T[] };
      },
      async first<T>() {
        return (stmt.get(...boundValues) as T) ?? null;
      },
    };
  }

  return {
    prepare(sql: string): Statement {
      const stmt = raw.prepare(sql);
      return wrapStatement(stmt);
    },
    async batch(stmts: Statement[]): Promise<any[]> {
      const results: any[] = [];
      const transaction = raw.transaction(() => {
        for (const stmt of stmts) {
          results.push(stmt.run());
        }
      });
      transaction();
      return results;
    },
  };
}
