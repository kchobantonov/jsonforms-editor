/**
 * ---------------------------------------------------------------------
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 * ---------------------------------------------------------------------
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { JsonFormsEditor } from '../src/JsonFormsEditor';
import { defaultSchemaDecorators } from '../src/properties/schemaDecorators';
import { propertySchemaProvider } from '../src/properties/schemaProviders';

test('renders header', async () => {
  render(
    <JsonFormsEditor
      schemaProviders={[propertySchemaProvider]}
      schemaDecorators={defaultSchemaDecorators}
    />
  );

  // Wait for the header text to appear in the DOM
  await waitFor(() => {
    expect(screen.getByText(/JSON Forms Editor/i)).toBeInTheDocument();
  });
});
