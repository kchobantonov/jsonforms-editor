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

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'vue-vanilla-jsonforms': any;
    }
  }
}

export const VueVanillaPreview: React.FC = () => {
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

  return inputSchema ? (
    <div>
      <vue-vanilla-jsonforms
        ajv-options={options}
        schema={inputSchema}
        uischema={inputUISchema}
        data={inputData}
      ></vue-vanilla-jsonforms>
    </div>
  ) : null;
};
