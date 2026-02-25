const fs = require('fs');
const path = require('path');

const IGNORED_DIRS = ['node_modules', '.next', '.git'];
const EXTENSIONS = ['.ts', '.tsx', '.json', '.md'];

function traverseDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!IGNORED_DIRS.includes(file)) {
        traverseDir(fullPath);
      }
    } else {
      const ext = path.extname(fullPath);
      if (EXTENSIONS.includes(ext) || file === 'package.json') {
        replaceInFile(fullPath);
      }
    }
  }
}

function replaceInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Replace "Aura" with "Zenit", "aura" with "zenit"
    const newContent = content
      .replace(/\bAura\b/g, 'Zenit')
      .replace(/\baura\b/g, 'zenit');

    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf-8');
      console.log(`Updated ${filePath}`);
    }
  } catch (err) {
    console.error(`Error reading/writing ${filePath}:`, err.message);
  }
}

traverseDir(__dirname);
console.log('Done!');
