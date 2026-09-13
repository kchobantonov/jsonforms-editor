<script lang="ts">
  import Input from "@jsonforms-svelte-shadcn-ui/input/input.svelte";
  import Checkbox from "@jsonforms-svelte-shadcn-ui/checkbox/checkbox.svelte";
  import Label from "@jsonforms-svelte-shadcn-ui/label/label.svelte";
  import { useEditorI18n } from "../i18n/context.js";
  import {
    usedSchemaScopes,
    unusedSchemaTree,
  } from "../document/schema-usage.js";
  const i18n = useEditorI18n();
  const filterId = $props.id();
  let unusedOnly = $state(false);
  let query = $state("");
  import DragZone from "../dnd/DragZone.svelte";
  import { schemaTree, filterSchemaTree } from "../document/schema-tree.js";
  import { createTreeState } from "./SchemaTree/tree-state.svelte.js";
  import SchemaActions from "./SchemaTree/SchemaActions.svelte";
  import SchemaBranch from "./SchemaTree/SchemaBranch.svelte";
  import type { EditorSession } from "../document/history-store.svelte.js";
  import type { DragItem } from "../dnd/payloads.js";
  let { session }: { session: EditorSession } = $props();
  const fullRoot = $derived(schemaTree(session.document.schema));
  const unusedRoot = $derived(
    unusedOnly
      ? unusedSchemaTree(
          fullRoot,
          usedSchemaScopes(fullRoot, session.layout),
        )
      : fullRoot,
  );
  const root = $derived(unusedRoot ? filterSchemaTree(unusedRoot, query) : undefined);
  const tree = createTreeState(() => root ?? { ...fullRoot, children: [] }, () => !!query.trim());
  const items = $derived<DragItem[]>(
    root
      ? [
          {
            id: `${session.dragType}:field:#`,
            label: root.label,
            payload: { kind: "schema-property", pointer: "#" },
            schemaNode: root,
          },
        ]
      : [],
  );
</script>

<aside aria-label="Schema tree">
  <div class="panel-heading">
    <h2>{i18n.t("Schema tree")}</h2>

  </div>
  <Input type="search" aria-label={i18n.t("Filter properties")} placeholder={i18n.t("Filter properties")} bind:value={query} />
    <div class="schema-filter">
      <Checkbox id={filterId} bind:checked={unusedOnly} /><Label for={filterId}
        >{i18n.t("Show unused fields only")}</Label
      >
    </div>
  <p class="muted">
    {i18n.t("Drag to add. Click to select a field or its existing control.")}
  </p>
  {#if !root}<SchemaActions node={fullRoot} {session} />
    <p class="muted">
      {i18n.t(query.trim() ? "No matching fields." : "All fields are already placed.")}
    </p>{/if}
  <div role="tree" aria-label="Schema">
    <DragZone
      {session}
      sourceItems={items}
      label="Schema fields"
      autoAriaDisabled
      handles
      >{#snippet children(item)}{#if item.schemaNode}<SchemaBranch
            node={item.schemaNode}
            {session}
            {tree}
          />{/if}{/snippet}</DragZone
    >
  </div>
</aside>
