import { create } from 'zustand';
import type { ModelUsageRecord } from '../../domain/entities/model-usage-record';
import { getAppContainer } from '../../app/composition-root';
import {
  applyRuntimeSetting,
  applyRuntimeSettings,
} from '../../infrastructure/system/runtime/system-preferences';

export interface SettingEntry {
  readonly key: string;
  readonly label: string;
  readonly value: boolean;
}

export interface UsageSummary {
  readonly totalInputTokens: number;
  readonly totalOutputTokens: number;
  readonly totalCalls: number;
}

export interface SettingsState {
  readonly settings: SettingEntry[];
  readonly usageSummary: UsageSummary;
  readonly isOpen: boolean;
  readonly isLoading: boolean;
  toggleSetting: (key: string) => void;
  togglePanel: () => void;
  loadSettings: () => Promise<void>;
  loadUsageSummary: () => Promise<void>;
}

const DEFAULT_SETTINGS: SettingEntry[] = [
  { key: 'auto_start', label: '开机自启动', value: false },
  { key: 'reminder_enabled', label: '提醒功能', value: true },
  { key: 'memory_enabled', label: '记忆功能', value: true },
  { key: 'notification_enabled', label: '系统通知', value: true },
];

const EMPTY_USAGE_SUMMARY: UsageSummary = {
  totalInputTokens: 0,
  totalOutputTokens: 0,
  totalCalls: 0,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  usageSummary: EMPTY_USAGE_SUMMARY,
  isOpen: false,
  isLoading: false,

  toggleSetting: (key: string) => {
    const updatedSettings = get().settings.map((entry) =>
      entry.key === key ? { ...entry, value: !entry.value } : entry,
    );
    set({ settings: updatedSettings });

    const targetEntry = updatedSettings.find((entry) => entry.key === key);
    if (!targetEntry) {return;}

    void persistSettingEntry(targetEntry);
    void applyRuntimeSetting(targetEntry.key, targetEntry.value);
  },

  togglePanel: () => set((state) => ({ isOpen: !state.isOpen })),

  loadSettings: async () => {
    set({ isLoading: true });
    try {
      const loaded = await loadAllSettings();
      set({ settings: loaded, isLoading: false });
      void applyRuntimeSettings(loaded);
    } catch {
      set({ isLoading: false });
    }
  },

  loadUsageSummary: async () => {
    const summary = await loadUsageSummary();
    set({ usageSummary: summary });
  },
}));

async function persistSettingEntry(entry: SettingEntry): Promise<void> {
  try {
    const container = getAppContainer();
    if (container?.settingsRepository) {
      await container.settingsRepository.set(entry.key, String(entry.value));
    }
  } catch {
    // Settings persistence is best-effort
  }
}

async function loadAllSettings(): Promise<SettingEntry[]> {
  try {
    const container = getAppContainer();
    if (!container?.settingsRepository) {return DEFAULT_SETTINGS;}

    const loaded: SettingEntry[] = [];
    for (const defaultEntry of DEFAULT_SETTINGS) {
      const stored = await container.settingsRepository.get(defaultEntry.key);
      loaded.push({
        ...defaultEntry,
        value: stored !== null ? stored === 'true' : defaultEntry.value,
      });
    }
    return loaded;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

async function loadUsageSummary(): Promise<UsageSummary> {
  try {
    const container = getAppContainer();
    if (!container?.usageRepository) {return EMPTY_USAGE_SUMMARY;}

    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 7);

    const usageRecords = await container.usageRepository.queryDailyTrend({
      startDate,
      endDate,
    });
    return summarizeUsage(usageRecords);
  } catch {
    return EMPTY_USAGE_SUMMARY;
  }
}

function summarizeUsage(records: ModelUsageRecord[]): UsageSummary {
  return records.reduce<UsageSummary>(
    (summary, record) => ({
      totalInputTokens: summary.totalInputTokens + record.inputTokens,
      totalOutputTokens: summary.totalOutputTokens + record.outputTokens,
      totalCalls: summary.totalCalls + 1,
    }),
    EMPTY_USAGE_SUMMARY,
  );
}
