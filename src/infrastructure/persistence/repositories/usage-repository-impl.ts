import type { Database as SqlJsDatabase } from 'sql.js';
import type { UsageRepository } from '../../../domain/ports/usage-repository.port';
import type { ModelUsageRecord } from '../../../domain/entities/model-usage-record';
import type { UsageFilter } from '../../../shared/types/usage-filter';
import { RepositoryError } from '../../../shared/errors/repository-error';
import {
  mapRowToUsageRecord,
  mapUsageRecordToRow,
  type UsageRow,
} from '../sqlite/mappers/usage-mapper';

/**
 * SQLite-backed implementation of UsageRepository.
 *
 * Persists model usage records and supports daily trend queries
 * filtered by date range, provider, model, and feature.
 */
export class UsageRepositoryImpl implements UsageRepository {
  constructor(private readonly database: SqlJsDatabase) {}

  async save(record: ModelUsageRecord): Promise<void> {
    try {
      this.executeSave(record);
    } catch (error) {
      throw wrapRepositoryError(error, 'save');
    }
  }

  async queryDailyTrend(filter: UsageFilter): Promise<ModelUsageRecord[]> {
    try {
      return this.executeQueryDailyTrend(filter);
    } catch (error) {
      throw wrapRepositoryError(error, 'queryDailyTrend');
    }
  }

  private executeSave(record: ModelUsageRecord): void {
    const params = mapUsageRecordToRow(record);
    this.database.run(
      `INSERT INTO model_usage_records
         (usage_id, session_id, task_id, provider, model, feature, input_tokens, output_tokens, created_at)
       VALUES ($usageId, $sessionId, $taskId, $provider, $model, $feature, $inputTokens, $outputTokens, $createdAt)`,
      [
        params.$usageId, params.$sessionId, params.$taskId,
        params.$provider, params.$model, params.$feature,
        params.$inputTokens, params.$outputTokens, params.$createdAt,
      ],
    );
  }

  private executeQueryDailyTrend(filter: UsageFilter): ModelUsageRecord[] {
    const { sql, params } = buildDailyTrendQuery(filter);
    const statement = this.database.prepare(sql);
    statement.bind(params);

    const rows: UsageRow[] = [];
    while (statement.step()) {
      rows.push(statement.getAsObject() as unknown as UsageRow);
    }
    statement.free();

    return rows.map(mapRowToUsageRecord);
  }
}

function buildDailyTrendQuery(filter: UsageFilter): { sql: string; params: unknown[] } {
  const conditions: string[] = [
    'created_at >= ?',
    'created_at <= ?',
  ];
  const params: unknown[] = [
    filter.startDate.toISOString(),
    filter.endDate.toISOString(),
  ];

  if (filter.provider) {
    conditions.push('provider = ?');
    params.push(filter.provider);
  }

  if (filter.model) {
    conditions.push('model = ?');
    params.push(filter.model);
  }

  if (filter.feature) {
    conditions.push('feature = ?');
    params.push(filter.feature);
  }

  const whereClause = conditions.join(' AND ');
  const sql = `SELECT usage_id, session_id, task_id, provider, model, feature, input_tokens, output_tokens, created_at
               FROM model_usage_records
               WHERE ${whereClause}
               ORDER BY created_at ASC`;

  return { sql, params };
}

function wrapRepositoryError(error: unknown, operation: string): RepositoryError {
  if (error instanceof RepositoryError) {
    return error;
  }
  const message = error instanceof Error ? error.message : String(error);
  return new RepositoryError(
    `Failed to ${operation}: ${message}`,
    operation,
  );
}
