const fs = require('fs');

const ctrlPath = './controllers/brand/brandProfileController.js';
let ctrlC = fs.readFileSync(ctrlPath, 'utf8');

// Replacements

// 1. getBrandProducts
const gpStart = /async getBrandProducts\(req, res\) \{[\s\S]*?(?=try \{[\s\S]*?const products[\s\S]*?res\.json\(\{)/m;
const gpMatch = ctrlC.match(gpStart);
if (gpMatch) {
    const sr = `async getBrandProducts(req, res) {
    try {
      const brandId = req.session.user.id;
      const brandEcommerceService = require('../../services/brand/brandEcommerceService');
      const products = await brandEcommerceService.getBrandProducts(brandId);
      res.json({
        success: true,
        products
      });
    } catch (error) {
      console.error('Error fetching brand products:', error);
      res.status(500).json({ success: false, message: 'Error fetching products' });
    }
  },`;
    ctrlC = ctrlC.replace(/async getBrandProducts\(req, res\) \{[\s\S]*?(?=\/\*\*[\s\n\*]*Get brand orders)/, sr + '\n\n  ');
}


// 2. getBrandOrders
const replaceOrderList = `async getBrandOrders(req, res) {
    try {
      const brandId = req.user?.id || req.session?.user?.id;
      if (!brandId) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const brandEcommerceService = require('../../services/brand/brandEcommerceService');
      const data = await brandEcommerceService.getBrandOrders(brandId);
      
      res.json({ success: true, ...data });
    } catch (error) {
      console.error('Error fetching brand orders:', error);
      res.status(500).json({ success: false, message: 'Error fetching orders' });
    }
  },`;
ctrlC = ctrlC.replace(/async getBrandOrders\(req, res\) \{[\s\S]*?(?=\/\*\*[\s\n\*]*Update order status)/, replaceOrderList + '\n\n  ');

// 3. updateOrderStatus
const replaceOS = `async updateOrderStatus(req, res) {
    try {
      const brandId = req.user?.id || req.session?.user?.id;
      if (!brandId) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const { orderId } = req.params;
      const { newStatus, notes } = req.body;
      
      const brandEcommerceService = require('../../services/brand/brandEcommerceService');
      const order = await brandEcommerceService.updateOrderStatus(orderId, brandId, newStatus, notes);

      const { sendOrderStatusEmail } = require('../../utils/emailService');
      try {
        const customerData = {
          name: order.customer_id?.name || order.guest_info?.name || 'Customer',
          email: order.customer_id?.email || order.guest_info?.email
        };
        await sendOrderStatusEmail(order, customerData, newStatus);
      } catch (emailError) {
        console.error('[Phase 9] Failed to send status update email:', emailError);
      }

      if (newStatus === 'delivered') {
        try {
          await brandEcommerceService.checkCampaignCompletion(order);
        } catch (completionError) {
          console.error('Error in _checkCampaignCompletion:', completionError);
        }
      }

      res.json({
        success: true,
        message: \`Order status updated to \${newStatus}\`,
        order: {
          _id: order._id,
          status: order.status,
          tracking_number: order.tracking_number,
          status_history: order.status_history
        }
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(error.message === 'Unauthorized' || error.message.includes('permission') ? 403 : (error.message.includes('not found') ? 404 : 500)).json({ success: false, message: error.message || 'Error updating order status' });
    }
  },`;
ctrlC = ctrlC.replace(/async updateOrderStatus\(req, res\) \{[\s\S]*?(?=\/\*\*[\s\n\*]*Get order analytics)/, replaceOS + '\n\n  ');

// 4. getOrderAnalytics & 5. _checkCampaignCompletion
const replaceOA = `async getOrderAnalytics(req, res) {
    try {
      const brandId = req.user?.id || req.session?.user?.id;
      if (!brandId) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const brandEcommerceService = require('../../services/brand/brandEcommerceService');
      const analytics = await brandEcommerceService.getOrderAnalytics(brandId);

      res.json({ success: true, analytics });
    } catch (error) {
      console.error('Error fetching order analytics:', error);
      res.status(500).json({ success: false, message: 'Error fetching analytics' });
    }
  }
};`;

ctrlC = ctrlC.replace(/async getOrderAnalytics\(req, res\) \{[\s\S]*?(?=controller\.transformBrandProfileForClient)/, replaceOA + '\n\n');


fs.writeFileSync(ctrlPath, ctrlC);
