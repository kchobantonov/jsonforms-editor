<script lang="ts">
  import Input from "@jsonforms-svelte-shadcn-ui/input/input.svelte";
  import { elementIcon } from "../../registrations/element-presentation.js";
  import { useEditorI18n } from "../../i18n/context.js";
  const i18n = useEditorI18n();
  let renaming = $state(false),
    name = $state(""),
    error = $state("");
  function startRename() {
    name = node.pointer
      .split("/")
      .at(-1)!
      .replace(/~1/g, "/")
      .replace(/~0/g, "~");
    error = "";
    renaming = true;
  }
  function saveName() {
    try {
      session.editSchema({ action: "rename", pointer: node.pointer, name });
      renaming = false;
    } catch (reason) {
      error = i18n.t(reason instanceof Error ? reason.message : String(reason));
    }
  }
  let labelButton = $state<HTMLButtonElement | null>(null);
  $effect(() => {
    if (node.bindable && labelButton) {
      const action = dragHandle(labelButton);
      return () => action.destroy();
    }
  });
  let nameInput = $state<HTMLInputElement | null>(null);
  $effect(() => {
    if (renaming && nameInput) {
      nameInput.focus();
      nameInput.select();
    }
  });

  import SchemaActions from "./SchemaActions.svelte";
  import { dragHandle } from "svelte-dnd-action";
  import Button from "@jsonforms-svelte-shadcn-ui/button/button.svelte";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import SchemaBranch from "./SchemaBranch.svelte";
  import DragZone from "../../dnd/DragZone.svelte";
  import type { SchemaTreeNode } from "../../document/schema-tree.js";
  import type { EditorSession } from "../../document/history-store.svelte.js";
  import type { SchemaTreeState } from "./tree-state.svelte.js";
  import type { DragItem } from "../../dnd/payloads.js";
  let {
    node,
    session,
    tree,
    level = 1,
    parent,
  }: {
    node: SchemaTreeNode;
    session: EditorSession;
    tree: SchemaTreeState;
    level?: number;
    parent?: string;
  } = $props();
  const Icon = $derived(elementIcon(node.type));
  const expanded = $derived(tree.isExpanded(node.pointer));
  const childItems = $derived<DragItem[]>(
    node.children.map((child) => ({
      id: `${session.dragType}:field:${child.pointer}`,
      label: child.label,
      payload: { kind: "schema-property", pointer: child.pointer },
      schemaNode: child,
    })),
  );
  function keyboard(event: KeyboardEvent) {
    if (event.target !== event.currentTarget) return;
    if (
      [
        "ArrowDown",
        "ArrowUp",
        "ArrowLeft",
        "ArrowRight",
        "Home",
        "End",
      ].includes(event.key)
    ) {
      event.preventDefault();
      event.stopPropagation();
      tree.navigate(node, event.key, parent);
    }
    if (event.key === "Enter") {
      event.preventDefault();
      session.selectSchema(node.pointer);
    }
  }
</script>

<div
  role="treeitem"
  aria-label={node.label}
  aria-selected={(session.schemaSelection ?? session.node.scope) ===
    node.pointer}
  aria-level={level}
  aria-expanded={node.children.length ? expanded : undefined}
  tabindex={tree.focused === node.pointer ? 0 : -1}
  use:tree.register={node.pointer}
  onfocus={(event) => {
    if (event.target === event.currentTarget) tree.focusedOn(node.pointer);
  }}
  onkeydown={keyboard}
  data-schema-pointer={node.pointer}
>
  <div class="schema-tree-row">
    {#if node.children.length}<Button
        variant="ghost"
        size="icon"
        tabindex={-1}
        aria-label={`${expanded ? "Collapse" : "Expand"} ${node.label}`}
        onclick={() => tree.toggle(node)}
        ><ChevronRight
          size={14}
          class={expanded ? "tree-expanded" : ""}
        /></Button
      >{:else}<span class="tree-toggle-spacer"></span>{/if}
    {#if renaming}
      <form
        class="schema-rename"
        onsubmit={(event) => {
          event.preventDefault();
          saveName();
        }}
      >
        <Input
          class="schema-rename-input"
          bind:ref={nameInput}
          aria-label={i18n.t("Name")}
          bind:value={name}
          disabled={session.locked}
          onkeydown={(event) => {
            event.stopPropagation();
            if (event.key === "Escape") {
              event.preventDefault();
              renaming = false;
            }
          }}
        />
        <Button type="submit" variant="ghost" disabled={session.locked}
          >{i18n.t("Save")}</Button
        >
        {#if error}<p role="alert">{error}</p>{/if}
      </form>
    {:else}
      <div class="schema-field-drag">
        <Button
          variant="ghost"
          tabindex={-1}
          class="schema-tree-label"
          bind:ref={labelButton}
          title={node.description || node.pointer}
          aria-label={node.label}
          onclick={() => session.selectSchema(node.pointer)}
          ><span class="schema-drag-surface"><Icon size={16} aria-hidden="true" /><span>{node.label}</span
          >{#if node.required}<span
              class="schema-required"
              aria-label={i18n.t("Required")}>*</span
            >{/if}<span class="schema-type" aria-hidden="true">{node.type}</span
          ></span></Button
        >
      </div>
    {/if}
    <SchemaActions {node} {session} onrename={startRename} />
  </div>
  {#if expanded && childItems.length}<div
      role="group"
      class="schema-tree-children"
    >
      <DragZone
        {session}
        sourceItems={childItems}
        label={`${node.label} fields`}
        autoAriaDisabled
        handles
        >{#snippet children(item)}{#if item.schemaNode}<SchemaBranch
              node={item.schemaNode}
              {session}
              {tree}
              level={level + 1}
              parent={node.pointer}
            />{/if}{/snippet}</DragZone
      >
    </div>{/if}
</div>
