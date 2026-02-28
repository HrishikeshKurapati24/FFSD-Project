const fs = require('fs');
const path = require('path');

const controllerPath = path.join(__dirname, '../../controllers/admin/adminUserController.js');
let controller = fs.readFileSync(controllerPath, 'utf8');

// The file is named adminUserService.js in the services dir, but the controller is requiring adminUserManagementService.js
controller = controller.replace(
    /const AdminUserService = require\("\.\.\/\.\.\/services\/admin\/adminUserManagementService"\);/,
    `const AdminUserService = require("../../services/admin/adminUserService");`
);

// We should also remove all unused imports since we're here
controller = controller.replace(
    /const AdminAnalyticsService.*?\nconst AdminCollaborationService.*?\nconst AdminDashboardService.*?\nconst AdminPaymentService.*?\n/,
    `const AdminDashboardService = require("../../services/admin/adminDashboardService");\n`
);

controller = controller.replace(
    /const \{ BrandInfo \} = require\("\.\.\/\.\.\/models\/BrandMongo"\);\nconst \{ InfluencerInfo, InfluencerAnalytics \} = require\("\.\.\/\.\.\/models\/InfluencerMongo"\);\nconst \{ Customer \} = require\("\.\.\/\.\.\/models\/CustomerMongo"\);\nconst \{ CampaignInfo, CampaignInfluencers, CampaignPayments \} = require\("\.\.\/\.\.\/models\/CampaignMongo"\);\nconst \{ Product, Customer: ProductCustomer, ContentTracking \} = require\("\.\.\/\.\.\/models\/ProductMongo"\);\nconst \{ Order \} = require\("\.\.\/\.\.\/models\/OrderMongo"\);\n/,
    `const { BrandInfo } = require("../../models/BrandMongo");\nconst { InfluencerInfo } = require("../../models/InfluencerMongo");\n`
);

fs.writeFileSync(controllerPath, controller, 'utf8');
console.log("adminUserController imports cleaned up.");
