import * as vscode from 'vscode';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { FormProvider } from '../src/extension.js';
const token = new vscode.CancellationTokenSource().token;
async function until(predicate: () => boolean, label: string) {
  const start = Date.now();
  while (!predicate()) { if (Date.now() - start > 60000) throw new Error(`Timed out: ${label}`); await new Promise(resolve => setTimeout(resolve, 100)); }
}
export async function run() {
  const folder = await mkdtemp(join(tmpdir(), 'jsonforms-vscode-integration-'));
  try {
    const extension = vscode.extensions.getExtension<{ provider: FormProvider }>('kchobantonov.jsonforms-svelte-editor-vscode')!;
    assert.ok(extension, 'extension is registered');
    const { provider } = await extension.activate();
    // Compare the raw files without constructing a form designer for either side.
    for (const suffix of ['form.json', 'form-project.json']) {
      const left = vscode.Uri.file(join(folder, `before.${suffix}`));
      const right = vscode.Uri.file(join(folder, `after.${suffix}`));
      await writeFile(left.fsPath, '{"before": true}');
      await writeFile(right.fsPath, '{"after": true}');
      await vscode.commands.executeCommand('vscode.diff', left, right);
      await until(() => vscode.window.tabGroups.activeTabGroup.activeTab?.input instanceof vscode.TabInputTextDiff, `JSON diff for ${suffix}`);
      assert.equal(provider.documents.size, 0, 'diff does not open designer documents');
      await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    }
    console.log('Passed JSON text diffs for bundled forms and form projects.');
    const filename = join(folder, 'person.form.json');
    const original = { schema: { type: 'object', properties: { name: { type: 'string' } } }, data: { name: 'Ada' } };
    await writeFile(filename, JSON.stringify(original));
    const resource = vscode.Uri.file(filename);
    await vscode.commands.executeCommand('vscode.openWith', resource, 'jsonformsSvelteEditor.designer');
    await until(() => !!provider.documents.get(resource.toString())?.ready, 'bundled webview ready');
    const document = provider.documents.get(resource.toString())!;
    const next = { ...original, data: { name: 'Grace' } };
    provider.applyEdit(document, next);
    await until(() => !!vscode.window.tabGroups.activeTabGroup.activeTab?.isDirty, 'VS Code dirty flag');
    await vscode.commands.executeCommand('undo');
    await until(() => JSON.stringify(document.value) === JSON.stringify(original), 'native Undo');
    await vscode.commands.executeCommand('redo');
    await until(() => JSON.stringify(document.value) === JSON.stringify(next), 'native Redo');
    await vscode.commands.executeCommand('workbench.action.files.save');
    assert.deepEqual(JSON.parse(await readFile(filename, 'utf8')), next);
    const backup = await provider.backupCustomDocument(document, { destination: vscode.Uri.file(join(folder, 'backup')) }, token);
    assert.equal(JSON.parse(await readFile(vscode.Uri.parse(backup.id).fsPath, 'utf8')).value.data.name, 'Grace');
    await backup.delete();
    assert.deepEqual(document.errors, [], 'bundled webview has no runtime errors');
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    await until(() => !provider.documents.has(resource.toString()), 'bundled close');
    const manifest = join(folder, 'person.form-project.json');
    await writeFile(manifest, JSON.stringify({ version: 1, files: { schema: 'person.schema.json', uischema: 'person.uischema.json', data: 'values.json' } }));
    await writeFile(join(folder, 'person.schema.json'), JSON.stringify(original.schema));
    await writeFile(join(folder, 'person.uischema.json'), JSON.stringify({ type: 'Control', scope: '#/properties/name' }));
    await writeFile(join(folder, 'values.json'), JSON.stringify(original.data));
    const splitUri = vscode.Uri.file(manifest);
    await vscode.commands.executeCommand('vscode.openWith', splitUri, 'jsonformsSvelteEditor.designer');
    await until(() => !!provider.documents.get(splitUri.toString())?.ready, 'split webview ready');
    const split = provider.documents.get(splitUri.toString())!;
    provider.applyEdit(split, { schema: original.schema, data: { name: 'Lin' } });
    await vscode.commands.executeCommand('workbench.action.files.save');
    assert.deepEqual(JSON.parse(await readFile(join(folder, 'values.json'), 'utf8')), { name: 'Lin' });
    await assert.rejects(readFile(join(folder, 'person.uischema.json')));
    await vscode.commands.executeCommand('undo');
    await until(() => !!split.value.uischema, 'undo UI schema deletion');
    await vscode.commands.executeCommand('workbench.action.files.save');
    assert.equal(JSON.parse(await readFile(join(folder, 'person.uischema.json'), 'utf8')).type, 'Control');
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    assert.deepEqual(split.errors, [], 'split webview has no runtime errors');
    console.log('Passed VS Code integration: webcomponent load, dirty state, native Undo/Redo/Save, backup, split-file saves and UI schema deletion/restoration.');
  } finally {
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    await rm(folder, { recursive: true, force: true });
  }
}
