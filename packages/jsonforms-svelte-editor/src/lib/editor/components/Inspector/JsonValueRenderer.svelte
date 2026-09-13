<script lang="ts">
  import { parseSchemaValue } from "../../inspector/json-values.js";
  import {
    useJsonFormsControl,
    type ControlProps,
  } from "@chobantonov/jsonforms-svelte";
  import * as Field from "@jsonforms-svelte-shadcn-ui/field/index.js";
  import Textarea from "@jsonforms-svelte-shadcn-ui/textarea/textarea.svelte";
  import Button from "@jsonforms-svelte-shadcn-ui/button/button.svelte";
  import { useEditorI18n } from "../../i18n/context.js";
  const props: ControlProps = $props();
  const binding = useJsonFormsControl(props);
  const i18n = useEditorI18n();
  const id = $props.id();
  let text = $state(""),
    error = $state("");
  $effect(() => {
    text = binding.control.data ?? "";
    error = "";
  });
  function apply() {
    try {
      if (text.trim()) parseSchemaValue(binding.control.path, text);
      binding.handleChange(
        binding.control.path,
        text.trim() ? text : undefined,
      );
      error = "";
    } catch (reason) {
      error = i18n.t(
        reason instanceof SyntaxError
          ? "Enter valid JSON."
          : reason instanceof Error
            ? reason.message
            : String(reason),
      );
    }
  }
</script>

{#if binding.control.visible}
  <Field.Field data-invalid={!!error}>
    <Field.Label for={id}>{binding.control.label}</Field.Label>
    <Textarea
      {id}
      aria-label={binding.control.label}
      bind:value={text}
      rows={3}
      disabled={!binding.control.enabled || binding.control.readonly}
      aria-invalid={!!error}
      aria-describedby={`${id}-help`}
    />
    <p id={`${id}-help`} class="muted">
      {binding.control.description}
      {i18n.t("Enter JSON. Leave empty to remove this property.")}
    </p>
    {#if error}<p role="alert">{error}</p>{/if}
    <Button
      variant="outline"
      disabled={!binding.control.enabled || binding.control.readonly}
      onclick={apply}>{i18n.t("Apply value")}</Button
    >
  </Field.Field>
{/if}
