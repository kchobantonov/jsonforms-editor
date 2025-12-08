import type { JsonSchema } from '@jsonforms/core';
import type { DefaultsOptions } from 'vuetify/lib/composables/defaults.mjs';

export type ResolvedSchema = {
  schema?: JsonSchema;
  resolved: boolean;
  error?: string;
};

export type VuetifyConfig = {
  components?: Record<string, any>;
  directives?: Record<string, any>;
  defaults: DefaultsOptions;
  theme: string;
  rtl: boolean;
};
