import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  compilerOptions: {
    customElement: true,
  },
  preprocess: vitePreprocess(),
};

export default config;
