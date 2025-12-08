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
import React from 'react';

import { AngularMaterialPreview } from './components/AngularMaterialPreview';
import { VueVanillaPreview } from './components/VueVanillaPreview';
import { VueVuetifyPreview } from './components/VueVuetifyPreview';
import { ReactVanillaPreview } from './components/ReactVanillaPreview';
import { Footer } from './components/Footer';
import { ExampleSchemaService } from './core/schemaService';

const schemaService = new ExampleSchemaService();
export const App = () => (
  <JsonFormsEditor
    schemaService={schemaService}
    schemaProviders={defaultSchemaProviders}
    schemaDecorators={defaultSchemaDecorators}
    editorTabs={[
      { name: 'Preview (React Material)', Component: ReactMaterialPreview },
      { name: 'Preview (React Vanilla)', Component: ReactVanillaPreview },
      { name: 'Preview (Angular)', Component: AngularMaterialPreview },
      { name: 'Preview (Vue Vuetify)', Component: VueVuetifyPreview },
      { name: 'Preview (Vue Vanilla)', Component: VueVanillaPreview },
    ]}
    footer={Footer}
  />
);
