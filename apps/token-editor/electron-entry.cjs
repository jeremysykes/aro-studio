// Electron entry point - loads TypeScript main file using tsx
// This file must be CommonJS (not ESM) because Electron's main entry requires it

// Register tsx to handle TypeScript files
const { register } = require('tsx/cjs/api');

// Register tsx
register();

// Now we can require the TypeScript file
require('./electron/main/index.ts');
