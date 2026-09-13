import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadProject, saveProject, writes, model, inferPart, type FileStore } from '../src/project.ts';
function memory(initial: Record<string, string>) {
  const files = new Map(Object.entries(initial));
  const written: string[] = [];
  const store: FileStore = {
    read: async path => files.get(path),
    write: async (path, text) => { written.push(path); files.set(path, text); },
    delete: async path => { written.push(path); files.delete(path); },
    resolve: (base, path) => new URL(path, base).href,
  };
  return { files, written, store };
}
const base = 'file:///forms/person.form-project.json';
const fixture = () => memory({
  [base]: JSON.stringify({ version: 1, files: { schema: 'types.json', uischema: 'layouts/person.json', data: 'sample.json', config: 'person.config.json' }, model: { custom: { keep: true } } }),
  'file:///forms/types.json': '{"type":"object","properties":{"name":{"type":"string"}}}\n',
  'file:///forms/layouts/person.json': '{"type":"Control","scope":"#/properties/name"}\n',
  'file:///forms/sample.json': '{"name":"Ada"}\n',
});
test('bundled models preserve optional parts and unchanged formatting', async () => {
  const uri = 'file:///forms/a.form.json';
  const text = '{\r\n\t"data": false,\r\n\t"custom": 3\r\n}\r\n';
  const { store, files, written } = memory({ [uri]: text });
  const project = await loadProject(uri, store);
  assert.deepEqual(project.model, { data: false, custom: 3 });
  await saveProject(project, project.model, store);
  assert.equal(written.length, 0);
  await saveProject(project, { ...project.model, data: 0 }, store);
  assert.equal(files.get(uri), text.replace('false', '0'));
});
test('split models resolve arbitrary filenames, preserve extras and write only changed parts', async () => {
  const { store, files, written } = fixture();
  const project = await loadProject(base, store);
  assert.deepEqual(project.model.data, { name: 'Ada' });
  assert.equal(project.model.config, undefined);
  await saveProject(project, { ...project.model, data: { name: 'Grace' } }, store);
  assert.deepEqual(written, ['file:///forms/sample.json']);
  assert.deepEqual(JSON.parse(files.get('file:///forms/sample.json')!), { name: 'Grace' });
  assert.deepEqual(project.model.custom, { keep: true });
});
test('removal omits the UI schema file and later restoration recreates it', async () => {
  const { store, files } = fixture();
  const project = await loadProject(base, store);
  const before = structuredClone(project.model);
  const after = structuredClone(before); delete after.uischema;
  await saveProject(project, after, store);
  assert.equal(files.has('file:///forms/layouts/person.json'), false);
  const reloaded = await loadProject(base, store);
  assert.equal(reloaded.model.uischema, undefined);
  await saveProject(reloaded, before, store);
  assert.deepEqual(JSON.parse(files.get('file:///forms/layouts/person.json')!), before.uischema);
});
test('new config is saved only when authored, and missing mappings stay inline', async () => {
  const { store, files } = fixture();
  const project = await loadProject(base, store);
  assert.equal(writes(project, project.model).get('file:///forms/person.config.json'), undefined);
  await saveProject(project, { ...project.model, config: { showUnfocusedDescription: true }, translations: { en: { name: 'Name' } } }, store);
  assert.deepEqual(JSON.parse(files.get('file:///forms/person.config.json')!), { showUnfocusedDescription: true });
  assert.deepEqual((await loadProject(base, store)).model.translations, { en: { name: 'Name' } });
});
test('external modifications block all writes', async () => {
  const { store, files, written } = fixture();
  const project = await loadProject(base, store);
  files.set('file:///forms/sample.json', '{"name":"external"}');
  await assert.rejects(saveProject(project, { ...project.model, schema: false }, store), /changed outside/);
  assert.deepEqual(written, []);
});
test('missing files created externally are also protected', async () => {
  const { store, files, written } = fixture();
  const project = await loadProject(base, store);
  files.set('file:///forms/person.config.json', '{}');
  await assert.rejects(saveProject(project, project.model, store), /changed outside/);
  assert.deepEqual(written, []);
});
test('failed multi-file saves restore earlier writes', async () => {
  const { store, files } = fixture();
  const original = new Map(files);
  const project = await loadProject(base, store);
  const write = store.write;
  store.write = async (uri, text) => { if (uri.endsWith('/sample.json')) throw new Error('disk full'); await write(uri, text); };
  await assert.rejects(saveProject(project, { ...project.model, schema: false, data: { name: 'Grace' } }, store), /Earlier writes were restored/);
  assert.deepEqual(files, original);
});
test('malformed, ambiguous and escaping mappings are rejected', async () => {
  for (const files of [ { schema: '../secret.json' }, { schema: '/secret.json' }, { schema: 'file:///secret.json' }, { schema: 'same.json', data: 'same.json' }, { mystery: 'x.json' }, { schema: 'person.form-project.json' } ]) {
    const { store } = memory({ [base]: JSON.stringify({ version: 1, files }) });
    await assert.rejects(loadProject(base, store));
  }
  const { store } = memory({ [base]: '{invalid' });
  await assert.rejects(loadProject(base, store), /Invalid JSON/);
});
test('model validation accepts data-only, boolean schemas and root controls', () => {
  for (const value of [{}, { data: null }, { data: [1, 2] }, { schema: false }, { uischema: { type: 'Control', scope: '#' } }]) assert.deepEqual(model(value), value);
  for (const value of [null, [], { schema: [] }, { uischema: {} }, { uischema: { type: 'Group', elements: {} } }, { config: 42 }]) assert.throws(() => model(value));
  assert.equal(inferPart('person.schema.json'), 'schema');
  assert.equal(inferPart('arbitrary.json'), undefined);
});

test('empty bundled forms load without writing and save as valid JSON', async () => {
  const uri = 'file:///forms/empty.form.json';
  for (const text of ['', ' \t\r\n', '\uFEFF\n']) {
    const { store, files, written } = memory({ [uri]: text });
    const project = await loadProject(uri, store);
    assert.deepEqual(project.model, {});
    assert.equal(project.originals[uri], text);
    assert.deepEqual(written, []);
    await saveProject(project, {}, store);
    assert.deepEqual(JSON.parse(files.get(uri)!), {});
    await saveProject(project, { data: { name: 'Ada' } }, store);
    assert.deepEqual((await loadProject(uri, store)).model, { data: { name: 'Ada' } });
  }
});
test('blank form originals still detect external changes before saving', async () => {
  const uri = 'file:///forms/empty.form.json';
  const { store, files, written } = memory({ [uri]: '' });
  const project = await loadProject(uri, store);
  files.set(uri, '{"data": 1}');
  await assert.rejects(saveProject(project, { data: 2 }, store), /changed outside/);
  assert.deepEqual(written, []);
});
test('malformed bundled JSON and empty manifests or part files stay errors', async () => {
  for (const text of ['{', 'null', '[]']) {
    const uri = 'file:///forms/bad.form.json';
    await assert.rejects(loadProject(uri, memory({ [uri]: text }).store));
  }
  await assert.rejects(loadProject(base, memory({ [base]: '' }).store), /Invalid JSON/);
  const { store, files } = fixture();
  files.set('file:///forms/sample.json', '');
  await assert.rejects(loadProject(base, store), /Invalid JSON/);
});
