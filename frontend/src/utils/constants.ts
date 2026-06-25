export const TIMING = {
  BARCODE_REFRESH_INTERVAL: 12_000,
} as const;

export const DEMO_MODE = {
  TRIGGER_USERNAME: 'demo',
  DISPLAY_NAME: 'Demo User',
  BARCODE_IDS: ['DEMO1234567890', 'DEMO0987654321', 'DEMO1357924680', 'DEMO2468135790'],
} as const;

export const STORAGE_KEYS = {
  AUTH: 'srcgo_auth',
  CREDENTIALS: 'srcgo_credentials',
  SETTINGS: 'srcgo_settings',
} as const;
