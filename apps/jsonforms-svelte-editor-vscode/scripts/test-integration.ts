import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const macBinary = '/Applications/Visual Studio Code.app/Contents/MacOS/';
const executable = process.env.VSCODE_EXECUTABLE ?? (process.platform === 'darwin' ? macBinary + (existsSync(macBinary + 'Code') ? 'Code' : 'Electron') : 'code');
const temporary = await mkdtemp(join(tmpdir(), 'jsonforms-vscode-host-'));
try {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE;
  const child = spawn(executable, ['--no-sandbox', '--disable-gpu', '--disable-workspace-trust', '--skip-welcome', '--skip-release-notes', '--disable-extensions', `--user-data-dir=${join(temporary, 'user')}`, `--extensions-dir=${join(temporary, 'extensions')}`, `--extensionDevelopmentPath=${root}`, `--extensionTestsPath=${join(root, 'dist/integration.cjs')}`], { stdio: 'inherit', env });
  const code = await new Promise<number | null>((resolve, reject) => { child.on('error', reject); child.on('exit', resolve); });
  if (code !== 0) throw new Error(`VS Code integration tests exited with ${code}`);
} finally { await rm(temporary, { recursive: true, force: true }); }
