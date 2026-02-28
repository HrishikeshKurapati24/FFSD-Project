const fs = require('fs');
const path = require('path');

const projectDir = __dirname;
const campaignContentSrc = path.join(projectDir, 'controllers', 'campaignContentController.js');
const targetDir = path.join(projectDir, 'controllers', 'campaign');

if (!fs.existsSync(targetDir)) { fs.mkdirSync(targetDir, { recursive: true }); }

let content = fs.readFileSync(campaignContentSrc, 'utf8');
let adjustedContent = content.replace(/require\((['"])(\.\.\/[^'"]+)\1\)/g, "require($1../$2$1)");
adjustedContent = adjustedContent.replace(/require\((['"])(\.\/[^'"]+)\1\)/g, "require($1../$2$1)");

const groupings = [
    'campaignContentController.js'
];

groupings.forEach(newFile => {
    fs.writeFileSync(path.join(targetDir, newFile), adjustedContent, 'utf8');
    console.log(`Created (copied all): controllers/campaign/${newFile}`);
});
console.log('Finished moving campaignContentController.js');
