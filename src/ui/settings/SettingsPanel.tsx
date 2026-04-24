import { useEffect, useState, useRef } from 'react';
import { useSettingsStore, PROVIDER_PRESETS, type LLMConfig } from './settingsStore';
import type { LLMProviderIdentifier } from '../../infrastructure/llm/provider-config';
import styles from './SettingsPanel.module.css';

function ToggleSwitch({
  isActive,
  onToggle,
}: {
  isActive: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      className={`${styles.toggle} ${isActive ? styles.toggleActive : ''}`}
      onClick={onToggle}
      type="button"
      aria-pressed={isActive}
    >
      <span
        className={`${styles.toggleKnob} ${isActive ? styles.toggleKnobActive : ''}`}
      />
    </button>
  );
}

function SelectInput({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly { readonly value: string; readonly label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className={styles.inputRow}>
      <label className={styles.inputLabel}>{label}</label>
      <select
        className={styles.selectInput}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'password';
}) {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = type === 'password' && !showPassword ? 'password' : 'text';

  return (
    <div className={styles.inputRow}>
      <label className={styles.inputLabel}>{label}</label>
      <div className={styles.inputWrapper}>
        <input
          type={inputType}
          className={styles.textInput}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        {type === 'password' && (
          <button
            type="button"
            className={styles.togglePassword}
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? '隐藏密码' : '显示密码'}
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function SettingsPanel() {
  const isOpen = useSettingsStore((state) => state.isOpen);
  const settings = useSettingsStore((state) => state.settings);
  const usageSummary = useSettingsStore((state) => state.usageSummary);
  const storeLlmConfig = useSettingsStore((state) => state.llmConfig);
  const isLLMConfigSaving = useSettingsStore((state) => state.isLLMConfigSaving);
  const toggleSetting = useSettingsStore((state) => state.toggleSetting);
  const togglePanel = useSettingsStore((state) => state.togglePanel);
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  const loadUsageSummary = useSettingsStore((state) => state.loadUsageSummary);
  const loadLLMConfig = useSettingsStore((state) => state.loadLLMConfig);
  const updateLLMConfig = useSettingsStore((state) => state.updateLLMConfig);
  const saveLLMConfig = useSettingsStore((state) => state.saveLLMConfig);
  const resetLLMConfigToDefault = useSettingsStore((state) => state.resetLLMConfigToDefault);

  const [localConfig, setLocalConfig] = useState<LLMConfig>(storeLlmConfig);
  const [hasChanges, setHasChanges] = useState(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      hasLoadedRef.current = false;
      loadSettings();
      loadUsageSummary();
      loadLLMConfig().then(() => {
        hasLoadedRef.current = true;
      });
    }
  }, [isOpen, loadSettings, loadUsageSummary, loadLLMConfig]);

  useEffect(() => {
    if (isOpen && hasLoadedRef.current && !hasChanges) {
      setLocalConfig(storeLlmConfig);
    }
  }, [isOpen, storeLlmConfig, hasChanges]);

  const handleProviderChange = (provider: string) => {
    const providerId = provider as LLMProviderIdentifier;
    const preset = PROVIDER_PRESETS[providerId];
    if (preset) {
      const newConfig = {
        ...localConfig,
        provider: providerId,
        baseUrl: preset.baseUrl,
        defaultModel: preset.defaultModel,
      };
      setLocalConfig(newConfig);
      setHasChanges(true);
    }
  };

  const handleInputChange = (key: keyof LLMConfig, value: string) => {
    const newConfig = { ...localConfig, [key]: value };
    setLocalConfig(newConfig);
    setHasChanges(true);
  };

  const handleSave = async () => {
    updateLLMConfig(localConfig);
    await saveLLMConfig();
    setHasChanges(false);
  };

  const handleReset = () => {
    resetLLMConfigToDefault();
    setHasChanges(false);
  };

  const providerOptions = Object.entries(PROVIDER_PRESETS).map(([value, preset]) => ({
    value,
    label: preset.label,
  }));

  if (!isOpen) {return null;}

  return (
    <div className={styles.overlay} onClick={togglePanel}>
      <div className={styles.panel} onClick={(event) => event.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>设置</span>
          <button
            className={styles.closeButton}
            onClick={togglePanel}
            type="button"
            aria-label="关闭设置"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M1 1L13 13M1 13L13 1"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className={styles.body}>
          <div className={styles.section}>
            <div className={styles.sectionTitle}>通用设置</div>
            {settings.map((entry) => (
              <div key={entry.key} className={styles.settingRow}>
                <span className={styles.settingLabel}>{entry.label}</span>
                <ToggleSwitch
                  isActive={entry.value}
                  onToggle={() => toggleSetting(entry.key)}
                />
              </div>
            ))}
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>模型配置</div>
            <SelectInput
              label="模型提供商"
              value={localConfig.provider}
              options={providerOptions}
              onChange={handleProviderChange}
            />
            <TextInput
              label="API 地址"
              value={localConfig.baseUrl}
              onChange={(value) => handleInputChange('baseUrl', value)}
              placeholder="https://api.example.com/v1"
            />
            <TextInput
              label="API 密钥"
              value={localConfig.apiKey}
              onChange={(value) => handleInputChange('apiKey', value)}
              placeholder="sk-..."
              type="password"
            />
            <TextInput
              label="默认模型"
              value={localConfig.defaultModel}
              onChange={(value) => handleInputChange('defaultModel', value)}
              placeholder="gpt-4o-mini"
            />
            <div className={styles.buttonRow}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={handleReset}
                disabled={isLLMConfigSaving}
              >
                重置
              </button>
              <button
                type="button"
                className={`${styles.primaryButton} ${!hasChanges ? styles.buttonDisabled : ''}`}
                onClick={handleSave}
                disabled={isLLMConfigSaving || !hasChanges}
              >
                {isLLMConfigSaving ? '保存中...' : '保存配置'}
              </button>
            </div>
          </div>

          <div className={styles.usageSection}>
            <div className={styles.usageTitle}>近 7 天模型用量</div>
            <div className={styles.usageGrid}>
              <div className={styles.usageCard}>
                <span className={styles.usageLabel}>调用次数</span>
                <span className={styles.usageValue}>{usageSummary.totalCalls}</span>
              </div>
              <div className={styles.usageCard}>
                <span className={styles.usageLabel}>输入 Tokens</span>
                <span className={styles.usageValue}>{usageSummary.totalInputTokens}</span>
              </div>
              <div className={styles.usageCard}>
                <span className={styles.usageLabel}>输出 Tokens</span>
                <span className={styles.usageValue}>{usageSummary.totalOutputTokens}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
