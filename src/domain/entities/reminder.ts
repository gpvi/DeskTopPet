/**
 * A scheduled reminder created for the user.
 */
export interface Reminder {
  readonly reminderId: string;
  readonly userId: string;
  readonly title: string;
  readonly scheduleRule: {
    readonly type: 'once' | 'recurring';
    readonly datetime?: Date;
    readonly cronExpression?: string;
  };
  readonly status: 'active' | 'completed' | 'snoozed' | 'cancelled';
  readonly quietHoursPolicy: {
    readonly respectQuietHours: boolean;
    readonly rescheduleTo?: string;
  };
}
