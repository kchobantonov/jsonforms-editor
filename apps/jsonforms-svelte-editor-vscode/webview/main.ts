interface Model { [key: string]: unknown }
interface EditorElement extends HTMLElement {
  initialForm: Model; documentId: string; defaultConfig: Model;
  editorMode: 'light' | 'dark'; editorLocale: string; formLocale: string;
}
declare function acquireVsCodeApi(): { postMessage(message: unknown): void };
const vscode = acquireVsCodeApi();
const host = document.querySelector<HTMLDivElement>('#editor')!;
const banner = document.querySelector<HTMLDivElement>('#message')!;
let editor: EditorElement | undefined;
let generation = -1;
let draft = false;
function mode(): 'light' | 'dark' {
  return document.body.classList.contains('vscode-dark') || document.body.classList.contains('vscode-high-contrast') ? 'dark' : 'light';
}
function notify(message = '') { banner.textContent = message; banner.hidden = !message; }
function settings(message: Model) {
  if (!editor) return;
  editor.defaultConfig = message.defaultConfig as Model ?? {};
  editor.editorLocale = String(message.editorLocale ?? 'en');
  editor.formLocale = String(message.formLocale ?? 'en');
  editor.editorMode = mode();
}
const overrides = `
.editor { --background: var(--vscode-editor-background) !important; --foreground: var(--vscode-editor-foreground) !important; --border: var(--vscode-panel-border, var(--vscode-input-border, #777)) !important; --muted: var(--vscode-sideBar-background, var(--vscode-editor-background)) !important; --subtle: var(--vscode-descriptionForeground) !important; --ring: var(--vscode-focusBorder) !important; border: 0; border-radius: 0; font-family: var(--vscode-font-family); }
.editor .resizable-workspace, .editor .json-workspace, .editor .full-preview-workspace { height: calc(100vh - 42px); min-height: 0; }
.editor .workspace-statusbar { min-height: 32px; }
`;
window.addEventListener('message', async event => {
  const message = event.data;
  if (!message || typeof message !== 'object') return;
  if (message.type === 'error') { notify(message.message); return; }
  if (message.type === 'settings') { settings(message); return; }
  if (message.type !== 'model') return;
  generation = message.generation;
  draft = false;
  // Recreate on host Undo/Redo/Revert; ordinary edits keep focus and local control state.
  editor = document.createElement('jsonforms-svelte-editor') as EditorElement;
  const instance = editor;
  instance.documentId = `vscode:${generation}`;
  instance.initialForm = message.model;
  settings(message);
  instance.addEventListener('document-change', event => {
    if (editor !== instance) return;
    vscode.postMessage({ type: 'edit', generation, model: (event as CustomEvent).detail.document });
  });
  instance.addEventListener('draft-change', event => {
    if (editor !== instance) return;
    draft = !!(event as CustomEvent).detail.dirty;
    vscode.postMessage({ type: 'draft', dirty: draft });
    notify(draft ? 'Apply or revert the source/rule draft before saving, undoing, or closing this form.' : '');
  });
  host.replaceChildren(instance);
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
  if (editor !== instance) return;
  if (instance.shadowRoot) {
    const style = document.createElement('style'); style.textContent = overrides;
    instance.shadowRoot.append(style);
  }
  notify();
  vscode.postMessage({ type: 'mounted' });
});
new MutationObserver(() => { if (editor) editor.editorMode = mode(); }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
window.addEventListener('keydown', event => {
  if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
  const key = event.key.toLowerCase();
  let command: string | undefined;
  if (key === 's') command = 'save';
  else if (!draft && key === 'z') command = event.shiftKey ? 'redo' : 'undo';
  else if (!draft && key === 'y') command = 'redo';
  if (command) { event.preventDefault(); event.stopImmediatePropagation(); vscode.postMessage({ type: 'command', command }); }
}, { capture: true });
window.addEventListener('error', event => vscode.postMessage({ type: 'error', message: event.message }));
window.addEventListener('unhandledrejection', event => vscode.postMessage({ type: 'error', message: String(event.reason) }));
const script = document.querySelector<HTMLScriptElement>('script[data-editor-url]')!;
try {
  // VS Code webviews only support workers loaded from blob/data URLs.
  const files = await (await fetch(new URL('./workers.json', import.meta.url))).json();
  const workerUrls = new Map<string, string>();
  for (const [kind, file] of Object.entries(files)) {
    const response = await fetch(new URL(String(file), import.meta.url));
    if (!response.ok) throw new Error(`Could not load ${kind} worker.`);
    workerUrls.set(kind, URL.createObjectURL(new Blob([await response.text()], { type: 'text/javascript' })));
  }
  (globalThis as typeof globalThis & { MonacoEnvironment: unknown }).MonacoEnvironment = {
    getWorker: (_: string, label: string) => new Worker(workerUrls.get(label === 'json' ? 'json' : 'editor')!, { type: 'module' }),
  };
  window.addEventListener('unload', () => { for (const url of workerUrls.values()) URL.revokeObjectURL(url); });
  await import(/* @vite-ignore */ script.dataset.editorUrl!);
  await customElements.whenDefined('jsonforms-svelte-editor');
  vscode.postMessage({ type: 'ready' });
} catch (error) { notify(`Could not load the form editor: ${String(error)}`); vscode.postMessage({ type: 'error', message: String(error) }); }
