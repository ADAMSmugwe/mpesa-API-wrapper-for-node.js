#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Compile TypeScript
console.log('📦 Compiling CLI...');
execSync('tsc bin/cli.ts --outDir bin --module commonjs --target es2020 --esModuleInterop --resolveJsonModule', {
  stdio: 'inherit'
});

// Read the compiled file
const cliPath = path.join(__dirname, 'bin', 'cli.js');
let content = fs.readFileSync(cliPath, 'utf-8');

// Remove any existing shebang and add one at the top
content = content.replace(/^#!.*\n/gm, '');
content = '#!/usr/bin/env node\n' + content;

// Write back
fs.writeFileSync(cliPath, content);

// Make executable
fs.chmodSync(cliPath, '755');

console.log('✅ CLI built successfully!');
