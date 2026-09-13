import * as vscode from 'vscode';
import { randomBytes } from 'node:crypto';
import { posix } from 'node:path';
import { inferPart, loadProject, model, parts, record, relativePath, saveProject, serialize, type FileStore, type Manifest, type Model, type Part, type Project } from './project.js';

const viewType = 'jsonformsSvelteEditor.designer';
const encoder = new TextEncoder();
const decoder = new TextDecoder();
function uri(value: string) { return vscode.Uri.parse(value); }
function directory(value: vscode.Uri) { return value.with({ path: posix.dirname(value.path), query: '', fragment: '' }); }
function cancelled(token: vscode.CancellationToken) { if (token.isCancellationRequested) throw new vscode.CancellationError(); }
const store: FileStore = {
  async read(value) {
    try { return decoder.decode(await vscode.workspace.fs.readFile(uri(value))); }
    catch (error) { if (error instanceof vscode.FileSystemError && error.code === 'FileNotFound') return undefined; throw error; }
  },
  async write(value, text) { await vscode.workspace.fs.writeFile(uri(value), encoder.encode(text)); },
  async delete(value) { await vscode.workspace.fs.delete(uri(value)); },
  resolve(base, relative) { return vscode.Uri.joinPath(directory(uri(base)), relative).toString(); },
};
function checkTextEditors(project: Project) {
  const associated = new Set(Object.keys(project.originals));
  for (const text of vscode.workspace.textDocuments) {
    if (associated.has(text.uri.toString()) && text.isDirty) throw new Error(`Save or revert the text editor for ${text.uri.path} before editing or saving this form.`);
  }
}
export class FormDocument implements vscode.CustomDocument {
  readonly panels = new Set<vscode.WebviewPanel>();
  readonly draftPanels = new Set<vscode.WebviewPanel>();
  generation = 0;
  value: Model;
  ready = false;
  readonly errors: string[] = [];
  saving = false;
  constructor(public readonly uri: vscode.Uri, public project: Project) { this.value = structuredClone(project.model); }
  dispose() { this.panels.clear(); this.draftPanels.clear(); }
}
export class FormProvider implements vscode.CustomEditorProvider<FormDocument>, vscode.Disposable {
  private readonly changes = new vscode.EventEmitter<vscode.CustomDocumentEditEvent<FormDocument> | vscode.CustomDocumentContentChangeEvent<FormDocument>>();
  readonly onDidChangeCustomDocument = this.changes.event;
  readonly documents = new Map<string, FormDocument>();
  private readonly disposables: vscode.Disposable[] = [];
  constructor(private readonly context: vscode.ExtensionContext) {
    this.disposables.push(vscode.workspace.onDidChangeConfiguration(event => {
      if (event.affectsConfiguration('jsonformsSvelteEditor')) for (const document of this.documents.values()) this.settings(document);
    }));
  }
  dispose() { this.changes.dispose(); this.disposables.forEach(item => item.dispose()); }
  active() { return [...this.documents.values()].find(document => [...document.panels].some(panel => panel.active)); }
  private options(document: FormDocument) {
    const config = vscode.workspace.getConfiguration('jsonformsSvelteEditor', document.uri);
    return { defaultConfig: config.get<Model>('defaultConfig', {}), editorLocale: config.get('editorLanguage', 'en'), formLocale: config.get('formLanguage', 'en') };
  }
  private settings(document: FormDocument) { for (const panel of document.panels) void panel.webview.postMessage({ type: 'settings', ...this.options(document) }); }
  private send(document: FormDocument, panel?: vscode.WebviewPanel) {
    for (const target of panel ? [panel] : document.panels) void target.webview.postMessage({ type: 'model', model: document.value, generation: document.generation, ...this.options(document) });
  }
  async openCustomDocument(resource: vscode.Uri, context: vscode.CustomDocumentOpenContext, token: vscode.CancellationToken): Promise<FormDocument> {
    cancelled(token);
    let project: Project;
    let value: Model | undefined;
    if (context.backupId) {
      const backupText = await store.read(context.backupId);
      if (!backupText) throw new Error('Form backup is missing.');
      const backup = JSON.parse(backupText);
      if (backup.version !== 1 || backup.project.uri !== resource.toString()) throw new Error('Invalid form backup.');
      project = backup.project;
      project.originals = Object.fromEntries(backup.originals.map(([name, text]: [string, string | null]) => [name, text ?? undefined]));
      value = model(backup.value);
    } else project = await loadProject(resource.toString(), store);
    cancelled(token);
    checkTextEditors(project);
    const associated = new Set(Object.keys(project.originals));
    for (const open of this.documents.values()) {
      if (Object.keys(open.project.originals).some(name => associated.has(name))) throw new Error('These files are already open in another form project. Close that designer first.');
    }
    const document = new FormDocument(resource, project);
    const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(directory(resource), '**/*.json'));
    let refresh = Promise.resolve();
    const changed = (file: vscode.Uri) => {
      if (document.saving || !Object.hasOwn(document.project.originals, file.toString())) return;
      refresh = refresh.then(async () => {
        if (document.saving || await store.read(file.toString()) === document.project.originals[file.toString()]) return;
        if (document.draftPanels.size || JSON.stringify(document.value) !== JSON.stringify(document.project.model)) {
          for (const panel of document.panels) void panel.webview.postMessage({ type: 'error', message: 'A source file changed outside the designer. Save is blocked to prevent overwriting it; Revert to reload the files.' });
          return;
        }
        const refreshed = await loadProject(resource.toString(), store);
        checkTextEditors(refreshed);
        document.project = refreshed; document.value = structuredClone(refreshed.model); document.generation++; this.send(document);
      }).catch(error => { for (const panel of document.panels) void panel.webview.postMessage({ type: 'error', message: String(error) }); });
    };
    watcher.onDidChange(changed); watcher.onDidCreate(changed); watcher.onDidDelete(changed);
    if (value) document.value = value;
    this.documents.set(resource.toString(), document);
    const dispose = document.dispose.bind(document);
    document.dispose = () => { watcher.dispose(); dispose(); this.documents.delete(resource.toString()); };
    return document;
  }
  async resolveCustomEditor(document: FormDocument, panel: vscode.WebviewPanel, token: vscode.CancellationToken) {
    cancelled(token);
    document.panels.add(panel);
    const root = vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview');
    panel.webview.options = { enableScripts: true, localResourceRoots: [root] };
    const nonce = randomBytes(18).toString('base64');
    const asset = (name: string) => panel.webview.asWebviewUri(vscode.Uri.joinPath(root, name)).toString();
    const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    // AJV's compiled validators require unsafe-eval; no remote scripts or form content become scripts.
    panel.webview.html = `<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}' ${panel.webview.cspSource} 'unsafe-eval'; style-src ${panel.webview.cspSource} 'unsafe-inline'; font-src ${panel.webview.cspSource} data:; img-src ${panel.webview.cspSource} data: https:; connect-src ${panel.webview.cspSource}; worker-src ${panel.webview.cspSource} blob:;"><link rel="stylesheet" href="${escape(asset('main.css'))}"></head><body><div id="message" role="status">Loading JSON Forms Svelte Editor…</div><div id="editor"></div><script nonce="${nonce}" type="module" src="${escape(asset('main.js'))}" data-editor-url="${escape(asset('editor/jsonforms-svelte-editor.js'))}"></script></body></html>`;
    const messages = panel.webview.onDidReceiveMessage(async (message: unknown) => {
      try {
        if (!record(message)) return;
        switch (message.type) {
          case 'ready': this.send(document, panel); break;
          case 'mounted': document.ready = true; break;
          case 'edit': {
            if (message.generation !== document.generation) { this.send(document, panel); return; }
            this.applyEdit(document, message.model, panel);
            break;
          }
          case 'draft': {
            if (message.dirty === true) {
              if (!document.draftPanels.has(panel)) { document.draftPanels.add(panel); this.changes.fire({ document }); }
            } else document.draftPanels.delete(panel);
            break;
          }
          case 'command': {
            const commands: Record<string, string> = { undo: 'undo', redo: 'redo', save: 'workbench.action.files.save' };
            if (typeof message.command === 'string' && commands[message.command]) await vscode.commands.executeCommand(commands[message.command]);
            break;
          }
          case 'error': if (typeof message.message === 'string') { document.errors.push(message.message); void vscode.window.showErrorMessage(`JSON Forms Svelte Editor: ${message.message}`); } break;
        }
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        if (record(message) && message.type === 'edit') { document.generation++; this.send(document, panel); }
        void panel.webview.postMessage({ type: 'error', message: detail });
        void vscode.window.showErrorMessage(detail);
      }
    });
    panel.onDidDispose(() => { messages.dispose(); document.panels.delete(panel); document.draftPanels.delete(panel); });
  }
  applyEdit(document: FormDocument, value: unknown, panel?: vscode.WebviewPanel) {
    const next = model(value);
    if (JSON.stringify(next) === JSON.stringify(document.value)) return;
    checkTextEditors(document.project);
    const before = structuredClone(document.value);
    document.value = next;
    const set = (value: Model) => {
      if (document.draftPanels.size) throw new Error('Apply or revert the source/rule draft before Undo or Redo.');
      document.value = structuredClone(value); document.generation++; this.send(document);
    };
    this.changes.fire({ document, label: 'Edit form', undo: () => set(before), redo: () => set(next) });
    for (const other of document.panels) if (other !== panel) this.send(document, other);
  }
  async saveCustomDocument(document: FormDocument, token: vscode.CancellationToken): Promise<void> {
    cancelled(token);
    if (document.draftPanels.size) throw new Error('Apply or revert the source/rule draft in the designer before saving.');
    if (document.saving) throw new Error('A save is already in progress.');
    checkTextEditors(document.project);
    document.saving = true;
    try { await saveProject(document.project, structuredClone(document.value), store); }
    finally { document.saving = false; }
  }
  async saveCustomDocumentAs(document: FormDocument, destination: vscode.Uri, token: vscode.CancellationToken) {
    cancelled(token);
    if (document.draftPanels.size) throw new Error('Apply or revert the draft before Save As.');
    if (!destination.path.endsWith('.form.json')) throw new Error('Save As exports a bundled model. Choose a filename ending in .form.json.');
    // VS Code obtains overwrite confirmation for the Save As destination.
    const open = vscode.workspace.textDocuments.find(item => item.uri.toString() === destination.toString());
    if (open?.isDirty) throw new Error('The destination has unsaved text edits.');
    await store.write(destination.toString(), serialize(document.value));
  }
  async revertCustomDocument(document: FormDocument, token: vscode.CancellationToken) {
    cancelled(token);
    const project = await loadProject(document.uri.toString(), store);
    checkTextEditors(project);
    document.project = project; document.value = structuredClone(project.model);
    document.draftPanels.clear(); document.generation++; this.send(document);
  }
  async backupCustomDocument(document: FormDocument, context: vscode.CustomDocumentBackupContext, token: vscode.CancellationToken): Promise<vscode.CustomDocumentBackup> {
    cancelled(token);
    if (document.draftPanels.size) throw new Error('Apply or revert the source/rule draft before closing or restarting VS Code.');
    const id = context.destination.toString();
    await store.write(id, JSON.stringify({ version: 1, project: document.project, originals: Object.entries(document.project.originals).map(([key, value]) => [key, value ?? null]), value: document.value }));
    return { id, delete: async () => { try { await store.delete(id); } catch { /* VS Code may have removed the backup already. */ } } };
  }
}

