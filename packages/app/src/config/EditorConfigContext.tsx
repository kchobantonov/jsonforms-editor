import React, { createContext, useContext, useState, useCallback } from 'react';
import { EditorConfig, loadConfig, saveConfig } from './editorConfig';

interface EditorConfigContextValue {
  config: EditorConfig;
  updateConfig: (patch: Partial<EditorConfig>) => void;
}

const EditorConfigContext = createContext<EditorConfigContextValue | undefined>(
  undefined
);

export const EditorConfigProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [config, setConfig] = useState(loadConfig);

  const updateConfig = useCallback((patch: Partial<EditorConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...patch };
      saveConfig(next);
      return next;
    });
  }, []);

  return (
    <EditorConfigContext.Provider value={{ config, updateConfig }}>
      {children}
    </EditorConfigContext.Provider>
  );
};

export const useEditorConfig = () => {
  const ctx = useContext(EditorConfigContext);
  if (!ctx) {
    throw new Error('useEditorConfig must be used within EditorConfigProvider');
  }
  return ctx;
};
