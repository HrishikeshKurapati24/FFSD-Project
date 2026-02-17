const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

/**
 * Configure Email Transporter
 */
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'placeholder@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'placeholder-password'
    }
});

/**
 * Send Order Status Email
 * @param {Object} order - The order document
 * @param {Object} customer - The customer/user document or guest_info
 * @param {String} status - The new status (paid, shipped, delivered, cancelled)
 */
const sendOrderStatusEmail = async (order, customer, status) => {
    try {
        const customerName = customer.name || (customer.customer_id ? customer.customer_id.name : 'Valued Customer');
        const customerEmail = customer.email || (customer.customer_id ? customer.customer_id.email : null);

        if (!customerEmail) {
            console.warn(`[EmailService] No email found for order ${order._id}, skipping.`);
            return;
        }

        let subject = '';
        let htmlContent = '';
        const appUrl = process.env.APP_URL || 'http://localhost:5173';

        switch (status) {
            case 'paid':
                subject = `✨ Order Confirmed! #${order._id.toString().substring(order._id.toString().length - 8)}`;
                htmlContent = `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                        <h2 style="color: #4CAF50;">Thank you for your order, ${customerName}!</h2>
                        <p>We've received your payment and are getting your order ready.</p>
                        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <strong>Order ID:</strong> ${order._id}<br>
                            <strong>Total Amount:</strong> $${order.total_amount.toLocaleString()}<br>
                            <strong>Status:</strong> Confirmed
                        </div>
                        <p>You can track your order progress here:</p>
                        <a href="${appUrl}/customer/orders" style="display: inline-block; padding: 10px 20px; background: #2196F3; color: white; text-decoration: none; border-radius: 5px;">View Order History</a>
                    </div>
                `;
                break;

            case 'shipped':
                subject = `🚚 Your Order Has Shipped! #${order._id.toString().substring(order._id.toString().length - 8)}`;
                htmlContent = `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                        <h2 style="color: #2196F3;">Your package is on its way!</h2>
                        <p>Hi ${customerName}, good news! Your order has been shipped.</p>
                        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <strong>Tracking Number:</strong> <span style="color: #e91e63;">${order.tracking_number || 'N/A'}</span><br>
                            <strong>Courier:</strong> Standard Shipping
                        </div>
                        <p>Estimated delivery is usually within 3-5 business days.</p>
                        <a href="${appUrl}/customer/orders" style="display: inline-block; padding: 10px 20px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Track Shipment</a>
                    </div>
                `;
                break;

            case 'delivered':
                subject = `🎁 Order Delivered! #${order._id.toString().substring(order._id.toString().length - 8)}`;
                htmlContent = `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                        <h2 style="color: #4CAF50;">Delivered!</h2>
                        <p>Hi ${customerName}, your order has been successfully delivered. We hope you love it!</p>
                        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <strong>Order ID:</strong> ${order._id}<br>
                        </div>
                        <p>Enjoying your purchase? Spread the word!</p>
                        <a href="${appUrl}/customer/orders" style="display: inline-block; padding: 10px 20px; background: #673ab7; color: white; text-decoration: none; border-radius: 5px;">Share Feedback</a>
                    </div>
                `;
                break;

            case 'cancelled':
                subject = `⚠️ Order Cancellation #${order._id.toString().substring(order._id.toString().length - 8)}`;
                htmlContent = `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                        <h2 style="color: #f44336;">Order Cancelled</h2>
                        <p>Hi ${customerName}, your order has been cancelled.</p>
                        <p>If you didn't request this or have any questions about your refund, please contact our support team.</p>
                        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <strong>Order ID:</strong> ${order._id}<br>
                        </div>
                    </div>
                `;
                break;

            default:
                return;
        }

        const mailOptions = {
            from: `"Collab Sync Support" <${process.env.EMAIL_USER || 'support@collabsync.com'}>`,
            to: customerEmail,
            subject: subject,
            html: htmlContent
        };

        // For development/demo, we log if credentials are missing
        if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'placeholder@gmail.com') {
            console.log(`[Email Service SIMULATED] Sending ${status} email to ${customerEmail}`);
            return { success: true, simulated: true };
        }

        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email Service] ${status} email sent: ${info.messageId}`);
        return { success: true, messageId: info.messageId };

    } catch (error) {
        console.error(`[Email Service] Failed to send ${status} email:`, error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendOrderStatusEmail
};
