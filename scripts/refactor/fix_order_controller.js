const fs = require('fs');

const ctrlPath = './controllers/admin/adminOrderController.js';
let ctrlC = fs.readFileSync(ctrlPath, 'utf8');

const s1Start = /async getAdminOrderAnalytics\(req, res\) \{[\s\S]*?(?=res\.json\(\{)/m;
const s1Match = ctrlC.match(s1Start);
if(s1Match) {
    const s1Rep = `async getAdminOrderAnalytics(req, res) {
        try {
            const AdminOrderService = require('../../services/admin/adminOrderService');
            const analytics = await AdminOrderService.getOrderAnalytics(req.query);
            `;
    ctrlC = ctrlC.replace(s1Match[0], s1Rep);
}

const s2Start = /async getAdminAllOrders\(req, res\) \{[\s\S]*?(?=res\.json\(\{)/m;
const s2Match = ctrlC.match(s2Start);
if(s2Match) {
    const s2Rep = `async getAdminAllOrders(req, res) {
        try {
            const AdminOrderService = require('../../services/admin/adminOrderService');
            const filteredOrders = await AdminOrderService.getAllOrders(req.query);
            `;
    ctrlC = ctrlC.replace(s2Match[0], s2Rep);
}

fs.writeFileSync(ctrlPath, ctrlC);

