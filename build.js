// Simple build script to create ESM bundle
const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, 'dist');
const indexPath = path.join(distPath, 'index.js');
const esmPath = path.join(distPath, 'index.mjs');

if (fs.existsSync(indexPath)) {
  const content = fs.readFileSync(indexPath, 'utf-8');
  fs.writeFileSync(esmPath, content.replace(/require\(/g, 'import('));
  console.log('✓ ESM bundle created');
}
