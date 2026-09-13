import { rankWith, type JsonFormsRendererRegistryEntry } from "@jsonforms/core";
import JsonValueRenderer from "../../components/Inspector/JsonValueRenderer.svelte";
import RuleEditorRenderer from "../../components/Inspector/RuleEditorRenderer.svelte";
import SchemaTypeRenderer from "../../components/Inspector/SchemaTypeRenderer.svelte";
export const inspectorRenderers: JsonFormsRendererRegistryEntry[] = [
  { tester: rankWith(100, ui => ui.type === "Control" && ui.options?.editorControl === "json-value"), renderer: JsonValueRenderer },
  {
    tester: rankWith(
      100,
      (uischema) =>
        uischema.type === "Control" &&
        uischema.options?.editorControl === "schema-type",
    ),
    renderer: SchemaTypeRenderer,
  },
  {
    tester: rankWith(
      100,
      (uischema) =>
        uischema.type === "Control" &&
        uischema.options?.editorControl === "rule",
    ),
    renderer: RuleEditorRenderer,
  },
];
