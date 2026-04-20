import { useEffect } from 'react';
import { useSettingsStore } from './settingsStore';
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

export default function SettingsPanel() {
  const isOpen = useSettingsStore((state) => state.isOpen);
  const settings = useSettingsStore((state) => state.settings);
  const usageSummary = useSettingsStore((state) => state.usageSummary);
  const toggleSetting = useSettingsStore((state) => state.toggleSetting);
  const togglePanel = useSettingsStore((state) => state.togglePanel);
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  const loadUsageSummary = useSettingsStore((state) => state.loadUsageSummary);

  useEffect(() => {
    loadSettings();
    loadUsageSummary();
  }, [loadSettings, loadUsageSummary]);

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
          {settings.map((entry) => (
            <div key={entry.key} className={styles.settingRow}>
              <span className={styles.settingLabel}>{entry.label}</span>
              <ToggleSwitch
                isActive={entry.value}
                onToggle={() => toggleSetting(entry.key)}
              />
            </div>
          ))}
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
