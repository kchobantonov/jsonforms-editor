/** File association and serialization are independent of VS Code for deterministic tests. */
export const parts = ['schema', 'uischema', 'data', 'uischemas', 'config', 'translations'] as const;
export type Part = typeof parts[number];
export type Model = Record<string, unknown>;
export interface Manifest { version: 1; files: Partial<Record<Part, string>>; model?: Model; [key: string]: unknown }
export interface FileStore {
  read(uri: string): Promise<string | undefined>;
  write(uri: string, text: string): Promise<void>;
  delete(uri: string): Promise<void>;
  resolve(base: string, relative: string): string;
}
export interface Project {
  uri: string;
  model: Model;
  manifest?: Manifest;
  targets: Partial<Record<Part, string>>;
  originals: Record<string, string | undefined>;
}
export function record(value: unknown): value is Model { return !!value && typeof value === 'object' && !Array.isArray(value); }
export function model(value: unknown): Model {
  if (!record(value)) throw new Error('A form model must be a JSON object.');
  if (value.schema !== undefined && typeof value.schema !== 'boolean' && !record(value.schema)) throw new Error('schema must be an object or boolean.');
  if (value.uischema !== undefined) {
    const visit = (ui: unknown) => {
      if (!record(ui) || typeof ui.type !== 'string') throw new Error('Every UI schema element needs a type.');
      if (ui.elements !== undefined) {
        if (!Array.isArray(ui.elements)) throw new Error('UI schema elements must be an array.');
        ui.elements.forEach(visit);
      }
    };
    visit(value.uischema);
  }
  if (value.config !== undefined && !record(value.config)) throw new Error('config must be an object.');
  if (value.uischemas !== undefined && !Array.isArray(value.uischemas)) throw new Error('uischemas must be an array.');
  return structuredClone(value);
}
export function parse(text: string, uri: string): unknown {
  try { return JSON.parse(text.replace(/^\uFEFF/, '')); }
  catch (error) { throw new Error(`Invalid JSON in ${uri}: ${String(error)}`); }
}
export function inferPart(name: string): Part | undefined {
  return parts.find(part => name.toLowerCase().endsWith(`.${part}.json`));
}
export function relativePath(path: unknown): string {
  if (typeof path !== 'string' || !path || path.includes('\\') || path.startsWith('/') || /^[a-z][a-z\d+.-]*:/i.test(path) || path.split('/').some(segment => segment === '..') || !path.endsWith('.json')) {
    throw new Error('Project file paths must be relative JSON paths within the project directory (no ../ or absolute paths).');
  }
  return path;
}
export async function loadProject(uri: string, store: FileStore): Promise<Project> {
  const text = await store.read(uri);
  if (text === undefined) throw new Error(`File not found: ${uri}`);
  // A newly created bundled form starts empty; manifests and part files stay strict JSON.
  const value = !uri.endsWith('.form-project.json') && text.trim() === '' ? {} : parse(text, uri);
  if (!uri.endsWith('.form-project.json')) return { uri, model: model(value), targets: {}, originals: { [uri]: text } };
  if (!record(value) || value.version !== 1 || !record(value.files)) throw new Error('A form project needs version: 1 and a files mapping.');
  const manifest = structuredClone(value) as unknown as Manifest;
  if (manifest.model !== undefined && !record(manifest.model)) throw new Error('Project model must be an object.');
  const project: Project = { uri, manifest, model: { ...manifest.model }, targets: {}, originals: { [uri]: text } };
  const assigned = new Set([uri]);
  for (const [part, path] of Object.entries(manifest.files)) {
    if (!parts.includes(part as Part)) throw new Error(`Unknown form part: ${part}`);
    if (Object.hasOwn(project.model, part)) throw new Error(`${part} cannot be both inline and file-backed.`);
    const target = store.resolve(uri, relativePath(path));
    if (assigned.has(target)) throw new Error('Each form part must use a different file, separate from the project manifest.');
    assigned.add(target);
    project.targets[part as Part] = target;
    const content = await store.read(target);
    project.originals[target] = content;
    if (content !== undefined) project.model[part] = parse(content, target);
  }
  project.model = model(project.model);
  return project;
}
export function serialize(value: unknown, original?: string): string {
  const indent = original?.match(/\n([\t ]+)\S/)?.[1] ?? '  ';
  const eol = original?.includes('\r\n') ? '\r\n' : '\n';
  return JSON.stringify(value, null, indent).replace(/\n/g, eol) + eol;
}
/** Missing mapped parts delete the part file; unmapped parts remain inline in the manifest. */
export function writes(project: Project, next: Model): Map<string, string | undefined> {
  model(next);
  const result = new Map<string, string | undefined>();
  if (!project.manifest) result.set(project.uri, serialize(next, project.originals[project.uri]));
  else {
    const inline = structuredClone(next);
    for (const [part, target] of Object.entries(project.targets)) {
      result.set(target, Object.hasOwn(next, part) ? serialize(next[part], project.originals[target]) : undefined);
      delete inline[part];
    }
    const manifest = { ...project.manifest, ...(Object.keys(inline).length ? { model: inline } : {}) };
    if (!Object.keys(inline).length) delete manifest.model;
    result.set(project.uri, serialize(manifest, project.originals[project.uri]));
  }
  // Preserve original bytes for semantically unchanged files.
  for (const [uri, text] of result) {
    const old = project.originals[uri];
    if (old !== undefined && old.trim() !== '' && text !== undefined && JSON.stringify(parse(old, uri)) === JSON.stringify(parse(text, uri))) result.set(uri, old);
  }
  return result;
}
export async function saveProject(project: Project, next: Model, store: FileStore): Promise<void> {
  const planned = writes(project, next);
  // Check every associated file before any writes, even if only another part changed.
  for (const [uri, original] of Object.entries(project.originals)) {
    if (await store.read(uri) !== original) throw new Error(`File changed outside the designer: ${uri}. Revert/reopen to reload it before saving.`);
  }
  const completed: string[] = [];
  try {
    for (const [uri, text] of planned) {
      if (text === project.originals[uri]) continue;
      if (text === undefined) await store.delete(uri); else await store.write(uri, text);
      completed.push(uri);
    }
  } catch (error) {
    const failures: string[] = [];
    for (const uri of completed.reverse()) {
      try {
        if (await store.read(uri) !== planned.get(uri)) { failures.push(uri); continue; }
        const old = project.originals[uri];
        if (old === undefined) await store.delete(uri); else await store.write(uri, old);
      } catch { failures.push(uri); }
    }
    throw new Error(`Save failed: ${String(error)}${failures.length ? `. Could not restore: ${failures.join(', ')}` : '. Earlier writes were restored.'}`);
  }
  for (const [uri, text] of planned) project.originals[uri] = text;
  project.model = structuredClone(next);
  if (project.manifest) project.manifest = parse(planned.get(project.uri)!, project.uri) as Manifest;
}
