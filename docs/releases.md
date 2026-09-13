# Build, releases, and GitHub Pages

This repository follows the `jsonforms-svelte` Changesets workflow, using `master` as its base branch. Both editor packages are public npm packages; the demo and workspace root remain private.

## Repository setup

- In GitHub **Settings → Pages → Build and deployment**, choose **GitHub Actions**.
- In **Settings → Actions → General**, allow GitHub Actions to create and approve pull requests so Changesets can open its release PR.
- Add the **NPM_TOKEN** Actions secret with permission to publish both `@chobantonov/jsonforms-svelte-editor` and `@chobantonov/jsonforms-svelte-editor-webcomponent`. Follow the same npm organization/token setup as `jsonforms-svelte`.
- Allow the `github-pages` environment to deploy from `master`.

The deployed demo is at https://kchobantonov.github.io/jsonforms-editor/. The build uses `/jsonforms-editor/` as its Vite base and tests the production demo at that path before deploying. Pull requests run checks without deployment permissions.

## Builds

`pnpm build:pages` builds the editor packages and production demo. CI also runs type checks, unit tests, release tarball validation, and browser regressions against a separate build containing test fixtures. Only the production demo is uploaded to Pages; deployment waits for every build check to pass.

`pnpm release:pack` builds and validates the pending release versions in temporary tarballs without changing working-tree package versions. Tarballs are checked with publint and rejected if local dependency protocols remain. Output defaults to `/tmp/jsonforms-editor-release-packs`; CI retains tarballs as an artifact.

## Releases

1. Run `pnpm changeset`, select the affected packages, and describe the change. Commit its generated Markdown file with the implementation.
2. On `master`, the release workflow creates or updates a `task: release` PR. It updates versions, changelogs, workspace dependencies, and the lockfile.
3. Review and merge that PR. Changesets builds and validates packages, publishes them to npm, and creates GitHub releases and tags.

The release workflow can also be run manually on `master`. `pnpm changeset:publish` performs a real npm publication; `pnpm release:pack` is the local rehearsal command. No npm publication or Pages deployment is performed simply by adding these files locally.

The initial changeset proposes version 0.1.1 for both editor packages.
