/**
 * ---------------------------------------------------------------------
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 * ---------------------------------------------------------------------
 */
import {
  defaultSchemaDecorators,
  defaultSchemaProviders,
  JsonFormsEditor,
  ReactMaterialPreview,
} from '@chobantonov/jsonforms-editor';
import React, { useMemo } from 'react';

import { AngularMaterialPreview } from './components/AngularMaterialPreview';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { ReactVanillaPreview } from './components/ReactVanillaPreview';
import { VueVanillaPreview } from './components/VueVanillaPreview';
import { VueVuetifyPreview } from './components/VueVuetifyPreview';
import { ExampleSchemaService } from './core/schemaService';
import {
  EditorConfigProvider,
  useEditorConfig,
} from './config/EditorConfigContext';
import { PREVIEW_IDS } from './config/editorConfig';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { resolveThemeMode } from './theme/resolveThemeMode';
import { createAppTheme } from './theme/createAppTheme';

const schemaService = new ExampleSchemaService();

const ConfigAwareEditor: React.FC = () => {
  const { config } = useEditorConfig();
  const themeMode = resolveThemeMode(config.themeMode);
  const theme = useMemo(() => createAppTheme(themeMode), [themeMode]);

  const editorTabs = useMemo(
    () =>
      [
        {
          id: PREVIEW_IDS.REACT_MATERIAL,
          name: 'Preview (React Material)',
          Component: ReactMaterialPreview,
        },
        {
          id: PREVIEW_IDS.REACT_VANILLA,
          name: 'Preview (React Vanilla)',
          Component: ReactVanillaPreview,
        },
        {
          id: PREVIEW_IDS.ANGULAR_MATERIAL,
          name: 'Preview (Angular)',
          Component: AngularMaterialPreview,
        },
        {
          id: PREVIEW_IDS.VUE_VUETIFY,
          name: 'Preview (Vue Vuetify)',
          Component: VueVuetifyPreview,
        },
        {
          id: PREVIEW_IDS.VUE_VANILLA,
          name: 'Preview (Vue Vanilla)',
          Component: VueVanillaPreview,
        },
      ].filter((tab) => config.enabledRenderers.includes(tab.id)),
    [config.enabledRenderers]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <JsonFormsEditor
        schemaService={schemaService}
        schemaProviders={defaultSchemaProviders}
        schemaDecorators={defaultSchemaDecorators}
        editorTabs={editorTabs}
        header={Header}
        footer={Footer}
      />
    </ThemeProvider>
  );
};

export const App = () => (
  <EditorConfigProvider>
    <ConfigAwareEditor />
  </EditorConfigProvider>
);
