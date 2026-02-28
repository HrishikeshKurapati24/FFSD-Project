const customerShoppingService = require('../../services/customer/customerShoppingService');

class CustomerShoppingController {
    static async getAllCampaigns(req, res) {
        try {
            const result = await customerShoppingService.getAllCampaignsData();
            return res.json(result);
        } catch (error) {
            console.error('Error fetching all campaigns:', error);
            return res.status(500).json({ message: 'Error loading campaigns', error: error.message });
        }
    }

    static async getProductDetails(req, res) {
        try {
            const product = await customerShoppingService.getProductDetailsData(req.params.productId);
            return res.json({ success: true, product });
        } catch (error) {
            console.error('Error fetching product details:', error);
            if (error.message.includes('not found')) {
                return res.status(404).json({ success: false, message: error.message });
            }
            if (error.message.includes('not available') || error.message.includes('not active')) {
                return res.status(403).json({ success: false, message: error.message });
            }
            return res.status(500).json({ success: false, message: 'Error fetching product details' });
        }
    }

    static async getCampaignShoppingPage(req, res) {
        try {
            const responsePayload = await customerShoppingService.getCampaignShoppingPageData(req.params.campaignId);
            return res.json({ success: true, ...responsePayload });
        } catch (error) {
            console.error('[Customer] Error fetching campaign shopping page:', error);
            if (error.message.includes('not found')) {
                return res.status(404).json({ message: error.message });
            }
            if (error.message.includes('not active')) {
                return res.status(403).json({ message: error.message });
            }
            return res.status(500).json({
                message: 'Error loading campaign page',
                error: process.env.NODE_ENV === 'development' ? error : {}
            });
        }
    }

    static async getCartPage(req, res) {
        try {
            const result = await customerShoppingService.getCartPageData(req.session?.cart);
            return res.json(result);
        } catch (error) {
            console.error('Error rendering cart:', error);
            return res.status(500).json({ message: 'Error loading cart', error: process.env.NODE_ENV === 'development' ? error : {} });
        }
    }

    static async addToCart(req, res) {
        try {
            const { productId, quantity = 1 } = req.body;
            if (!productId) return res.status(400).json({ success: false, message: 'productId required' });

            if (!req.session.cart) req.session.cart = [];
            req.session.cart = await customerShoppingService.addToCartLogic(req.session.cart, productId, quantity);

            return res.json({ success: true, message: 'Added to cart', cartCount: req.session.cart.reduce((s, i) => s + i.quantity, 0) });
        } catch (error) {
            console.error('Error adding to cart:', error);
            if (error.message.includes('unavailable') || error.message.includes('Insufficient stock')) {
                return res.status(400).json({ success: false, message: error.message });
            }
            return res.status(500).json({ success: false, message: 'Error adding to cart' });
        }
    }

    static async removeFromCart(req, res) {
        try {
            const { productId } = req.body;
            if (!productId) return res.status(400).json({ success: false, message: 'productId required' });

            const trimmedProductId = productId.toString().trim();
            req.session.cart = (req.session.cart || []).filter(i => i.productId !== trimmedProductId);

            return res.json({ success: true, message: 'Removed from cart' });
        } catch (error) {
            console.error('Error removing from cart:', error);
            return res.status(500).json({ success: false, message: 'Error removing from cart' });
        }
    }

    static async checkoutCart(req, res) {
        try {
            const { customerInfo, paymentInfo, cart: cartFromBody, referralCode } = req.body;
            const cart = Array.isArray(cartFromBody) && cartFromBody.length > 0 ? cartFromBody : (Array.isArray(req.session?.cart) ? req.session.cart : []);
            const authenticatedCustomerId = (req.session?.user?.userType === 'customer' && req.session?.user?.id)
                ? req.session.user.id
                : (req.user?.userType === 'customer' && req.user?.id ? req.user.id : null);

            const result = await customerShoppingService.checkoutCartLogic(cart, customerInfo, referralCode, authenticatedCustomerId);
            req.session.cart = []; // clear cart after successful checkout

            return res.json({ success: true, ...result });
        } catch (error) {
            console.error('Error during checkout:', error);
            if (error.message.includes('empty') || error.message.includes('required') || error.message.includes('unavailable') || error.message.includes('Insufficient stock')) {
                return res.status(400).json({ success: false, message: error.message });
            }
            return res.status(500).json({ success: false, message: 'Checkout failed' });
        }
    }

    static async getBrandProfileForCustomer(req, res) {
        try {
            const brand = await customerShoppingService.getBrandProfileForCustomer(req.params.brandId);
            return res.json({ success: true, brand });
        } catch (error) {
            console.error('Error fetching brand profile for customer:', error);
            return res.status(error.message.includes('found') ? 404 : 500).json({
                success: false,
                message: error.message
            });
        }
    }

    static async getInfluencerProfileForCustomer(req, res) {
        try {
            const influencer = await customerShoppingService.getInfluencerProfileForCustomer(req.params.influencerId);
            return res.json({ success: true, influencer });
        } catch (error) {
            console.error('Error fetching influencer profile for customer:', error);
            return res.status(error.message.includes('found') ? 404 : 500).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = CustomerShoppingController;