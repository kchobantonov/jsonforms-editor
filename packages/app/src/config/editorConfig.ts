export type ThemeMode = 'light' | 'dark' | 'system';

export interface EditorConfig {
  themeMode: ThemeMode;
  language: string;
  enabledRenderers: string[];
}

const STORAGE_KEY = 'jsonforms-editor-config';

export const PREVIEW_IDS = {
  REACT_MATERIAL: 'react-material',
  REACT_VANILLA: 'react-vanilla',
  ANGULAR_MATERIAL: 'angular-material',
  VUE_VUETIFY: 'vue-vuetify',
  VUE_VANILLA: 'vue-vanilla',
} as const;

export const defaultConfig: EditorConfig = {
  themeMode: 'system',
  language: 'en',
  enabledRenderers: [
    'react-material',
    'react-vanilla',
    'vue-vuetify',
    'vue-vanilla',
    'angular-material',
  ],
};

export const loadConfig = (): EditorConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultConfig, ...JSON.parse(raw) } : defaultConfig;
  } catch {
    return defaultConfig;
  }
};

export const saveConfig = (config: EditorConfig) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
};
