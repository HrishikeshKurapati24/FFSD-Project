// InfluencerDashboard.js - ES Module with exported functions for React integration

import { API_BASE_URL } from '../services/api.js';

/**
 * Fetch collaboration details by ID
 */
export async function getCollabDetails(collabId) {
  try {
    const response = await fetch(`${API_BASE_URL}/influencer/collab/${collabId}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Network response was not ok' }));
      throw new Error(errorData.message || 'Failed to fetch collaboration details');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching collaboration details:', error);
    throw error;
  }
}

/**
 * Update collaboration progress and metrics
 */
export async function updateCollabProgress({ collabId, progress, reach, clicks, performanceScore, conversions, engagementRate, impressions, revenue, roi }) {
  try {
    const response = await fetch(`${API_BASE_URL}/influencer/collab/${collabId}/update-progress`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        progress: parseInt(progress),
        reach: parseInt(reach || 0),
        clicks: parseInt(clicks || 0),
        performance_score: parseFloat(performanceScore || 0),
        conversions: parseInt(conversions || 0),
        engagement_rate: parseFloat(engagementRate || 0),
        impressions: parseInt(impressions || 0),
        revenue: parseFloat(revenue || 0),
        roi: parseFloat(roi || 0)
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update progress' }));
      throw new Error(errorData.message || 'Failed to update progress');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating collaboration progress:', error);
    throw error;
  }
}

/**
 * Load campaign products for content creation
 */
export async function loadCampaignProducts(campaignId) {
  try {
    const response = await fetch(`${API_BASE_URL}/influencer/campaigns/${campaignId}/products`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load campaign products');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error loading campaign products:', error);
    throw error;
  }
}

/**
 * Create content for a campaign
 */
export async function createContent(formData) {
  try {
    formData.append('action', 'submit_for_review');

    const response = await fetch(`${API_BASE_URL}/influencer/content/create`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create content');
    }

    return data;
  } catch (error) {
    console.error('Error creating content:', error);
    throw error;
  }
}

/**
 * Accept brand invite
 */
export async function acceptBrandInvite(inviteId) {
  try {
    const response = await fetch(`${API_BASE_URL}/influencer/brand-invites/${inviteId}/accept`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to accept invitation');
    }

    return data;
  } catch (error) {
    console.error('Error accepting brand invite:', error);
    throw error;
  }
}

/**
 * Decline brand invite
 */
export async function declineBrandInvite(inviteId) {
  try {
    const response = await fetch(`${API_BASE_URL}/influencer/brand-invites/${inviteId}/decline`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to decline invitation');
    }

    return data;
  } catch (error) {
    console.error('Error declining brand invite:', error);
    throw error;
  }
}

/**
 * Cancel sent request
 */
export async function cancelSentRequest(requestId) {
  try {
    const response = await fetch(`${API_BASE_URL}/influencer/sent-requests/${requestId}/cancel`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to cancel request');
    }

    return data;
  } catch (error) {
    console.error('Error cancelling sent request:', error);
    throw error;
  }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return { success: true };
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return { success: true };
    } catch (fallbackError) {
      document.body.removeChild(textArea);
      throw new Error('Failed to copy to clipboard');
    }
  }
}

/**
 * Check for approved content
 */
export async function checkApprovedContent() {
  try {
    const response = await fetch(`${API_BASE_URL}/influencer/content/approved`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return { success: false, content: [] };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking approved content:', error);
    return { success: false, content: [] };
  }
}

/**
 * Update content status to published
 */
export async function updateContentStatus(contentId, externalPostUrl = null) {
  try {
    const body = { status: 'published' };
    if (externalPostUrl) {
      body.externalPostUrl = externalPostUrl;
    }

    const response = await fetch(`${API_BASE_URL}/influencer/content/${contentId}/publish`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating content status:', error);
    throw error;
  }
}
