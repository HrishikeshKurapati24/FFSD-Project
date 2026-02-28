const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, 'services');

function fixNestedDirs(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            fixFilesInSubdir(fullPath);
        }
    }
}

function fixFilesInSubdir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            fixFilesInSubdir(fullPath);
        } else if (file.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let newContent = content.replace(/require\(['"]\.\.\/models\/([^'"]+)['"]\)/g, "require('../../models/$1')");
            if (content !== newContent) {
                fs.writeFileSync(fullPath, newContent, 'utf8');
                console.log(`Fixed nested imports in ${fullPath}`);
            }
        }
    }
}

fixNestedDirs(servicesDir);
console.log('Finished updating nested model imports.');
