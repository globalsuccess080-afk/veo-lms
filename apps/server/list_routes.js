const fs = require('fs');
const path = require('path');

const modulesDir = path.join(__dirname, 'src/modules');
const results = [];

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanDir(fullPath);
    } else if (file.endsWith('.router.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const routeMatches = content.matchAll(/router\.(get|post|put|patch|delete)\(['"]([^'"]+)['"]/g);
      for (const match of routeMatches) {
        results.push({
          file: file,
          method: match[1].toUpperCase(),
          path: match[2]
        });
      }
    }
  }
}

scanDir(modulesDir);
console.log(JSON.stringify(results, null, 2));
