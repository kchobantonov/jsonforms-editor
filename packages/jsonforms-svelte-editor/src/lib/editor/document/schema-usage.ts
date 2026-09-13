import { object, type Node } from "./commands/index.js";
import type { SchemaTreeNode } from "./schema-tree.js";
export interface SchemaOccurrence {
  path: number[];
  label: string;
  scope: string;
}
/** Only the active UI schema's actual controls count as placed fields. */
export function schemaOccurrences(root: Node | undefined): SchemaOccurrence[] {
  const result: SchemaOccurrence[] = [];
  function visit(node: Node, path: number[], trail: string[]) {
    const label = `${String(node.label || node.type)}${path.length ? ` [${path.at(-1)! + 1}]` : ""}`;
    const next = [...trail, label];
    if (node.type === "Control" && typeof node.scope === "string")
      result.push({ path, label: next.join(" / "), scope: node.scope });
    node.elements?.forEach((child, index) =>
      visit(child, [...path, index], next),
    );
  }
  if (root) visit(root, [], []);
  return result;
}
/** Include fields rendered implicitly by object controls, without inventing placements. */
export function usedSchemaScopes(root: SchemaTreeNode, layout: Node | undefined): Set<string> {
  const nodes = new Map<string, SchemaTreeNode>();
  function index(node: SchemaTreeNode) {
    nodes.set(node.pointer, node);
    node.children.forEach(index);
  }
  index(root);
  const used = new Set<string>();
  const active = new Set<string>();
  function control(scope: string, ui: Node) {
    const schema = nodes.get(scope);
    if (!schema) return;
    used.add(scope);
    if (!schema.type.split(" | ").includes("object") || active.has(scope)) return;
    active.add(scope);
    const detail = object(object(ui.options).detail);
    if (typeof detail.type === "string") {
      visit(detail as Node, scope);
    } else {
      for (const child of schema.children) {
        if (child.pointer.startsWith(`${scope}/properties/`))
          control(child.pointer, { type: "Control" });
      }
    }
    active.delete(scope);
  }
  function visit(ui: Node, base: string) {
    if (ui.type === "Control" && typeof ui.scope === "string" &&
        (ui.scope === "#" || ui.scope.startsWith("#/")))
      control(base + ui.scope.slice(1), ui);
    ui.elements?.forEach(child => visit(child, base));
  }
  if (layout) visit(layout, "#");
  return used;
}
/** Keep used ancestors as non-draggable context when they contain unused descendants. */
export function unusedSchemaTree(
  root: SchemaTreeNode,
  used: Set<string>,
): SchemaTreeNode | undefined {
  const children = root.children.flatMap((child) => {
    const filtered = unusedSchemaTree(child, used);
    return filtered ? [filtered] : [];
  });
  const available = root.bindable && !used.has(root.pointer);
  if (!available && !children.length) return undefined;
  return { ...root, bindable: available, children };
}
