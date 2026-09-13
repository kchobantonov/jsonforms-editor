# JSON Forms Editor

Svelte 5 visual authoring workspace for JSON Forms.

- Native editor: [packages/jsonforms-svelte-editor](packages/jsonforms-svelte-editor/README.md)
- Web component wrapper and shared shadcn components: [packages/jsonforms-svelte-editor-webcomponent](packages/jsonforms-svelte-editor-webcomponent/README.md)
- Demo (native Svelte by default): [apps/jsonforms-svelte-editor-demo](apps/jsonforms-svelte-editor-demo/README.md)
- [Architecture, feature plans and testing](docs/form-editor/README.md)

## Local setup

Use Node 22 and pnpm 10. Renderer dependencies use release version `1.0.2`;
no sibling checkout is required. The demo loads examples from `@jsonforms/examples`.

```sh
pnpm install
pnpm build
pnpm dev
```

Version 1.0.2 is the pending renderer release. Before it is published, use the
packed-release rehearsal below; a normal registry install cannot resolve it yet.
Regenerate and commit `pnpm-lock.yaml` with `pnpm install` after publication, then
use `pnpm install --frozen-lockfile` in CI. The lockfile preserves the existing third-party resolutions; stale linked renderer
entries have been removed. It must be regenerated against the registry after publication.

## Test unpublished renderer packages

After running `pnpm release:pack` in the renderer project:

```sh
pnpm test:packed /tmp/jsonforms-release-packs
```

This copies the editor into a temporary directory, overrides all renderer packages
with validated local tarballs, installs dependencies, checks types, runs unit tests,
and builds the production demo. A browser smoke test verifies the upstream examples
and both native and web-component integrations. It then builds in test mode and runs
the full browser suite with editor-owned regression fixtures. Production builds do
not include those fixtures. The source manifests remain release-version dependencies;
temporary overrides and their generated lockfile stay in the isolated test directory.

## Verification

```sh
pnpm check
pnpm test
pnpm build:test
pnpm editor:demo:preview --port 4178
# In another terminal, with the production demo running:
pnpm test:browser
```

Browser tests are TypeScript and cover native and web-component integration. `EDITOR_DEMO_URL` overrides their default URL. Install Chromium with `pnpm --filter jsonforms-svelte-editor-demo exec playwright install chromium` when needed.

## Updating shadcn components

The wrapper owns the editor's shared shadcn sources; native inspector and editor use the same set. Do not customize generated components silently.

```sh
pnpm shadcn:check --stage /tmp/editor-shadcn-review
pnpm shadcn:sync --ref <FULL_UPSTREAM_COMMIT_SHA> --stage /tmp/editor-shadcn-review --write
```

The script audits/syncs only this project's component set. The weekly/manual `.github/workflows/shadcn-audit.yml` retains the read-only report without a renderer checkout. Review source, dependency and theme changes before applying. The unit contract test verifies that host components satisfy the installed renderer's UI imports. Then run builds, checks and browser tests in both integrations. Sync does not install dependencies or migrate theme CSS.

## Pages shell integration

The renderer project's pages shell can include this demo's existing `dist` output as an optional artifact. Build the editor demo first, then build the pages shell in the renderer project. Its renderer-only build does not depend on this workspace.

## Migration

The three editor projects, their tests and `docs/form-editor` were moved from `jsonforms-svelte`, including local uncommitted work. This project owns its package manifest, lockfile, TypeScript configuration and shadcn tooling. Git history was not rewritten and no remote repository or publication was created.
