const fs = require('fs');

const ctrlPath = './controllers/admin/adminCollaborationController.js';
let ctrlC = fs.readFileSync(ctrlPath, 'utf8');

const regex = /\/\/\s*Make sure all controller functions\/classes are closed above this line[\s\S]*?(?=module\.exports = CollaborationController;)/m;
ctrlC = ctrlC.replace(regex, '\n');

fs.writeFileSync(ctrlPath, ctrlC);

