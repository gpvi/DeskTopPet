/**
 * Filter criteria for querying model usage records.
 */
export interface UsageFilter {
  readonly startDate: Date;
  readonly endDate: Date;
  readonly provider?: string;
  readonly model?: string;
  readonly feature?: string;
}
