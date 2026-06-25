import { ReactNode, createContext, useCallback, useContext, useState } from 'react';
import { STORAGE_KEYS } from '@/utils/constants';

interface Settings {
  autoRefresh: boolean;
}

interface SettingsContextValue extends Settings {
  setAutoRefresh: (v: boolean) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

const loadSettings = (): Settings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) return JSON.parse(raw) as Settings;
  } catch {
    // ignore
  }
  return { autoRefresh: true };
};

const saveSettings = (s: Settings) => {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(s));
};

const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<Settings>(loadSettings);

  const setAutoRefresh = useCallback((v: boolean) => {
    setSettings((s) => {
      const next = { ...s, autoRefresh: v };
      saveSettings(next);
      return next;
    });
  }, []);

  return (
    <SettingsContext.Provider value={{ ...settings, setAutoRefresh }}>
      {children}
    </SettingsContext.Provider>
  );
};

const useSettings = (): SettingsContextValue => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
};

export { SettingsProvider, useSettings };
