<script lang="ts">
  import type { EditorMessages } from "./editor/i18n/context.js";
  import EditorShell from "./editor/EditorShell.svelte";
  import styles from "./editor/styles/editor.css?inline";
  import type { InitialForm } from "./editor/document/types.js";
  let {
    initialForm = {},
    defaultConfig = {},
    editorLocale = "en",
    formLocale = "en",
    editorMessages = {},
    documentId = "Untitled form",
    editorMode = "system",
    onchange = () => {},
    ondraft = () => {},
    onhistory = () => {},
  }: {
    initialForm?: InitialForm;
    defaultConfig?: NonNullable<InitialForm["config"]>;
    editorLocale?: string;
    formLocale?: string;
    editorMessages?: EditorMessages;
    documentId?: string;
    editorMode?: "light" | "dark" | "system";
    onchange?: (document: InitialForm, revision: number) => void;
    ondraft?: (dirty: boolean) => void;
    onhistory?: (state: { canUndo: boolean; canRedo: boolean }) => void;
  } = $props();
  let shell = $state<EditorShell>();
  export function undo() {
    shell?.undo();
  }
  export function redo() {
    shell?.redo();
  }
</script>

<svelte:element this={"style"}>{styles}</svelte:element>
{#key documentId}<EditorShell
    bind:this={shell}
    {onhistory}
    {initialForm}
    {defaultConfig}
    {editorLocale}
    {formLocale}
    {editorMessages}
    {editorMode}
    {onchange}
    {ondraft}
  />{/key}
