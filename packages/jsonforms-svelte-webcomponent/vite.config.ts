import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { defineConfig, type PluginOption } from 'vite';

const customElementComponents = new Set([
  '/src/lib/SkeletonJsonForms.svelte',
  '/src/lib/FlowbiteJsonForms.svelte',
]);

const plugins: PluginOption[] = [
  tailwindcss() as unknown as PluginOption,
  svelte({
    dynamicCompileOptions: ({ filename, compileOptions }) => {
      const normalized = filename.replace(/\\/g, '/');
      if ([...customElementComponents].some((name) => normalized.endsWith(name))) {
        return { ...compileOptions, customElement: true };
      }
      return compileOptions;
    },
  }) as unknown as PluginOption,
];

export default defineConfig({
  base: './',
  plugins,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'esbuild',
    sourcemap: true,
    cssCodeSplit: true,
    commonjsOptions: {
      strictRequires: true,
      transformMixedEsModules: true,
    },
    lib: {
      entry: path.resolve(import.meta.dirname, 'src/lib/webcomponent-entry.ts'),
      name: 'JsonFormsSvelteWebComponent',
      formats: ['es'],
      fileName: () => 'svelte-jsonforms.js',
    },
    rollupOptions: {
      output: {
        entryFileNames: 'svelte-jsonforms.js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});
