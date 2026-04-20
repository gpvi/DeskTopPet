import type { ModelUsageRecord } from '../entities';
import type { UsageFilter } from '../../shared/types';

/**
 * Port: persistence operations for model usage tracking.
 */
export interface UsageRepository {
  save(record: ModelUsageRecord): Promise<void>;
  queryDailyTrend(filter: UsageFilter): Promise<ModelUsageRecord[]>;
}
