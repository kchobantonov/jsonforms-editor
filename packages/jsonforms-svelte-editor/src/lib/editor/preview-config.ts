import type { InitialForm } from "./document/types.js";
export const previewConfigContext = Symbol("preview-config");
export type PreviewConfigProvider = () => NonNullable<InitialForm["config"]>;
