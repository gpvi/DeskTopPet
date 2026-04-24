import { create } from 'zustand';
import type { ModelUsageRecord } from '../../domain/entities/model-usage-record';
import type { LLMProviderIdentifier, LLMProviderConfig } from '../../infrastructure/llm/provider-config';
import { getAppContainer } from '../../app/composition-root';
import { updateLLMConfigInContainer } from '../../app/composition-root/create-app-container';
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

export interface LLMConfig {
  readonly provider: LLMProviderIdentifier;
  readonly baseUrl: string;
  readonly apiKey: string;
  readonly defaultModel: string;
}

const DEFAULT_LLM_CONFIG: LLMConfig = {
  provider: 'deepseek',
  baseUrl: 'https://api.deepseek.com/v1',
  apiKey: '',
  defaultModel: 'deepseek-chat',
};

const PROVIDER_PRESETS: Record<LLMProviderIdentifier, { baseUrl: string; defaultModel: string; label: string }> = {
  openai: { baseUrl: 'https://api.openai.com/v1', defaultModel: 'gpt-4o-mini', label: 'OpenAI' },
  anthropic: { baseUrl: 'https://api.anthropic.com/v1', defaultModel: 'claude-sonnet-4-20250514', label: 'Anthropic' },
  deepseek: { baseUrl: 'https://api.deepseek.com/v1', defaultModel: 'deepseek-chat', label: 'DeepSeek' },
  moonshot: { baseUrl: 'https://api.moonshot.cn/v1', defaultModel: 'moonshot-v1-8k', label: 'Moonshot (Kimi)' },
  qwen: { baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', defaultModel: 'qwen-plus', label: '通义千问' },
  zhipu: { baseUrl: 'https://open.bigmodel.cn/api/paas/v4', defaultModel: 'glm-4-flash', label: '智谱清言' },
};

export { PROVIDER_PRESETS };

export interface SettingsState {
  readonly settings: SettingEntry[];
  readonly usageSummary: UsageSummary;
  readonly isOpen: boolean;
  readonly isLoading: boolean;
  readonly llmConfig: LLMConfig;
  readonly isLLMConfigSaving: boolean;
  toggleSetting: (key: string) => void;
  togglePanel: () => void;
  loadSettings: () => Promise<void>;
  loadUsageSummary: () => Promise<void>;
  updateLLMConfig: (config: Partial<LLMConfig>) => void;
  saveLLMConfig: () => Promise<void>;
  loadLLMConfig: () => Promise<void>;
  resetLLMConfigToDefault: () => void;
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
  llmConfig: DEFAULT_LLM_CONFIG,
  isLLMConfigSaving: false,

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

  updateLLMConfig: (config: Partial<LLMConfig>) => {
    set((state) => ({
      llmConfig: { ...state.llmConfig, ...config },
    }));
  },

  saveLLMConfig: async () => {
    set({ isLLMConfigSaving: true });
    try {
      const config = get().llmConfig;
      await persistLLMConfig(config);
    } catch {
      // Save is best-effort
    } finally {
      set({ isLLMConfigSaving: false });
    }
  },

  loadLLMConfig: async () => {
    try {
      const loaded = await loadLLMConfig();
      set({ llmConfig: loaded });
    } catch {
      // Use default if load fails
    }
  },

  resetLLMConfigToDefault: () => {
    set({ llmConfig: DEFAULT_LLM_CONFIG });
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

const LLM_CONFIG_KEYS = {
  provider: 'llm:provider',
  baseUrl: 'llm:base_url',
  apiKey: 'llm:api_key',
  defaultModel: 'llm:default_model',
} as const;

async function persistLLMConfig(config: LLMConfig): Promise<void> {
  try {
    const container = getAppContainer();
    if (!container?.settingsRepository) {return;}

    await container.settingsRepository.set(LLM_CONFIG_KEYS.provider, config.provider);
    await container.settingsRepository.set(LLM_CONFIG_KEYS.baseUrl, config.baseUrl);
    await container.settingsRepository.set(LLM_CONFIG_KEYS.apiKey, config.apiKey);
    await container.settingsRepository.set(LLM_CONFIG_KEYS.defaultModel, config.defaultModel);

    await updateLLMConfigInContainer(config as LLMProviderConfig);
  } catch {
    // Persistence is best-effort
  }
}

async function loadLLMConfig(): Promise<LLMConfig> {
  try {
    const container = getAppContainer();
    if (!container?.settingsRepository) {return DEFAULT_LLM_CONFIG;}

    const provider = await container.settingsRepository.get(LLM_CONFIG_KEYS.provider);
    const baseUrl = await container.settingsRepository.get(LLM_CONFIG_KEYS.baseUrl);
    const apiKey = await container.settingsRepository.get(LLM_CONFIG_KEYS.apiKey);
    const defaultModel = await container.settingsRepository.get(LLM_CONFIG_KEYS.defaultModel);

    const validProvider = provider && isValidProvider(provider as LLMProviderIdentifier)
      ? provider as LLMProviderIdentifier
      : DEFAULT_LLM_CONFIG.provider;

    return {
      provider: validProvider,
      baseUrl: baseUrl ?? DEFAULT_LLM_CONFIG.baseUrl,
      apiKey: apiKey ?? DEFAULT_LLM_CONFIG.apiKey,
      defaultModel: defaultModel ?? DEFAULT_LLM_CONFIG.defaultModel,
    };
  } catch {
    return DEFAULT_LLM_CONFIG;
  }
}

function isValidProvider(provider: LLMProviderIdentifier): boolean {
  const validProviders: LLMProviderIdentifier[] = [
    'openai', 'anthropic', 'deepseek', 'moonshot', 'qwen', 'zhipu'
  ];
  return validProviders.includes(provider);
}
