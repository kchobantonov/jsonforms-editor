import {
  clone,
  object,
  escapePointer,
  type Document,
} from "./commands/index.js";
import type { JsonValue } from "./types.js";
export type SchemaEdit = {
  action: "add" | "definition" | "rename" | "delete";
  pointer: string;
  name?: string;
  type?: string | string[];
  itemType?: string;
};
const parts = (pointer: string) =>
  pointer === "#"
    ? []
    : pointer
        .slice(2)
        .split("/")
        .map((p) => p.replace(/~1/g, "/").replace(/~0/g, "~"));
function get(root: unknown, path: string[]): any {
  return path.reduce<any>((value, key) => value?.[key], root);
}
const within = (value: string, pointer: string) =>
  value === pointer || value.startsWith(pointer + "/");
function visit(
  value: unknown,
  callback: (record: Record<string, any>) => void,
) {
  if (!value || typeof value !== "object") return;
  if (!Array.isArray(value)) callback(value as Record<string, any>);
  Object.values(value).forEach((child) => visit(child, callback));
}
function visitSchema(
  value: unknown,
  callback: (record: Record<string, any>, pointer: string) => void,
  pointer = "#",
) {
  const schema = object(value);
  callback(schema, pointer);
  for (const keyword of [
    "properties",
    "patternProperties",
    "$defs",
    "definitions",
    "dependentSchemas",
    "dependencies",
  ])
    Object.entries(object(schema[keyword])).forEach(([name, child]) => {
      if (!Array.isArray(child))
        visitSchema(
          child,
          callback,
          `${pointer}/${keyword}/${escapePointer(name)}`,
        );
    });
  for (const keyword of [
    "items",
    "prefixItems",
    "allOf",
    "anyOf",
    "oneOf",
    "not",
    "if",
    "then",
    "else",
    "contains",
    "additionalProperties",
    "additionalItems",
    "unevaluatedProperties",
    "unevaluatedItems",
    "propertyNames",
  ]) {
    const child = schema[keyword];
    if (Array.isArray(child))
      child.forEach((item, index) =>
        visitSchema(item, callback, `${pointer}/${keyword}/${index}`),
      );
    else if (child && typeof child === "object")
      visitSchema(child, callback, `${pointer}/${keyword}`);
  }
}
export function definitionPointers(schema: unknown): string[] {
  return ["$defs", "definitions"].flatMap((keyword) =>
    Object.keys(object(object(schema)[keyword])).map(
      (name) => `#/${keyword}/${escapePointer(name)}`,
    ),
  );
}
function newSchema(
  type: string | string[],
  schema: unknown,
  itemType = "object",
): JsonValue {
  if (Array.isArray(type)) {
    if (
      !type.length ||
      type.some(
        (entry) =>
          ![
            "string",
            "number",
            "integer",
            "boolean",
            "object",
            "array",
            "null",
          ].includes(entry),
      )
    )
      throw new Error("Choose a schema type.");
    const unique = [...new Set(type)];
    if (unique.length === 1) return newSchema(unique[0], schema, itemType);
    return {
      type: unique,
      ...(unique.includes("object") ? { properties: {} } : {}),
      ...(unique.includes("array")
        ? {
            items: newSchema(
              itemType === "array" ? "object" : itemType,
              schema,
            ),
          }
        : {}),
    };
  }
  if (type.startsWith("#/")) {
    if (!definitionPointers(schema).includes(type))
      throw new Error("Choose an existing definition.");
    return { $ref: type };
  }
  if (type === "object") return { type, properties: {} };
  if (type === "array")
    return {
      type,
      items: newSchema(itemType === "array" ? "object" : itemType, schema),
    };
  if (!["string", "number", "integer", "boolean", "null"].includes(type))
    throw new Error("Choose a schema type.");
  return { type };
}
/** Cascade local references before applying the deletion as one history entry. */
export function editSchema(document: Document, edit: SchemaEdit): Document {
  if (edit.action !== "delete") return editSchemaSingle(document, edit);
  const removed = new Set([edit.pointer]);
  let changed = true;
  while (changed) {
    changed = false;
    visitSchema(document.schema, (schema, pointer) => {
      if (
        typeof schema.$ref !== "string" ||
        ![...removed].some((target) => within(schema.$ref, target))
      )
        return;
      if ([...removed].some((target) => within(pointer, target))) return;
      const tokens = parts(pointer);
      let end = tokens.length - 2;
      while (
        end >= 0 &&
        !["properties", "$defs", "definitions"].includes(tokens[end])
      )
        end--;
      if (end < 0)
        throw new Error(
          "This reference has no owning field. Remove it in JSON Model first.",
        );
      const owner =
        "#/" +
        tokens
          .slice(0, end + 2)
          .map(escapePointer)
          .join("/");
      if (!removed.has(owner)) {
        removed.add(owner);
        changed = true;
      }
    });
  }
  const targets = [...removed].filter(
    (pointer) =>
      ![...removed].some(
        (other) => other !== pointer && within(pointer, other),
      ),
  );
  return targets.reduce(
    (next, pointer) => editSchemaSingle(next, { action: "delete", pointer }),
    document,
  );
}
function editSchemaSingle(document: Document, edit: SchemaEdit): Document {
  const next = clone(document);
  const path = parts(edit.pointer);
  const node = get(next.schema, path);
  if (node === undefined) throw new Error("The schema node no longer exists.");
  const name = edit.name?.trim() ?? "";
  if (edit.action !== "delete" && !name) throw new Error("Enter a name.");
  if (["__proto__", "constructor", "prototype"].includes(name))
    throw new Error("Choose a different name.");
  if (edit.action === "add" || edit.action === "definition") {
    if (!node || typeof node !== "object" || Array.isArray(node))
      throw new Error("Select an object schema.");
    const keyword =
      edit.action === "definition"
        ? String(object(next.schema).$schema ?? "").match(/2019-09|2020-12/)
          ? "$defs"
          : "definitions"
        : "properties";
    if (
      edit.action === "add" &&
      (node.$ref || !(node.type === "object" || node.properties))
    )
      throw new Error("Select an object schema.");
    if (edit.action === "definition" && path.length)
      throw new Error("Definitions belong to the root schema.");
    node[keyword] ??= {};
    if (Object.hasOwn(node[keyword], name))
      throw new Error("That name already exists.");
    node[keyword][name] = newSchema(
      edit.type ?? "string",
      next.schema,
      edit.itemType,
    );
    return next;
  }
  const keyword = path.at(-2);
  if (!["properties", "$defs", "definitions"].includes(keyword ?? ""))
    throw new Error(
      "Only properties and definitions can be renamed or deleted.",
    );
  const parent = get(next.schema, path.slice(0, -1));
  const owner = get(next.schema, path.slice(0, -2));
  const oldName = path.at(-1)!;
  const newPointer =
    edit.pointer.slice(0, edit.pointer.lastIndexOf("/") + 1) +
    escapePointer(name);
  if (edit.action === "rename" && name === oldName) return next;
  if (edit.action === "rename" && Object.hasOwn(parent, name))
    throw new Error("That name already exists.");
  visitSchema(next.schema, (schema) => {
    if (schema !== next.schema && (schema.$id || schema.id))
      throw new Error(
        "Use JSON Model to edit schemas with embedded resource identifiers.",
      );
  });
  const rewrite = (record: Record<string, any>) => {
    for (const key of ["$ref", "scope"]) {
      if (typeof record[key] !== "string" || !within(record[key], edit.pointer))
        continue;
      if (edit.action === "delete") continue;
      record[key] = newPointer + record[key].slice(edit.pointer.length);
    }
  };
  visitSchema(next.schema, rewrite);
  if (edit.action === "delete") {
    const scopes = new Set([edit.pointer]);
    const refs: { pointer: string; target: string }[] = [];
    visitSchema(document.schema, (schema, pointer) => {
      if (typeof schema.$ref === "string" && schema.$ref.startsWith("#/"))
        refs.push({ pointer, target: schema.$ref });
    });
    const expandAliases = (scope: string, used = new Set<string>()) => {
      for (const ref of refs) {
        if (used.has(ref.pointer) || !within(scope, ref.target)) continue;
        const alias = ref.pointer + scope.slice(ref.target.length);
        scopes.add(alias);
        expandAliases(alias, new Set([...used, ref.pointer]));
      }
    };
    expandAliases(edit.pointer);
    const removedScope = (scope: unknown) =>
      typeof scope === "string" &&
      [...scopes].some((pointer) => within(scope, pointer));
    const references = (value: any): boolean => {
      if (!value || typeof value !== "object") return false;
      if (removedScope(value.scope)) return true;
      let found = false;
      if (value.schema)
        visitSchema(value.schema, (schema) => {
          if (removedScope(schema.$ref)) found = true;
        });
      return (
        found ||
        references(value.condition) ||
        (Array.isArray(value.conditions) && value.conditions.some(references))
      );
    };
    const prune = (value: any): any => {
      if (!value || typeof value !== "object") return value;
      if (Array.isArray(value))
        return value.map(prune).filter((child) => child !== undefined);
      if (value.type === "Control" && removedScope(value.scope))
        return undefined;
      if (value.rule && references(value.rule)) delete value.rule;
      for (const key of [
        "elements",
        "uischema",
        "uischemas",
        "options",
        "detail",
      ]) {
        if (!(key in value)) continue;
        const child = prune(value[key]);
        if (child === undefined) delete value[key];
        else value[key] = child;
      }
      return value;
    };
    next.uischema = prune(next.uischema);
    next.uischemas = prune(next.uischemas)?.filter(
      (entry: any) => entry.uischema,
    );
    if (!next.uischema) delete next.uischema;
    if (!next.uischemas) delete next.uischemas;
  } else {
    visit(next.uischema, rewrite);
    visit(next.uischemas, rewrite);
  }
  if (keyword === "properties") {
    for (const key of [
      "dependentRequired",
      "dependentSchemas",
      "dependencies",
    ]) {
      const dependencies = owner[key];
      if (!dependencies || typeof dependencies !== "object") continue;
      if (Object.hasOwn(dependencies, oldName)) {
        if (edit.action === "rename")
          dependencies[name] = dependencies[oldName];
        delete dependencies[oldName];
      }
      for (const [dependency, values] of Object.entries(dependencies))
        if (Array.isArray(values))
          dependencies[dependency] = values.flatMap((value) =>
            value !== oldName
              ? [value]
              : edit.action === "rename"
                ? [name]
                : [],
          );
    }
  }
  if (edit.action === "rename") parent[name] = parent[oldName];
  delete parent[oldName];
  if (keyword === "properties" && Array.isArray(owner.required)) {
    owner.required = owner.required.flatMap((key: string) =>
      key !== oldName ? [key] : edit.action === "rename" ? [name] : [],
    );
    if (!owner.required.length) delete owner.required;
  }
  // Traverse actual sample instances, following local references to definitions.
  const visited = new WeakMap<object, Set<string>>();
  function updateData(schema: any, pointer: string, value: any) {
    if (
      !value ||
      typeof value !== "object" ||
      !schema ||
      typeof schema !== "object"
    )
      return;
    const seen = visited.get(value) ?? new Set<string>();
    if (seen.has(pointer)) return;
    seen.add(pointer);
    visited.set(value, seen);
    if (typeof schema.$ref === "string" && schema.$ref.startsWith("#/"))
      updateData(get(document.schema, parts(schema.$ref)), schema.$ref, value);
    for (const [key, child] of Object.entries(schema.properties ?? {}))
      updateData(
        child,
        `${pointer}/properties/${escapePointer(key)}`,
        value[key],
      );
    if (Array.isArray(value) && schema.items && !Array.isArray(schema.items))
      value.forEach((item) =>
        updateData(schema.items, `${pointer}/items`, item),
      );
    if (
      pointer ===
        edit.pointer.slice(0, edit.pointer.lastIndexOf("/properties/")) &&
      Object.hasOwn(value, oldName)
    ) {
      if (edit.action === "rename") {
        if (Object.hasOwn(value, name))
          throw new Error("Sample data already contains the new name.");
        value[name] = value[oldName];
      }
      delete value[oldName];
    }
  }
  if (keyword === "properties") updateData(document.schema, "#", next.data);
  return next;
}
