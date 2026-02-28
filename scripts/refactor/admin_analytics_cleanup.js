const fs = require('fs');
const path = require('path');

const controllerPath = path.join(__dirname, '../../controllers/admin/adminAnalyticsController.js');
let controller = fs.readFileSync(controllerPath, 'utf8');

// Remove unused imports
controller = controller.replace(
    /const AdminCollaborationService.*?\nconst AdminDashboardService.*?\nconst AdminPaymentService.*?\nconst AdminUserManagementService.*?\n/,
    ""
);
controller = controller.replace(
    /const \{ BrandInfo \} = require\("\.\.\/\.\.\/models\/BrandMongo"\);\nconst \{ InfluencerInfo, InfluencerAnalytics \} = require\("\.\.\/\.\.\/models\/InfluencerMongo"\);\nconst \{ Customer \} = require\("\.\.\/\.\.\/models\/CustomerMongo"\);\nconst \{ CampaignInfo, CampaignInfluencers, CampaignPayments \} = require\("\.\.\/\.\.\/models\/CampaignMongo"\);\nconst \{ Product, Customer: ProductCustomer, ContentTracking \} = require\("\.\.\/\.\.\/models\/ProductMongo"\);\nconst \{ Order \} = require\("\.\.\/\.\.\/models\/OrderMongo"\);\n/,
    ""
);

fs.writeFileSync(controllerPath, controller, 'utf8');
console.log("Imports cleaned up.");
