import {
  visibleSchemaNodes,
  type SchemaTreeNode,
} from "../../document/schema-tree.js";
/** Expansion/focus are presentation state and never enter the document or its history. */
export function createTreeState(root: () => SchemaTreeNode, searching: () => boolean = () => false) {
  let expanded = $state(new Set<string>(["#"]));
  let focused = $state("#");
  const visible = () => searching() ? flatten(root()) : visibleSchemaNodes(root(), expanded);
  const flatten = (node: SchemaTreeNode): SchemaTreeNode[] => [node, ...node.children.flatMap(flatten)];
  const elements = new Map<string, HTMLElement>();
  function focus(pointer: string) {
    focused = pointer;
    queueMicrotask(() => elements.get(pointer)?.focus());
  }
  $effect(() => {
    if (!visible().some(node => node.pointer === focused)) focused = root().pointer;
  });
  function toggle(node: SchemaTreeNode) {
    const next = new Set(expanded);
    if (next.has(node.pointer)) {
      next.delete(node.pointer);
      if (focused.startsWith(`${node.pointer}/`)) focus(node.pointer);
    } else next.add(node.pointer);
    expanded = next;
  }
  return {
    get focused() {
      return focused;
    },
    isExpanded(pointer: string) {
      return searching() || expanded.has(pointer);
    },
    toggle,
    register(element: HTMLElement, pointer: string) {
      elements.set(pointer, element);
      return {
        destroy() {
          if (elements.get(pointer) === element) elements.delete(pointer);
        },
      };
    },
    focusedOn(pointer: string) {
      focused = pointer;
    },
    navigate(node: SchemaTreeNode, key: string, parent?: string) {
      const nodes = visible(),
        index = nodes.findIndex((item) => item.pointer === node.pointer);
      if (key === "ArrowDown")
        focus(nodes[Math.min(index + 1, nodes.length - 1)].pointer);
      else if (key === "ArrowUp")
        focus(nodes[Math.max(0, index - 1)].pointer);
      else if (key === "Home") focus(nodes[0].pointer);
      else if (key === "End") focus(nodes.at(-1)!.pointer);
      else if (key === "ArrowRight" && node.children.length) {
        if (!expanded.has(node.pointer)) toggle(node);
        else focus(node.children[0].pointer);
      } else if (key === "ArrowLeft") {
        if (expanded.has(node.pointer) && node.children.length) toggle(node);
        else if (parent) focus(parent);
      }
    },
  };
}
export type SchemaTreeState = ReturnType<typeof createTreeState>;
