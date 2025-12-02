// Brand Dashboard Utility Functions - ES Module
// These functions are designed to work with React components
import { API_BASE_URL } from '../services/api';

/**
 * Activate a campaign
 * @param {string} campaignId - The campaign ID to activate
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export async function activateCampaign(campaignId) {
  try {
    if (!campaignId) {
      throw new Error('Campaign ID is required');
    }

    const response = await fetch(`${API_BASE_URL}/brand/campaigns/${campaignId}/activate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include'
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // Handle both 'message' and 'error' fields in error response
      const errorMessage = data.message || data.error || `Failed to activate campaign (${response.status})`;
      throw new Error(errorMessage);
    }

    // Check if response indicates success
    if (!data.success) {
      const errorMessage = data.message || data.error || 'Failed to activate campaign';
      throw new Error(errorMessage);
    }

    return {
      success: true,
      message: data.message || 'Campaign activated successfully'
    };
  } catch (error) {
    console.error('Error activating campaign:', error);
    throw error;
  }
}

/**
 * Load campaign content for review
 * @param {string} campaignId - The campaign ID
 * @returns {Promise<{success: boolean, content: Array, campaignName?: string}>}
 */
export async function loadCampaignContent(campaignId) {
  try {
    const response = await fetch(`${API_BASE_URL}/brand/campaigns/${campaignId}/pending-content`, {
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to load campaign content');
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to load campaign content');
    }

    return {
      success: true,
      content: data.content || [],
      campaignName: data.campaignName || ''
    };
  } catch (error) {
    console.error('Error loading campaign content:', error);
    throw error;
  }
}

/**
 * View campaign details
 * @param {string} campaignId - The campaign ID
 * @returns {Promise<Object>} Campaign details object
 */
export async function viewCampaignDetails(campaignId) {
  try {
    if (!campaignId) {
      throw new Error('Invalid campaign ID');
    }

    const response = await fetch(`${API_BASE_URL}/brand/campaigns/${campaignId}/details`, {
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Failed to fetch campaign details');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching campaign details:', error);
    throw error;
  }
}

/**
 * End a campaign
 * @param {string} campaignId - The campaign ID to end
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export async function endCampaign(campaignId) {
  try {
    const response = await fetch(`${API_BASE_URL}/brand/campaigns/${campaignId}/end`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to end campaign');
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Unknown error');
    }

    return {
      success: true,
      message: data.message || 'Campaign ended successfully!'
    };
  } catch (error) {
    console.error('Error ending campaign:', error);
    throw error;
  }
}

/**
 * Review content (approve or reject)
 * @param {string} contentId - The content ID to review
 * @param {string} action - 'approve' or 'reject'
 * @param {string} feedback - Feedback message
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export async function reviewContent(contentId, action, feedback) {
  try {
    const response = await fetch(`${API_BASE_URL}/brand/content/${contentId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: action,
        feedback: feedback
      }),
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to review content');
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Unknown error');
    }

    return {
      success: true,
      message: data.message || `Content ${action}d successfully!`
    };
  } catch (error) {
    console.error('Error reviewing content:', error);
    throw error;
  }
}
