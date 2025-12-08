/**
 * ---------------------------------------------------------------------
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 * ---------------------------------------------------------------------
 */
import { createAjv } from '@jsonforms/core';
import { vanillaCells, vanillaRenderers } from '@jsonforms/vanilla-renderers';
import { JsonForms } from '@jsonforms/react';
import React, { useMemo } from 'react';

import {
  generateEmptyData,
  previewOptions,
  useExportSchema,
  useExportUiSchema,
  useSchema,
} from '@chobantonov/jsonforms-editor';

export const ReactVanillaPreview: React.FC = () => {
  const schema = useExportSchema();
  const uischema = useExportUiSchema();
  const editorSchema = useSchema();
  const previewData = useMemo(
    () => (editorSchema ? generateEmptyData(editorSchema) : {}),
    [editorSchema]
  );
  const ajv = createAjv(previewOptions);
  return (
    <JsonForms
      ajv={ajv}
      data={previewData}
      schema={schema}
      uischema={uischema}
      renderers={vanillaRenderers}
      cells={vanillaCells}
    />
  );
};
