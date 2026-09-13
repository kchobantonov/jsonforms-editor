import { escapePointer, object } from "./commands/index.js";
export interface SchemaTreeNode {
  pointer: string;
  label: string;
  type: string;
  bindable: boolean;
  required?: boolean;
  description?: string;
  children: SchemaTreeNode[];
}
/** Walk schema structure, preserving container nodes rather than flattening their leaves. */
export function schemaTree(
  schema: unknown,
  pointer = "#",
  label = "(root)",
  bindable = true,
): SchemaTreeNode {
  const value = object(schema);
  const type =
    typeof schema === "boolean"
      ? schema
        ? "any"
        : "never"
      : Array.isArray(value.type)
        ? value.type.join(" | ")
        : String(
            value.type ??
              (value.properties
                ? "object"
                : value.items
                  ? "array"
                  : value.$ref
                    ? "reference"
                    : "any"),
          );
  const children: SchemaTreeNode[] = Object.entries(object(value.properties)).map(
    ([key, child]) =>
      ({ ...schemaTree(
        child,
        `${pointer}/properties/${escapePointer(key)}`,
        key,
        bindable,
      ), required: Array.isArray(value.required) && value.required.includes(key) }),
  );
  for (const keyword of ["$defs", "definitions"]) {
    for (const [name, definition] of Object.entries(object(value[keyword]))) {
      children.push(
        schemaTree(
          definition,
          `${pointer}/${keyword}/${escapePointer(name)}`,
          `${keyword}: ${name}`,
          false,
        ),
      );
    }
  }
  // Item fields need an array-detail editing context. Bind the whole array on this canvas.
  if (value.items !== undefined && !Array.isArray(value.items))
    children.push(schemaTree(value.items, `${pointer}/items`, "items", false));
  const tuple = Array.isArray(value.prefixItems)
    ? value.prefixItems
    : Array.isArray(value.items)
      ? value.items
      : [];
  const keyword = Array.isArray(value.prefixItems) ? "prefixItems" : "items";
  tuple.forEach((item, index) =>
    children.push(
      schemaTree(
        item,
        `${pointer}/${keyword}/${index}`,
        `${keyword}[${index}]`,
        false,
      ),
    ),
  );
  return { pointer, label, type, bindable, children, description: typeof value.description === "string" ? value.description : undefined };
}
export function visibleSchemaNodes(
  root: SchemaTreeNode,
  expanded: Set<string>,
): SchemaTreeNode[] {
  return [
    root,
    ...(expanded.has(root.pointer)
      ? root.children.flatMap((child) => visibleSchemaNodes(child, expanded))
      : []),
  ];
}

/** Keep matching descendants and their ancestors; matching containers retain their children. */
export function filterSchemaTree(root: SchemaTreeNode, query: string): SchemaTreeNode | undefined {
  const text = query.trim().toLocaleLowerCase();
  if (!text || `${root.label} ${root.description ?? ""} ${root.type}`.toLocaleLowerCase().includes(text)) return root;
  const children = root.children.flatMap(child => {
    const match = filterSchemaTree(child, text);
    return match ? [match] : [];
  });
  return children.length ? { ...root, children } : undefined;
}
