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
import React, { useEffect, useMemo, useRef } from 'react';
import { useEditorConfig } from '../config/EditorConfigContext';
import { resolveThemeMode } from '../theme/resolveThemeMode';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'svelte-flowbite-jsonforms': any;
    }
  }
}

export const SvelteFlowbitePreview: React.FC = () => {
  const elementRef = useRef<HTMLElement | null>(null);
  const schema = useExportSchema();
  const uiSchema = useExportUiSchema();
  const editorSchema = useSchema();
  const data = useMemo(
    () => (editorSchema ? generateEmptyData(editorSchema) : {}),
    [editorSchema]
  );
  const { config } = useEditorConfig();
  const themeMode = resolveThemeMode(config.themeMode);

  useEffect(() => {
    let cancelled = false;

    customElements.whenDefined('svelte-flowbite-jsonforms').then(() => {
      if (cancelled || !elementRef.current) {
        return;
      }

      Object.assign(elementRef.current, {
        mode: themeMode,
        theme: 'sunset',
        ajvOptions: previewOptions,
        schema,
        uischema: uiSchema,
        data,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [data, schema, themeMode, uiSchema]);

  return schema ? (
    <div>
      <svelte-flowbite-jsonforms
        ref={elementRef}
      ></svelte-flowbite-jsonforms>
    </div>
  ) : null;
};
