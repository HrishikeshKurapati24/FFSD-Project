const brandEcommerceService = require('../../services/brand/brandEcommerceService');
const { sendOrderStatusEmail } = require('../../utils/emailService');

const controller = {
  // Get products for brand
  async getBrandProducts(req, res) {
    try {
      const brandId = req.session.user.id;
      const products = await brandEcommerceService.getBrandProducts(brandId);
      res.json({ success: true, products });
    } catch (error) {
      console.error('Error fetching brand products:', error);
      res.status(500).json({ success: false, message: 'Error fetching products' });
    }
  },

  // Get brand orders - fetch all orders containing brand's products
  async getBrandOrders(req, res) {
    try {
      const brandId = req.user?.id || req.session?.user?.id;
      if (!brandId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const orders = await brandEcommerceService.getBrandOrders(brandId);
      res.json({ success: true, ...orders });
    } catch (error) {
      console.error('Error fetching brand orders:', error);
      res.status(500).json({ success: false, message: 'Error fetching orders' });
    }
  },

  // Update order status with validation
  async updateOrderStatus(req, res) {
    try {
      const brandId = req.user?.id || req.session?.user?.id;
      if (!brandId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const { orderId } = req.params;
      const { newStatus, notes } = req.body;

      const order = await brandEcommerceService.updateOrderStatus(orderId, brandId, newStatus, notes);

      // Send Email Notification
      try {
        const customerData = {
          name: order.customer_id?.name || order.guest_info?.name || 'Customer',
          email: order.customer_id?.email || order.guest_info?.email
        };
        await sendOrderStatusEmail(order, customerData, newStatus);
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError);
      }

      // Auto-Campaign Completion check
      if (newStatus === 'delivered') {
        try {
          await brandEcommerceService.checkCampaignCompletion(order);
        } catch (completionError) {
          console.error('Error in checkCampaignCompletion:', completionError);
        }
      }

      res.json({
        success: true,
        message: `Order status updated to ${newStatus}`,
        order: {
          _id: order._id,
          status: order.status,
          tracking_number: order.tracking_number,
          status_history: order.status_history
        }
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      const statusCode = error.message.includes('not found') ? 404 : (error.message.includes('permission') ? 403 : 400);
      res.status(statusCode).json({ success: false, message: error.message || 'Error updating order status' });
    }
  },

  // Get order analytics for brand dashboard
  async getOrderAnalytics(req, res) {
    try {
      const brandId = req.user?.id || req.session?.user?.id;
      if (!brandId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const analytics = await brandEcommerceService.getOrderAnalytics(brandId);
      res.json({ success: true, analytics });
    } catch (error) {
      console.error('Error fetching order analytics:', error);
      res.status(500).json({ success: false, message: 'Error fetching analytics' });
    }
  }
};

module.exports = controller;
