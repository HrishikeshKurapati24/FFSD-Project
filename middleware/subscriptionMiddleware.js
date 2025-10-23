const { SubscriptionService } = require('../models/brandModel');

/**
 * Middleware to check subscription limits before allowing certain actions
 * @param {string} action - The action to check (create_campaign, connect_influencer, connect_brand, etc.)
 * @returns {Function} Express middleware function
 */
const checkSubscriptionLimit = (action) => {
    return async (req, res, next) => {
        try {
            const userId = req.session.user.id;
            const userType = req.session.user.role;
            
            if (!userId || !userType) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            // Check subscription limits
            const limitCheck = await SubscriptionService.checkSubscriptionLimit(userId, userType, action);
            
            if (!limitCheck.allowed) {
                // For API requests, return JSON
                if (req.xhr || req.headers.accept.includes('application/json')) {
                    return res.status(400).json({
                        success: false,
                        message: `Subscription limit reached: ${limitCheck.reason}. Please upgrade your plan.`,
                        showUpgradeLink: true,
                        upgradeUrl: '/subscription/manage'
                    });
                }
                
                // For form submissions, render with error
                return res.status(400).render(req.originalUrl.includes('brand') ? 'brand/Create_collab' : 'error', {
                    error: `Subscription limit reached: ${limitCheck.reason}. Please upgrade your plan to continue.`,
                    formData: req.body,
                    showUpgradeLink: true
                });
            }

            // Limit check passed, continue to next middleware
            next();
        } catch (error) {
            console.error('Subscription limit check error:', error);
            // Continue with request if subscription check fails (fallback)
            next();
        }
    };
};

/**
 * Middleware to update subscription usage after successful operations
 * @param {string} usageType - The type of usage to increment (campaignsUsed, influencersConnected, brandsConnected, etc.)
 * @param {number} amount - Amount to increment (default: 1)
 * @returns {Function} Express middleware function
 */
const updateSubscriptionUsage = (usageType, amount = 1) => {
    return async (req, res, next) => {
        try {
            const userId = req.session.user.id;
            const userType = req.session.user.role;
            
            if (userId && userType) {
                const usageUpdate = {};
                usageUpdate[usageType] = amount;
                
                await SubscriptionService.updateUsage(userId, userType, usageUpdate);
            }
        } catch (error) {
            console.error('Error updating subscription usage:', error);
            // Don't fail the request if usage update fails
        }
        
        next();
    };
};

/**
 * Get current subscription information for a user
 * @param {string} userId - User ID
 * @param {string} userType - User type (brand/influencer)
 * @returns {Object} Subscription information
 */
const getCurrentSubscription = async (userId, userType) => {
    try {
        return await SubscriptionService.getUserSubscription(userId, userType);
    } catch (error) {
        console.error('Error getting current subscription:', error);
        return null;
    }
};

/**
 * Check if user has reached their subscription limits
 * @param {string} userId - User ID
 * @param {string} userType - User type (brand/influencer)
 * @param {string} action - Action to check
 * @returns {Object} Limit check result
 */
const checkLimits = async (userId, userType, action) => {
    try {
        return await SubscriptionService.checkSubscriptionLimit(userId, userType, action);
    } catch (error) {
        console.error('Error checking subscription limits:', error);
        return { allowed: true }; // Allow by default if check fails
    }
};

module.exports = {
    checkSubscriptionLimit,
    updateSubscriptionUsage,
    getCurrentSubscription,
    checkLimits
};
