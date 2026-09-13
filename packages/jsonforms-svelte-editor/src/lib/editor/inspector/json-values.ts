import { createAjv } from "@jsonforms/core";
import { jsonSchemaFields } from "./advanced.js";
const ajv = createAjv({ strict: false });
/** Validate keyword shape without resolving external references or changing instance data. */
export function parseSchemaValue(key: string, text: string): unknown {
  const value = JSON.parse(text);
  const keyword = jsonSchemaFields[key];
  if (!keyword) throw new Error("Unknown schema property.");
  if (!ajv.validateSchema({ [keyword]: value }))
    throw new Error("Enter a valid value for this schema property.");
  const schema = (v: unknown) =>
    typeof v === "boolean" ||
    (!!v && typeof v === "object" && !Array.isArray(v));
  if (
    ["unevaluatedProperties", "unevaluatedItems", "contentSchema"].includes(
      keyword,
    ) &&
    !schema(value)
  )
    throw new Error("Enter a schema object or boolean.");
  if (
    ["$defs", "dependentSchemas"].includes(keyword) &&
    (!value ||
      typeof value !== "object" ||
      Array.isArray(value) ||
      !Object.values(value).every(schema))
  )
    throw new Error("Enter an object containing schemas.");
  if (
    keyword === "prefixItems" &&
    (!Array.isArray(value) || !value.every(schema))
  )
    throw new Error("Enter an array of schemas.");
  if (
    ["minContains", "maxContains"].includes(keyword) &&
    (!Number.isInteger(value) || value < 0)
  )
    throw new Error("Enter a non-negative integer.");
  if (
    keyword === "dependentRequired" &&
    (!value ||
      typeof value !== "object" ||
      Array.isArray(value) ||
      !Object.values(value).every(
        (v) =>
          Array.isArray(v) &&
          v.every((item) => typeof item === "string") &&
          new Set(v).size === v.length,
      ))
  )
    throw new Error(
      "Enter an object containing arrays of unique property names.",
    );
  return value;
}
