const fs = require('fs');
const path = require('path');

const projectDir = __dirname;
const influencerSrc = path.join(projectDir, 'controllers', 'influencerController.js');
const targetDir = path.join(projectDir, 'controllers', 'influencer');

if (!fs.existsSync(targetDir)) { fs.mkdirSync(targetDir, { recursive: true }); }

let content = fs.readFileSync(influencerSrc, 'utf8');
let adjustedContent = content.replace(/require\((['"])(\.\.\/[^'"]+)\1\)/g, "require($1../$2$1)");
adjustedContent = adjustedContent.replace(/require\((['"])(\.\/[^'"]+)\1\)/g, "require($1../$2$1)");

const groupings = [
    'influencerProfileController.js',
    'influencerDiscoveryController.js',
    'influencerCampaignController.js'
];

groupings.forEach(newFile => {
    fs.writeFileSync(path.join(targetDir, newFile), adjustedContent, 'utf8');
    console.log(`Created (copied all): controllers/influencer/${newFile}`);
});
console.log('Finished splitting influencerController.js');
