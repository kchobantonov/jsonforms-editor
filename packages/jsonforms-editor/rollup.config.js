/**
 * ---------------------------------------------------------------------
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 * ---------------------------------------------------------------------
 */

import json from '@rollup/plugin-json';
import typescript from 'rollup-plugin-typescript2';
import cleanup from 'rollup-plugin-cleanup';
import css from 'rollup-plugin-import-css';
import { visualizer } from 'rollup-plugin-visualizer';

const packageJson = require('./package.json');

const baseConfig = {
  input: 'src/index.ts',
  external: [
    ...Object.keys(packageJson.dependencies),
    ...Object.keys(packageJson.peerDependencies),
    'react',
    /^lodash\/.*/,
    'react-reflex/styles.css',
    /^monaco-editor\/.*/,
    /^react-monaco-editor\/.*/,
  ],
};

const config = [
  {
    ...baseConfig,
    output: [
      {
        file: packageJson.module,
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      typescript(),
      cleanup({ extensions: ['js', 'ts', 'jsx', 'tsx'] }),
      css(),
      json(),
      visualizer({ open: false }),
    ],
  },
  {
    ...baseConfig,
    output: [
      {
        file: packageJson.main,
        format: 'cjs',
        sourcemap: true,
      },
    ],
    plugins: [
      typescript({
        tsconfigOverride: {
          compilerOptions: {
            target: 'ES5',
          },
        },
      }),
      cleanup({ extensions: ['js', 'ts', 'jsx', 'tsx'] }),
      css(),
      json(),
      visualizer({ open: false }),
    ],
  },
];

export default config;
