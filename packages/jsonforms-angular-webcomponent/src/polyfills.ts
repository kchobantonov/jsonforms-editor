// Zone JS is required by Angular
import 'zone.js';

// Polyfill for Node.js globals
(window as any).global = window;
(window as any).process = {
  env: { DEBUG: undefined },
  version: '',
  platform: 'browser',
};
