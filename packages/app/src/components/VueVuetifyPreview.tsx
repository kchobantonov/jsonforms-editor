/**
 * ---------------------------------------------------------------------
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 * ---------------------------------------------------------------------
 */
import {
  generateEmptyData,
  previewOptions,
  useExportSchema,
  useExportUiSchema,
  useSchema,
} from '@chobantonov/jsonforms-editor';
import React, { useMemo } from 'react';
import { useEditorConfig } from '../config/EditorConfigContext';
import { resolveThemeMode } from '../theme/resolveThemeMode';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'vue-vuetify-jsonforms': any;
    }
  }
}

export const VueVuetifyPreview: React.FC = () => {
  const schema = useExportSchema();
  const uiSchema = useExportUiSchema();
  const editorSchema = useSchema();
  const data = useMemo(
    () => (editorSchema ? generateEmptyData(editorSchema) : {}),
    [editorSchema]
  );
  const inputSchema = JSON.stringify(schema);
  const inputUISchema = JSON.stringify(uiSchema);
  const inputData = JSON.stringify(data);
  const options = JSON.stringify(previewOptions);
  const { config } = useEditorConfig();
  const themeMode = resolveThemeMode(config.themeMode);

  return inputSchema ? (
    <div>
      <vue-vuetify-jsonforms
        dark={themeMode === 'dark'}
        ajv-options={options}
        schema={inputSchema}
        uischema={inputUISchema}
        data={inputData}
        vuetify-options={JSON.stringify({
          defaults: {
            global: {
              hideDetails: 'auto',
            },
            VField: {
              variant: 'outlined',
            },
            VTextField: {
              variant: 'outlined',
            },
            VCombobox: {
              variant: 'outlined',
            },
            VSelect: {
              variant: 'outlined',
            },
            VAutocomplete: {
              variant: 'outlined',
            },
            VTextarea: {
              variant: 'outlined',
            },
            VNumberInput: {
              variant: 'outlined',
              inset: true,
            },
            VDateInput: {
              variant: 'outlined',
            },
            VCheckbox: { color: 'primary' },
          },
        })}
      ></vue-vuetify-jsonforms>
    </div>
  ) : null;
};
