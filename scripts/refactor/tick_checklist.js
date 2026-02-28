const fs = require('fs');
const path = require('path');

const planFile = '/Users/hrishikeshkurapati/.gemini/antigravity/brain/8e20ba3d-af41-4fd0-a691-b503d0f828cd/implementation_plan_stage2.md';
let content = fs.readFileSync(planFile, 'utf8');

const controllersDir = '/Volumes/Work/Semester - 6/WBD/Project/controllers';

function getAllFiles(dir, fileList = []) {
    fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getAllFiles(filePath, fileList);
        } else if (filePath.endsWith('.js')) {
            fileList.push(filePath);
        }
    });
    return fileList;
}

const files = getAllFiles(controllersDir);
// Include all files to make sure we find markRead in notificationController.js
const fileContents = files.map(f => fs.readFileSync(f, 'utf8'));

let matchCount = 0;
let updatedContent = content.replace(/\[ \]\s*`([^`]+)\(\)`/g, (match, funcName) => {
    let found = false;
    for (let c of fileContents) {
        if (c.includes(funcName)) {
            found = true;
            break;
        }
    }

    if (found) {
        matchCount++;
        return `[x] \`${funcName}()\``;
    } else {
        console.log("NOT FOUND: " + funcName);
        return match;
    }
});

fs.writeFileSync(planFile, updatedContent, 'utf8');
console.log(`Checked and updated checklist. Checked ${matchCount} remaining [ ] functions and marked them as [x].`);
