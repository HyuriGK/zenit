const fs = require('fs');
const path = require('path');

const IGNORED_DIRS = ['node_modules', '.next', '.git'];
const EXTENSIONS = ['.ts', '.tsx'];

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
            if (EXTENSIONS.includes(ext)) {
                replaceInFile(fullPath);
            }
        }
    }
}

function replaceInFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');

        let newContent = content
            .replace(/from\s+['"]next-auth\/react['"]/g, "from '@/lib/auth-mock'")
            .replace(/from\s+['"]next-auth['"]/g, "from '@/lib/auth-mock'")
            .replace(/import\s+NextAuth.*?['"]next-auth['"]/g, "") // remove NextAuth root imports
            .replace(/import\s+.*?from\s+['"]@\/lib\/auth\/authOptions['"]/g, "import { getServerSession } from '@/lib/auth-mock'")

        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf-8');
            console.log(`Updated Auth in ${filePath}`);
        }
    } catch (err) {
        console.error(`Error reading/writing ${filePath}:`, err.message);
    }
}

traverseDir(path.join(__dirname, 'src'));
console.log('Auth replacement done!');
