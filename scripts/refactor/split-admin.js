const fs = require('fs');
const path = require('path');

const projectDir = __dirname;
const adminControllerPath = path.join(projectDir, 'controllers', 'AdminController.js');
const adminDir = path.join(projectDir, 'controllers', 'admin');

if (!fs.existsSync(adminDir)) {
    fs.mkdirSync(adminDir, { recursive: true });
}

let content = fs.readFileSync(adminControllerPath, 'utf8');

// 1. Extract common imports (up to the first 'const DashboardController')
const dashboardStart = content.indexOf('const DashboardController = {');
const commonImports = content.substring(0, dashboardStart);

// We need to adjust relative imports since we are moving one level deeper
// e.g., require('../models/mongoDB') -> require('../../models/mongoDB')
// require('../utils/emailService') -> require('../../utils/emailService')
let adjustedImports = commonImports.replace(/require\((['"])(\.\.\/[^'"]+)\1\)/g, "require($1../$2$1)");
// Update any sibling imports: require('./xyz') -> require('../xyz')
adjustedImports = adjustedImports.replace(/require\((['"])(\.\/[^'"]+)\1\)/g, "require($1../$2$1)");

// Object blocks to extract:
// 'DashboardController', 'AnalyticsController', 'FeedbackController', 'UserManagementController', 
// 'PaymentController', 'CollaborationController', 'CustomerController', 'OrderAnalyticsController'
// NotificationController is also there, maybe skip it or put it in adminNotificationController.

const controllersToSplit = [
    { name: 'DashboardController', newFile: 'adminDashboardController.js' },
    { name: 'AnalyticsController', newFile: 'adminAnalyticsController.js' },
    { name: 'FeedbackController', newFile: 'adminFeedbackController.js' },
    { name: 'UserManagementController', newFile: 'adminUserController.js' },
    { name: 'PaymentController', newFile: 'adminPaymentController.js' },
    { name: 'CollaborationController', newFile: 'adminCollaborationController.js' },
    { name: 'NotificationController', newFile: 'adminNotificationController.js' },
    { name: 'CustomerController', newFile: 'adminCustomerController.js' },
    { name: 'OrderAnalyticsController', newFile: 'adminOrderController.js' }
];

controllersToSplit.forEach((ctrl, index) => {
    let startStr = `const ${ctrl.name} = {`;
    let startIndex = content.indexOf(startStr);
    
    if (startIndex !== -1) {
        // Find the ending }; of the object
        // Actually, we can just find the start of the next controller or the module.exports
        let nextStartStr = (index < controllersToSplit.length - 1) ? `const ${controllersToSplit[index + 1].name} = {` : 'module.exports = {';
        let endIndex = content.indexOf(nextStartStr, startIndex);
        
        if (endIndex === -1) {
            endIndex = content.indexOf('module.exports = {', startIndex);
        }

        if (endIndex !== -1) {
            let ctrlContent = content.substring(startIndex, endIndex).trim();
            // Optional: clean up trailing semicolons or comments
            
            let finalContent = `${adjustedImports}\n${ctrlContent}\n\nmodule.exports = ${ctrl.name};\n`;
            
            let outPath = path.join(adminDir, ctrl.newFile);
            fs.writeFileSync(outPath, finalContent, 'utf8');
            console.log(`Created: ${outPath.replace(projectDir, '')}`);
        } else {
            console.log(`Could not find end for ${ctrl.name}`);
        }
    } else {
        console.log(`Could not find start for ${ctrl.name}`);
    }
});

console.log('Finished splitting AdminController.js');
