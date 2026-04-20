/**
 * Type declarations for sql.js (WASM-based SQLite).
 * Covers only the surface area used by the persistence layer.
 */
declare module 'sql.js' {
  export interface SqlJsStatic {
    Database: new (data?: ArrayLike<number>) => Database;
  }

  export interface Database {
    run(sql: string, params?: unknown[]): Database;
    prepare(sql: string): Statement;
    exec(sql: string, params?: unknown[]): QueryExecResult[];
    export(): Uint8Array;
    close(): void;
  }

  export interface Statement {
    bind(params?: unknown[]): boolean;
    step(): boolean;
    getAsObject(): Record<string, unknown>;
    free(): boolean;
    get(params?: unknown[]): unknown[];
  }

  export interface QueryExecResult {
    columns: string[];
    values: unknown[][];
  }

  export type SqlJsConfig = {
    locateFile?: (filename: string) => string;
  };

  export default function initSqlJs(config?: SqlJsConfig): Promise<SqlJsStatic>;
}
