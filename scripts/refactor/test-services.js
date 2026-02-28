const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, 'services');
let passed = 0;
let failed = 0;

function testRequireDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            testRequireDir(fullPath);
        } else if (file.endsWith('.js')) {
            try {
                // Just try to require the file to ensure there are no syntax errors
                // or outstanding missing dependencies/bad imports within the new services
                require(fullPath);
                console.log(`✅ Successfully loaded: ${fullPath.replace(__dirname, '')}`);
                passed++;
            } catch (error) {
                console.error(`❌ Failed to load: ${fullPath.replace(__dirname, '')}`);
                console.error(`   Error: ${error.message}`);
                failed++;
            }
        }
    }
}

console.log('--- Starting Service Load Tests ---');
testRequireDir(servicesDir);
console.log('-----------------------------------');
console.log(`Results: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
