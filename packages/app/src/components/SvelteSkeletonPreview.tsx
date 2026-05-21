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
      'svelte-skeleton-jsonforms': any;
    }
  }
}

export const SvelteSkeletonPreview: React.FC = () => {
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

    customElements.whenDefined('svelte-skeleton-jsonforms').then(() => {
      if (cancelled || !elementRef.current) {
        return;
      }

      Object.assign(elementRef.current, {
        mode: themeMode,
        theme: 'cerberus',
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
      <svelte-skeleton-jsonforms
        ref={elementRef}
      ></svelte-skeleton-jsonforms>
    </div>
  ) : null;
};
