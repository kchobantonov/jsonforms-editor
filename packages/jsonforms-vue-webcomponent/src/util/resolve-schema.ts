import type { JsonSchema } from '@jsonforms/core';
import { reactive } from 'vue';
import * as JsonRefs from 'json-refs';
import _get from 'lodash/get';
import type { ResolvedSchema } from './types';

export const resolveSchema = async (schema?: JsonSchema) => {
  const resolvedSchema: ResolvedSchema = {
    schema: undefined,
    resolved: false,
    error: undefined,
  };

  resolvedSchema.schema = undefined;
  resolvedSchema.resolved = false;
  resolvedSchema.error = undefined;

  if (schema) {
    // have custom filter
    // if not using resolve ref  then the case
    //   { "$ref": "#/definitions/state" }
    //   "definitions": {
    //    "state": { "type": "string", "enum": ["CA", "NY", "FL"] }
    //   }
    // then state won't be renderer automatically - needs to have a specified control
    //
    // if using a resolve ref but then it points to definition with $id if we resolve those then we will get
    // Error: reference "{ref}" resolves to more than one schema
    const refFilter = (refDetails: any, _path: string): boolean => {
      if (refDetails.type === 'local') {
        let uri: string | undefined = refDetails?.uriDetails?.fragment;
        uri = uri ? uri.replace(/\//g, '.') : uri;
        if (uri?.startsWith('.')) {
          uri = uri.substring(1);
        }
        if (uri && (_get(schema, uri) as any)?.$id) {
          // do not resolve ref that points to def with $id
          return false;
        }
      }
      return true;
    };

    try {
      const resolveResult = await JsonRefs.resolveRefs(schema, {
        filter: refFilter,
      });

      resolvedSchema.schema = resolveResult.resolved;

      resolvedSchema.resolved = true;
    } catch (err) {
      resolvedSchema.resolved = true;
      resolvedSchema.error = err instanceof Error ? err.message : String(err);
    }
  } else {
    // nothing to resolve
    resolvedSchema.resolved = true;
  }

  return resolvedSchema;
};
