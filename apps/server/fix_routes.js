const fs = require('fs');
const path = require('path');

const testsDir = path.join(__dirname, 'tests');

function replaceRoutes(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceRoutes(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('/api/v1/')) {
        console.log('Fixing file:', fullPath);
        content = content.replace(/\/api\/v1\//g, '/api/');
        fs.writeFileSync(fullPath, content, 'utf8');
      }
    }
  }
}

replaceRoutes(testsDir);
console.log('Done replacing routes');
