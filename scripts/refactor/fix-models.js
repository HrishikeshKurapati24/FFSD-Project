const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'models');

function fixModelsDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (file.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let newContent = content.replace(/require\(['"]\.\.\/models\/mongoDB['"]\)/g, "require('../services/mongoDB')");
            if (content !== newContent) {
                fs.writeFileSync(fullPath, newContent, 'utf8');
                console.log(`Fixed imports in ${fullPath.replace(__dirname, '')}`);
            }
        }
    }
}

fixModelsDir(modelsDir);
console.log('Finished updating imports in models directory.');
