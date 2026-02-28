const fs = require('fs');
const path = require('path');

const projectDir = __dirname;
const excludeDirs = ['node_modules', '.git'];

function fixMongoImports(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (excludeDirs.includes(file)) continue;

        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            fixMongoImports(fullPath);
        } else if (file.endsWith('.js') && file !== 'fix-mongo.js') {
            let content = fs.readFileSync(fullPath, 'utf8');
            let newContent = content;

            // Replacements
            newContent = newContent.replace(/require\(['"]\.\/models\/mongoDB['"]\)/g, "require('./mongoDB')");
            newContent = newContent.replace(/require\(['"]\.\.\/models\/mongoDB['"]\)/g, "require('../mongoDB')");
            newContent = newContent.replace(/require\(['"]\.\.\/\.\.\/models\/mongoDB['"]\)/g, "require('../../mongoDB')");

            // Fix services/AdminModel.js specifically which had './mongoDB'
            if (fullPath.endsWith('/services/AdminModel.js')) {
                newContent = newContent.replace(/require\(['"]\.\/mongoDB['"]\)/g, "require('../mongoDB')");
            }

            if (content !== newContent) {
                fs.writeFileSync(fullPath, newContent, 'utf8');
                console.log(`Fixed imports in ${fullPath.replace(projectDir, '')}`);
            }
        }
    }
}

fixMongoImports(projectDir);
console.log('Finished updating mongoDB connection imports.');
