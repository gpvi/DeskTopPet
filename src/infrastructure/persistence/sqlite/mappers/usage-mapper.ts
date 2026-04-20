import type { ModelUsageRecord } from '../../../../domain/entities/model-usage-record';

/** Row shape returned from the model_usage_records table. */
export interface UsageRow {
  usage_id: string;
  session_id: string;
  task_id: string;
  provider: string;
  model: string;
  feature: string;
  input_tokens: number;
  output_tokens: number;
  created_at: string;
}

/** Parameter shape for persisting a usage record. */
export interface UsageRowParams {
  $usageId: string;
  $sessionId: string;
  $taskId: string;
  $provider: string;
  $model: string;
  $feature: string;
  $inputTokens: number;
  $outputTokens: number;
  $createdAt: string;
}

/** Map a database row to a ModelUsageRecord entity. */
export function mapRowToUsageRecord(row: UsageRow): ModelUsageRecord {
  return {
    usageId: row.usage_id,
    sessionId: row.session_id,
    taskId: row.task_id,
    provider: row.provider,
    model: row.model,
    feature: row.feature,
    inputTokens: row.input_tokens,
    outputTokens: row.output_tokens,
    createdAt: new Date(row.created_at),
  };
}

/** Map a ModelUsageRecord entity to database row parameters. */
export function mapUsageRecordToRow(record: ModelUsageRecord): UsageRowParams {
  return {
    $usageId: record.usageId,
    $sessionId: record.sessionId,
    $taskId: record.taskId,
    $provider: record.provider,
    $model: record.model,
    $feature: record.feature,
    $inputTokens: record.inputTokens,
    $outputTokens: record.outputTokens,
    $createdAt: record.createdAt.toISOString(),
  };
}
