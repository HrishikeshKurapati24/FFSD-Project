const fs = require('fs');
const path = require('path');

const projectDir = __dirname;
const customerPurchaseSrc = path.join(projectDir, 'controllers', 'customerPurchaseController.js');
const targetDir = path.join(projectDir, 'controllers', 'customer');

if (!fs.existsSync(targetDir)) { fs.mkdirSync(targetDir, { recursive: true }); }

let content = fs.readFileSync(customerPurchaseSrc, 'utf8');
let adjustedContent = content.replace(/require\((['"])(\.\.\/[^'"]+)\1\)/g, "require($1../$2$1)");
adjustedContent = adjustedContent.replace(/require\((['"])(\.\/[^'"]+)\1\)/g, "require($1../$2$1)");

const groupings = [
    'customerShoppingController.js',
    'customerHistoryController.js'
];

groupings.forEach(newFile => {
    fs.writeFileSync(path.join(targetDir, newFile), adjustedContent, 'utf8');
    console.log(`Created (copied all): controllers/customer/${newFile}`);
});
console.log('Finished splitting customerPurchaseController.js');
