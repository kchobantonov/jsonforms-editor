# JSON Forms Svelte Editor for VS Code

A VS Code custom editor using this workspace's Svelte editor webcomponent and Svelte shadcn preview renderer. Extension ID: `kchobantonov.jsonforms-svelte-editor-vscode`. Commands, settings, and the custom-editor view type use `jsonformsSvelteEditor`, leaving room for separate renderer integrations.

## Open a form

- Open `person.form.json` for a bundled form model. Empty or whitespace-only files open as blank forms; saving writes a valid JSON model. Optional properties include `schema`, `uischema`, `data`, `uischemas`, `config`, and `translations`. Additional model properties are preserved. Schema-only and data-only models use JSON Forms' generated preview.
- For `person.schema.json`, `person.uischema.json`, `person.data.json`, etc., right-click a part and select **JSON Forms Svelte Editor: Open in Designer**. The command discovers matching siblings and offers to save a `person.form-project.json` manifest. Reopening any sibling uses that manifest.
- For different filenames, select the files in Explorer and choose **Create Project from JSON Files…**. Known suffixes identify roles; otherwise a picker asks what each file contains. Save the manifest in a directory containing all selected files, including subdirectories.

The manifest makes associations persistent and reviewable rather than guessing from JSON contents. The designer automatically opens `.form.json` and `.form-project.json`; individual schema/data files retain their normal JSON editor unless you use the command. Use **Reopen Editor With → Text Editor** when you want the source.

```json
{
  "version": 1,
  "files": {
    "schema": "person.schema.json",
    "uischema": "layouts/person.json",
    "data": "samples/example.json",
    "config": "person.config.json"
  }
}
```

Paths are relative JSON paths within the manifest's directory. Duplicate mappings, absolute paths, parent-directory paths, and mapping the manifest itself are rejected. A missing mapped file means that part is undefined. Missing optional files are created only when their part is authored and saved. Removing a part deletes its mapped file on Save; Undo then Save recreates it. An empty UI schema object is not a substitute for an omitted UI schema.

The creation command maps other absent parts to conventional filenames, provided those filenames are unused. Parts not mapped in `files`, and additional model properties, live in an optional inline `model` object in the manifest. A part cannot be both inline and mapped. This also lets a project intentionally mix file-backed and inline model parts.

## Save, history, and source changes

VS Code owns the custom document's dirty state and Undo/Redo stack. Designer changes enter that stack, including root removal and edits to schema, UI schema, and form input data. Save / Save All writes the bundled model or every changed associated file. Keyboard shortcuts inside the webview forward to VS Code; Undo/Redo restores the editor from the corresponding model snapshot. Preview interaction alone is not a document edit; use Form Input to change saved sample data.

Save As exports a self-contained `.form.json` model. Revert reloads all source files. Applied model edits support VS Code backup/hot exit. The **Open Source Files** command opens the project's files beside the designer after edits have been saved or reverted.

Source and rule panels have their own Apply/Revert drafts. Apply these before Save, native Undo/Redo, closing, or restarting VS Code. Pending drafts mark the custom document dirty, and save/backup is rejected with an explanatory message; unapplied panel drafts are not serialized in backups. Do not force-quit with an unapplied draft.

Files modified externally are reloaded when the designer is clean. If the form also has edits, Save refuses to overwrite external changes: export your work with Save As, or Revert to reload. Save/revert dirty text editors before working on the same files through the designer. Projects sharing a source file cannot be opened in separate designer documents simultaneously.

Multi-file saving preflights all associated files, writes only changed parts, and attempts rollback if a write fails. Filesystems do not provide a transaction across multiple files: a crash during Save, or another program writing concurrently, can still leave a partial save. Keep projects under version control. Unchanged files preserve their original bytes; changed files retain indentation and line-ending style, but are reformatted as strict JSON (JSON comments are not supported).

## Theme and preview defaults

The editor follows VS Code's light/dark/high-contrast mode. Designer chrome inherits VS Code colors and font; the Svelte shadcn renderer and Monaco follow the light/dark mode. Renderer internals retain their own theme palette.

User or workspace settings:

```json
{
  "jsonformsSvelteEditor.defaultConfig": {
    "showUnfocusedDescription": true
  },
  "jsonformsSvelteEditor.editorLanguage": "en",
  "jsonformsSvelteEditor.formLanguage": "en"
}
```

Defaults are merged with a form's `config` at runtime; explicit form keys win. This is a shallow merge (an explicit nested object replaces the corresponding default object). Defaults apply without any config file and never become saved model properties. Config changes are applied to open designers.

The webview bundles all scripts, styles and workers; it does not fetch a renderer from a CDN. AJV requires `unsafe-eval` to compile validators. Remote scripts are blocked, webview filesystem access is restricted to packaged assets, and the extension requires a trusted workspace. Preview image URLs may use HTTPS. JavaScript-bearing model extensions remain subject to the editor's existing preview restrictions.

## Develop and package

From the repository root:

```sh
pnpm install
pnpm vscode:build
pnpm vscode:test
pnpm vscode:package
```

`pnpm vscode:test` uses an installed VS Code. On macOS the default is `/Applications/Visual Studio Code.app`; elsewhere it uses `code`. Override `VSCODE_EXECUTABLE` if needed. Linux CI should run the integration command under `xvfb-run -a` with VS Code installed. Tests use isolated user-data and extensions directories.

Press F5 with the **JSON Forms Svelte Editor Extension** launch configuration for an Extension Development Host. Open an example from `apps/jsonforms-svelte-editor-vscode/examples` in that window.

The installable artifact is `apps/jsonforms-svelte-editor-vscode/dist/jsonforms-svelte-editor-vscode.vsix`. Install via **Extensions: Install from VSIX…**. Nothing is published to the Marketplace by the build or packaging commands.

### Git comparisons

The extension contributes `workbench.diffEditorAssociations` defaults for `*.form.json` and `*.form-project.json` so comparisons use the JSON text diff editor while ordinary opens use the designer. An explicit user/workspace association takes precedence. If an existing association still opens the designer, set these entries in VS Code settings:

```json
"workbench.diffEditorAssociations": {
  "*.form.json": "default",
  "*.form-project.json": "default"
}
```

This setting requires a VS Code version supporting separate diff associations; on older versions use **Reopen Editor With → Text Editor** for comparisons.
