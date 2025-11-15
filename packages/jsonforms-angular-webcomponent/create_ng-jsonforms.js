const fs = require('fs-extra');
const path = require('path');

(async function build() {
  const distPath = './dist/jsonforms-angular-webcomponent';

  // Read all files from dist directory
  const files = await fs.readdir(distPath);

  // Find all JS chunks (polyfills, vendor, common, main, etc.)
  const jsFiles = files
    .filter((f) => f.endsWith('.js') && !f.endsWith('.map'))
    .sort((a, b) => {
      // Load order: polyfills -> vendor -> common -> main
      const order = ['polyfills', 'vendor', 'common', 'main'];
      const aIndex = order.findIndex((prefix) => a.startsWith(prefix));
      const bIndex = order.findIndex((prefix) => b.startsWith(prefix));
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });

  if (jsFiles.length === 0) {
    console.error('No JavaScript files found!');
    console.log('Available files:', files);
    process.exit(1);
  }

  console.log('Found JS files (in load order):', jsFiles);

  // Create the loader script with stable name
  const loaderScript = `
// ng-jsonforms Web Component Loader
(function() {
  'use strict';
  
  const currentScript = document.currentScript;
  let basePath = '';
  
  if (currentScript && currentScript.src) {
    basePath = currentScript.src.substring(0, currentScript.src.lastIndexOf('/') + 1);
  } else {
    // Fallback: find this script in the DOM
    const scripts = document.querySelectorAll('script[src*="ng-jsonforms.js"]');
    if (scripts.length > 0) {
      const src = scripts[scripts.length - 1].src;
      basePath = src.substring(0, src.lastIndexOf('/') + 1);
    } else {
      // Last resort: assume same directory as the HTML file
      basePath = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
      console.warn('ng-jsonforms: Could not determine script path, using document location');
    }
  }
    
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = basePath + src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  
  // Load all chunks in parallel for faster loading
  const chunks = ${JSON.stringify(jsFiles)};
  
  const runtimeChunk = chunks.find(c => c.startsWith('runtime'));
  const otherChunks = chunks.filter(c => !c.startsWith('runtime'));
  
  // Load runtime first, then load everything else in parallel
  loadScript(runtimeChunk || chunks[0])
    .then(() => Promise.all(otherChunks.map(chunk => loadScript(chunk))))
    .catch(err => console.error('Failed to load ng-jsonforms:', err));
})();
`;

  // Write the loader script with stable name to dist directory
  await fs.writeFile(path.join(distPath, 'ng-jsonforms.js'), loaderScript);

  console.log('✓ Web component built successfully!');
  console.log('✓ Files in dist/jsonforms-angular-webcomponent:');
  console.log('  - ng-jsonforms.js (stable name - use this in your HTML)');
  jsFiles.forEach((file) => console.log(`  - ${file}`));
})();
