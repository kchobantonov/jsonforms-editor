import React from 'react';

import {
  JsonFormsEditor,
  defaultSchemaDecorators,
  defaultSchemaProviders,
} from '@chobantonov/jsonforms-editor';

export const App = () => (
  <JsonFormsEditor
    schemaProviders={defaultSchemaProviders}
    schemaDecorators={defaultSchemaDecorators}
  />
);

export default App;
