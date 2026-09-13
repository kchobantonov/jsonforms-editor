import { build } from 'esbuild';
import { cp, mkdir, rm, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
process.chdir(fileURLToPath(new URL('./', import.meta.url)));
await mkdir('dist', { recursive: true });
await build({ entryPoints: ['src/extension.ts'], bundle: true, platform: 'node', target: 'node20', format: 'cjs', external: ['vscode'], outfile: 'dist/extension.cjs', sourcemap: true });
await rm('dist/webview', { recursive: true, force: true });
await mkdir('dist/webview', { recursive: true });
await cp('../../packages/jsonforms-svelte-editor-webcomponent/dist', 'dist/webview/editor', { recursive: true, filter: source => !source.endsWith('.map') });
const workerFiles = await readdir('dist/webview/editor/assets');
await writeFile('dist/webview/workers.json', JSON.stringify({
  editor: 'editor/assets/' + workerFiles.find(name => /^editor\.worker-.*\.js$/.test(name)),
  json: 'editor/assets/' + workerFiles.find(name => /^json\.worker-.*\.js$/.test(name)),
}));
await build({ entryPoints: ['webview/main.ts'], bundle: true, platform: 'browser', target: 'es2022', format: 'esm', outfile: 'dist/webview/main.js' });
await cp('webview/main.css', 'dist/webview/main.css');
await build({ entryPoints: ['tests/integration.ts'], bundle: true, platform: 'node', target: 'node20', format: 'cjs', external: ['vscode'], outfile: 'dist/integration.cjs' });
