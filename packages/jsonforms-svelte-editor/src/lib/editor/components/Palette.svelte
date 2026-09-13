<script lang="ts">
  import { useEditorI18n } from "../i18n/context.js";
  const i18n = useEditorI18n();
  import Input from "@jsonforms-svelte-shadcn-ui/input/input.svelte";
  import { elementLabel, elementIcon } from "../registrations/element-presentation.js";
  let query = $state("");
  import DragZone from "../dnd/DragZone.svelte";
  import { componentSections } from "../registrations/control-definitions.js";
  import type { EditorSession } from "../document/history-store.svelte.js";
  import type { DragItem } from "../dnd/payloads.js";
  let { session }: { session: EditorSession } = $props();
  const sections = $derived(
    componentSections.map((section) => ({
      ...section,
      items: section.presets.filter(preset => i18n.t(elementLabel(preset)).toLocaleLowerCase().includes(query.toLocaleLowerCase().trim())).map(
        (preset) =>
          ({
            id: `${session.dragType}:palette:${preset}`,
            label: preset,
            payload: { kind: "palette-item", preset },
          }) as DragItem,
      ),
    })),
  );
  const categories = $derived<DragItem[]>([
    {
      id: `${session.dragType}:palette:Category`,
      label: "Category",
      payload: { kind: "palette-item", preset: "Category" },
    },
  ]);
</script>

<aside aria-label="Components" class:palette-locked={session.locked}>
  <div class="panel-heading"><h2>{i18n.t("Components")}</h2></div>
  <Input type="search" aria-label={i18n.t("Search components")} placeholder={i18n.t("Search components")} bind:value={query} />
  <p class="muted">{i18n.t("Drag a component onto the form.")}</p>
  {#each sections.filter(section => section.items.length) as section}<section class="component-section">
      <h3>{i18n.t(section.title)}</h3>
      <DragZone
        {session}
        sourceItems={section.items}
        label="Component palette"
        >{#snippet children(item)}{@const Icon = elementIcon(item.label)}<div role="group" aria-disabled={session.locked} class="palette-row palette-button" title={i18n.t(elementLabel(item.label))}>
            <Icon size={16} aria-hidden="true" /><span>{i18n.t(elementLabel(item.label))}</span>
          </div>{/snippet}</DragZone
      >
    </section>{/each}<DragZone
    {session}
    sourceItems={categories.filter(item => i18n.t(elementLabel(item.label)).toLocaleLowerCase().includes(query.toLocaleLowerCase().trim()))}
    group="categories"
    label="Category palette"
    >{#snippet children(item)}{@const Icon = elementIcon(item.label)}<div role="group" aria-disabled={session.locked} class="palette-row palette-button">
        <Icon size={16} aria-hidden="true" /><span>{i18n.t(elementLabel(item.label))}</span>
      </div>{/snippet}</DragZone
  >
</aside>
