/**
 * Represents the companion app user and their preferences.
 */
export interface UserProfile {
  readonly userId: string;
  readonly nickname: string;
  readonly preferredTone: string;
  readonly workSchedule: {
    readonly startHour: number;
    readonly endHour: number;
    readonly timezone: string;
  };
  readonly privacySettings: {
    readonly allowClipboardAccess: boolean;
    readonly allowFileAccess: boolean;
    readonly allowAppLaunch: boolean;
  };
}
