/**
 * Role-based page access map.
 * Key: route path  →  Value: array of roles that can access it.
 * 'superadmin' has access to everything.
 */
export const PAGE_ACCESS = {
    '/admin/dashboard': ['superadmin', 'community', 'finance', 'analyst'],
    '/admin/user_management': ['superadmin', 'community'],
    '/admin/feedback_and_moderation': ['superadmin', 'community'],
    '/admin/customer-management': ['superadmin', 'finance'],
    '/admin/payment_verification': ['superadmin', 'finance'],
    '/admin/advanced-analytics': ['superadmin', 'analyst'],
    '/admin/collaboration_monitoring': ['superadmin', 'analyst'],
    // Page list routes
    '/admin/brand-list': ['superadmin'],
    '/admin/influencer-list': ['superadmin'],
    '/admin/customer-list': ['superadmin'],
    // Analytics specific
    '/admin/brand-analytics': ['superadmin'],
    '/admin/campaign-analytics': ['superadmin'],
    '/admin/influencer-analytics': ['superadmin'],
    '/admin/product-analytics': ['superadmin'],
    '/admin/settings': ['superadmin'],
};