async function createProject(selected?: vscode.Uri[]) {
  const files = selected?.length ? selected : await vscode.window.showOpenDialog({ canSelectMany: true, filters: { JSON: ['json'] }, title: 'Choose the JSON files belonging to this form' });
  if (!files?.length) return;
  const assignments: Partial<Record<Part, vscode.Uri>> = {};
  for (const file of files) {
    let part = inferPart(file.path);
    if (!part || assignments[part]) {
      part = await vscode.window.showQuickPick(parts.filter(key => !assignments[key]), { title: `Use ${posix.basename(file.path)} as…` }) as Part | undefined;
      if (!part) return;
    }
    assignments[part] = file;
  }
  const first = files[0]!;
  const baseName = posix.basename(first.path).replace(/\.(schema|uischema|data|uischemas|config|translations)\.json$/i, '').replace(/\.json$/i, '');
  const destination = await vscode.window.showSaveDialog({ defaultUri: vscode.Uri.joinPath(directory(first), `${baseName}.form-project.json`), filters: { 'Form project': ['form-project.json'] }, title: 'Save the project manifest in a folder containing all selected files' });
  if (!destination) return;
  if (!destination.path.endsWith('.form-project.json')) throw new Error('Use the .form-project.json extension.');
  if (files.some(file => file.toString() === destination.toString())) throw new Error('The manifest must be separate from the selected source files.');
  const mapping: Partial<Record<Part, string>> = {};
  for (const [part, file] of Object.entries(assignments)) {
    if (file.scheme !== destination.scheme || file.authority !== destination.authority) throw new Error('All project files must use the same filesystem.');
    mapping[part as Part] = relativePath(posix.relative(directory(destination).path, file.path));
  }
  const manifest: Manifest = { version: 1, files: mapping };
  // Missing parts are explicitly mapped to conventional files; they are created only on Save.
  const prefix = posix.basename(destination.path, '.form-project.json');
  for (const part of parts) if (!mapping[part]) {
    const path = `${prefix}.${part}.json`;
    if (await store.read(store.resolve(destination.toString(), path)) !== undefined) continue;
    mapping[part] = path;
  }
  await store.write(destination.toString(), serialize(manifest));
  await vscode.commands.executeCommand('vscode.openWith', destination, viewType);
}
export function activate(context: vscode.ExtensionContext) {
  const provider = new FormProvider(context);
  const guarded = (handler: (...args: any[]) => Promise<unknown>) => async (...args: any[]) => {
    try { return await handler(...args); }
    catch (error) { void vscode.window.showErrorMessage(error instanceof Error ? error.message : String(error)); return undefined; }
  };
  context.subscriptions.push(provider, vscode.window.registerCustomEditorProvider(viewType, provider, { webviewOptions: { retainContextWhenHidden: true }, supportsMultipleEditorsPerDocument: false }));
  context.subscriptions.push(vscode.commands.registerCommand('jsonformsSvelteEditor.createProject', guarded(async (resource?: vscode.Uri, resources?: vscode.Uri[]) => createProject(resources?.length ? resources : resource ? [resource] : undefined))));
  context.subscriptions.push(vscode.commands.registerCommand('jsonformsSvelteEditor.open', guarded(async (resource?: vscode.Uri) => {
    const chosen = resource ?? vscode.window.activeTextEditor?.document.uri ?? (await vscode.window.showOpenDialog({ canSelectMany: false, filters: { JSON: ['json'] } }))?.[0];
    if (!chosen) return;
    if (/\.form(?:-project)?\.json$/.test(chosen.path)) return vscode.commands.executeCommand('vscode.openWith', chosen, viewType);
    const part = inferPart(chosen.path);
    if (!part) return createProject([chosen]);
    const prefix = chosen.path.slice(0, -`.${part}.json`.length);
    const manifest = chosen.with({ path: `${prefix}.form-project.json` });
    if (await store.read(manifest.toString()) !== undefined) return vscode.commands.executeCommand('vscode.openWith', manifest, viewType);
    const siblings: vscode.Uri[] = [];
    for (const key of parts) {
      const candidate = chosen.with({ path: `${prefix}.${key}.json` });
      if (await store.read(candidate.toString()) !== undefined) siblings.push(candidate);
    }
    return createProject(siblings);
  })));
  context.subscriptions.push(vscode.commands.registerCommand('jsonformsSvelteEditor.openSources', guarded(async () => {
    const document = provider.active();
    if (!document) return;
    if (document.draftPanels.size || JSON.stringify(document.value) !== JSON.stringify(document.project.model)) throw new Error('Save or revert the form before opening its source files.');
    for (const [name, content] of Object.entries(document.project.originals)) if (content !== undefined) await vscode.commands.executeCommand('vscode.openWith', uri(name), 'default', { viewColumn: vscode.ViewColumn.Beside, preview: false });
  })));
  context.subscriptions.push(vscode.commands.registerCommand('jsonformsSvelteEditor.newForm', guarded(async () => {
    const destination = await vscode.window.showSaveDialog({ filters: { 'Form model': ['form.json'] }, saveLabel: 'Create form' });
    if (!destination) return;
    if (!destination.path.endsWith('.form.json')) throw new Error('Use the .form.json extension.');
    await store.write(destination.toString(), serialize({ schema: { type: 'object', properties: {} } }));
    await vscode.commands.executeCommand('vscode.openWith', destination, viewType);
  })));
  return { provider };
}
