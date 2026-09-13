import type { InitialForm } from "@chobantonov/jsonforms-svelte-editor";
const resources = import.meta.glob("./fixtures/*/*.json", {
  eager: true,
  import: "default",
}) as Record<string, unknown>;
export const regressionExamples = new Map<string, InitialForm>();
for (const [path, value] of Object.entries(resources)) {
  const match = path.match(
    /fixtures\/([^/]+)\/(schema|uischema|uischemas|data|i18n)\.json$/,
  );
  if (!match) continue;
  const [, name, part] = match;
  const form = regressionExamples.get(name) ?? {};
  form[part === "i18n" ? "translations" : part] = value as InitialForm["data"];
  regressionExamples.set(name, form);
}
