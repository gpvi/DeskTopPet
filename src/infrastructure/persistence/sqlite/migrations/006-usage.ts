/**
 * Migration 006: Create model_usage_records table.
 *
 * Stores per-invocation token usage for LLM calls,
 * enabling daily trend aggregation and cost analysis.
 */
export const MIGRATION_006_USAGE = `
  CREATE TABLE IF NOT EXISTS model_usage_records (
    usage_id        TEXT PRIMARY KEY,
    session_id      TEXT    NOT NULL,
    task_id         TEXT    NOT NULL,
    provider        TEXT    NOT NULL,
    model           TEXT    NOT NULL,
    feature         TEXT    NOT NULL,
    input_tokens    INTEGER NOT NULL,
    output_tokens   INTEGER NOT NULL,
    created_at      TEXT    NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_usage_created_at
    ON model_usage_records(created_at);

  CREATE INDEX IF NOT EXISTS idx_usage_provider
    ON model_usage_records(provider);

  CREATE INDEX IF NOT EXISTS idx_usage_feature
    ON model_usage_records(feature);
`;
