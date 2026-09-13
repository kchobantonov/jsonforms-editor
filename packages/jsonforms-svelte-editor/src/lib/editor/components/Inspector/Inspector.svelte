<script lang="ts">
  import { useEditorI18n } from "../../i18n/context.js";
  const i18n = useEditorI18n();
  import { inspectorRenderers } from "../../inspector/renderers/index.js";
  import { inspectorDefinition } from "../../inspector/definition.js";
  import { elementId } from "../../document/identity.js";
  import { setContext } from "svelte";
  import { JsonForms } from "@chobantonov/jsonforms-svelte";
  import {
    shadcnRenderers,
    shadcnCells,
    PortalTargetContextSymbol,
  } from "@chobantonov/jsonforms-svelte-shadcn";
  import {
    type Document,
    type Node,
  } from "../../document/commands/index.js";
  let {
    focusRevision = 0,
    locked = false,
    schemaOnly = false,
    document,
    node,
    onchange,
  }: {
    focusRevision?: number;
    locked?: boolean;
    schemaOnly?: boolean;
    document: Document;
    node: Node;
    onchange: (value: {
      label?: string;
      multi?: boolean;
      required?: boolean;
    }) => void;
  } = $props();
  let container: HTMLDivElement;
  setContext(PortalTargetContextSymbol, () => container);
  const form = $derived(inspectorDefinition(document, node, schemaOnly));
  const schema = $derived({
    ...form.schema,
    properties: Object.fromEntries(
      Object.entries(form.schema.properties).map(([key, value]) => [
        key,
        {
          ...value,
          ...(value.description ? { description: i18n.t(value.description) } : {}),
          ...(value.oneOf ? { oneOf: value.oneOf.map(choice => ({ ...choice, title: i18n.t(choice.title) })) } : {}),
          title: value.title
            .split(" · ")
            .map((part, index) => (index === 0 ? i18n.t(part) : part))
            .join(" · "),
        },
      ]),
    ),
  });
  const uischema = $derived({
    ...form.uischema,
    elements: form.uischema.elements.map((group) => ({
      ...group,
      label: i18n.t(group.label),
      elements: group.elements.map(control => ({ ...control, options: { ...control.options, showUnfocusedDescription: true } })),
      ...(locked && group.label !== "Rules" ? { rule: { effect: "DISABLE", condition: { scope: "#", schema: {} } } } : {}),
    })),
  });
</script>

<div bind:this={container}>
  {#if form.fields.length}{#key `${schemaOnly ? node.scope : elementId(node)}:${focusRevision}`}<JsonForms
        {schema}
        {uischema}
        data={form.data}
        renderers={[...inspectorRenderers, ...shadcnRenderers]}
        cells={shadcnCells}
        onchange={({ data, errors }) => {
          if (errors?.length) return;
          if (data && typeof data === "object" && !Array.isArray(data)) {
            const next = {
              ...Object.fromEntries(
                form.fields.map((field) => [field.key, undefined]),
              ),
              ...data,
            };
            if (JSON.stringify(next) !== JSON.stringify(form.data)) onchange(next);
          }
        }}
      />{/key}{/if}
</div>
