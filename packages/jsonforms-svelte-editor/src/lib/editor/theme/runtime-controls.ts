// Runtime forms have their own shadow root and HSL theme tokens. Give their
// editable surfaces the same separation as the inspector's dark inputs.
const controls = ":is([data-slot='input'], [data-slot='textarea'], [data-slot='select-trigger'], [data-slot='native-select'])";
const surface = `
  background-color: hsl(var(--secondary));
  color: hsl(var(--foreground));
`;
export const runtimeControlStyles = `
:host([data-mode='dark']) ${controls} { ${surface} }
:host([data-mode='dark']) ${controls}:not([aria-invalid='true']):not(:focus-within) { border-color: hsl(var(--muted-foreground) / 0.4); }
@media (prefers-color-scheme: dark) {
  :host([data-mode='system']) ${controls} { ${surface} }
  :host([data-mode='system']) ${controls}:not([aria-invalid='true']):not(:focus-within) { border-color: hsl(var(--muted-foreground) / 0.4); }
}
`;
