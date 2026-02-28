const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, 'services');

function fixImportsInDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            fixImportsInDir(fullPath);
        } else if (file.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let newContent = content.replace(/require\(['"]((?:\.\.\/)+|(?:\.\/))config\/([^'"]+)['"]\)/g, (match, prefix, moduleName) => {
                prefix = prefix || '';
                return `require('${prefix}models/${moduleName}')`;
            });
            if (content !== newContent) {
                fs.writeFileSync(fullPath, newContent, 'utf8');
                console.log(`Fixed imports in ${fullPath.replace(__dirname, '')}`);
            }
        }
    }
}

fixImportsInDir(servicesDir);
console.log('Finished updating imports in services directory.');
