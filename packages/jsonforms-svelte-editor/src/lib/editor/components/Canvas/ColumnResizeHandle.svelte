<script lang="ts">
  import Button from "@jsonforms-svelte-shadcn-ui/button/button.svelte";
  import { onDestroy } from "svelte";
  import { useEditorI18n } from "../../i18n/context.js";
  import { pathFor } from "../../dnd/drop-handler.js";
  import type { EditorSession } from "../../document/history-store.svelte.js";
  let {
    session,
    elementId,
    label,
    columns,
    rowItems,
    onpreview,
  }: {
    session: EditorSession;
    elementId: string;
    label: string;
    columns: number;
    rowItems: number;
    onpreview: (columns: number | undefined) => void;
  } = $props();
  const i18n = useEditorI18n();
  let gesture:
    | {
        pointer: number;
        x: number;
        columns: number;
        unit: number;
        direction: number;
        revision: number;
        button: HTMLElement;
      }
    | undefined = $state.raw();
  let draft = $state<number | undefined>();
  const clamp = (value: number) => Math.max(2, Math.min(16, Math.round(value)));
  function finish(commit = false) {
    const current = gesture;
    if (!current) return;
    gesture = undefined;
    const value = draft;
    draft = undefined;
    onpreview(undefined);
    if (current.button.hasPointerCapture(current.pointer))
      current.button.releasePointerCapture(current.pointer);
    if (
      commit &&
      value !== undefined &&
      !session.locked &&
      session.revision === current.revision
    )
      session.resizeElement(elementId, value);
  }
  function start(event: PointerEvent) {
    event.stopPropagation();
    if (event.button !== 0 || session.locked || session.dragging || gesture)
      return;
    event.preventDefault();
    const button = event.currentTarget as HTMLElement;
    const zone = button.parentElement?.parentElement;
    if (!zone) return;
    const style = getComputedStyle(zone);
    const gap = parseFloat(style.columnGap) || 0;
    const width =
      zone.clientWidth -
      (parseFloat(style.paddingLeft) || 0) -
      (parseFloat(style.paddingRight) || 0);
    const path = pathFor(session.layout, elementId);
    if (!path) return;
    session.select(path);
    button.focus();
    gesture = {
      pointer: event.pointerId,
      x: event.clientX,
      columns,
      unit: Math.max(1, width - gap * (rowItems - 1)) / 16,
      direction: style.direction === "rtl" ? -1 : 1,
      revision: session.revision,
      button,
    };
    button.setPointerCapture(event.pointerId);
  }
  function move(event: PointerEvent) {
    if (!gesture || gesture.pointer !== event.pointerId) return;
    event.stopPropagation();
    const delta = (event.clientX - gesture.x) * gesture.direction;
    const value =
      Math.abs(delta) < 3
        ? undefined
        : clamp(gesture.columns + delta / gesture.unit);
    draft = value === clamp(gesture.columns) ? undefined : value;
    onpreview(draft);
  }
  function keyboard(event: KeyboardEvent) {
    event.stopPropagation();
    if (event.key === "Escape") {
      event.preventDefault();
      finish();
      return;
    }
    if (
      !["ArrowLeft", "ArrowRight", "Home", "End", " ", "Enter"].includes(
        event.key,
      )
    )
      return;
    event.preventDefault();
    if (
      gesture ||
      session.locked ||
      session.dragging ||
      [" ", "Enter"].includes(event.key)
    )
      return;
    const rtl =
      getComputedStyle(event.currentTarget as HTMLElement).direction === "rtl";
    const step = (event.key === "ArrowRight" ? 1 : -1) * (rtl ? -1 : 1);
    session.resizeElement(
      elementId,
      event.key === "Home"
        ? 2
        : event.key === "End"
          ? 16
          : clamp(columns + step),
    );
  }
  $effect(() => {
    if (
      gesture &&
      (session.locked ||
        session.dragging ||
        session.revision !== gesture.revision)
    )
      finish();
  });
  onDestroy(() => finish());
</script>

<svelte:window
  onkeydown={(event) => {
    if (gesture && event.key === "Escape") {
      event.preventDefault();
      finish();
    }
  }}
  onblur={() => finish()}
/>
<Button
  variant="ghost"
  class="column-resize-handle"
  role="slider"
  aria-label={`${i18n.t("Resize width")}: ${label}`}
  aria-orientation="horizontal"
  aria-valuemin={2}
  aria-valuemax={16}
  aria-valuenow={draft ?? clamp(columns)}
  aria-valuetext={`${draft ?? clamp(columns)} / 16 ${i18n.t("Columns")}`}
  title={i18n.t(
    "Drag to resize. Use arrow keys to adjust columns; Escape cancels.",
  )}
  disabled={session.locked || !!session.dragging}
  onpointerdown={start}
  onpointermove={move}
  onpointerup={(event) => {
    if (gesture?.pointer === event.pointerId) {
      event.stopPropagation();
      finish(true);
    }
  }}
  onpointercancel={() => finish()}
  onlostpointercapture={() => finish()}
  onmousedown={(event) => event.stopPropagation()}
  ontouchstart={(event) => event.stopPropagation()}
  onclick={(event) => event.stopPropagation()}
  onkeydown={keyboard}
>
  <span class="column-resize-grip" aria-hidden="true"></span>
  {#if gesture}<span class="column-resize-value" aria-hidden="true"
      >{draft ?? clamp(columns)} / 16</span
    >{/if}
</Button>
