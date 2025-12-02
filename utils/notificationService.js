// Notification Service - Centralized notification management
const { createNotification } = require('../controllers/notificationController');

// Notification Types Constants
const NOTIFICATION_TYPES = {
  // Campaign Notifications
  CAMPAIGN_CREATED: 'campaign_created',
  CAMPAIGN_STARTED: 'campaign_started',
  CAMPAIGN_ENDED: 'campaign_ended',
  CAMPAIGN_PROGRESS_UPDATED: 'campaign_progress_updated',

  // Collaboration Notifications
  BRAND_INVITE_SENT: 'brand_invite_sent',
  INFLUENCER_INVITE_RECEIVED: 'influencer_invite_received',
  REQUEST_ACCEPTED: 'request_accepted',
  REQUEST_REJECTED: 'request_rejected',
  APPLICATION_RECEIVED: 'application_received',

  // Content & Progress Notifications
  CONTENT_SUBMITTED: 'content_submitted',
  CONTENT_APPROVED: 'content_approved',
  CONTENT_REJECTED: 'content_rejected',

  // Payment Notifications
  PAYMENT_COMPLETED: 'payment_completed',
  PAYMENT_FAILED: 'payment_failed',

  // System Notifications
  SYSTEM_MAINTENANCE: 'system_maintenance',
  ACCOUNT_VERIFIED: 'account_verified'
};

// Status Constants
const NOTIFICATION_STATUS = {
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  SENT: 'sent',
  CAMPAIGN_ENDED: 'campaign_ended',
  CAMPAIGN_STARTED: 'campaign_started',
  PAYMENT_COMPLETED: 'payment_completed',
  CAMPAIGN_PROGRESS_UPDATED: 'campaign_progress_updated'
};

// Notification Service Functions
class NotificationService {

  // Campaign Notifications
  static async notifyCampaignCreated(brandId, campaignData) {
    await createNotification({
      recipientId: brandId,
      recipientType: 'brand',
      type: NOTIFICATION_TYPES.CAMPAIGN_CREATED,
      title: 'Campaign Created Successfully',
      body: `Your campaign "${campaignData.title}" has been created and is ready to accept applications.`,
      relatedId: campaignData._id,
      data: { campaignId: campaignData._id, campaignTitle: campaignData.title }
    });
  }

  static async notifyCampaignStarted(brandId, campaignData) {
    await createNotification({
      recipientId: brandId,
      recipientType: 'brand',
      type: NOTIFICATION_TYPES.CAMPAIGN_STARTED,
      title: 'Campaign Started',
      body: `Your campaign "${campaignData.title}" has started and is now active.`,
      relatedId: campaignData._id,
      data: { campaignId: campaignData._id, status: NOTIFICATION_STATUS.CAMPAIGN_STARTED }
    });
  }

  static async notifyCampaignEnded(brandId, campaignData) {
    await createNotification({
      recipientId: brandId,
      recipientType: 'brand',
      type: NOTIFICATION_TYPES.CAMPAIGN_ENDED,
      title: 'Campaign Ended',
      body: `Your campaign "${campaignData.title}" has ended successfully.`,
      relatedId: campaignData._id,
      data: { campaignId: campaignData._id, status: NOTIFICATION_STATUS.CAMPAIGN_ENDED }
    });
  }

  static async notifyCampaignProgressUpdated(brandId, campaignData, progress) {
    await createNotification({
      recipientId: brandId,
      recipientType: 'brand',
      type: NOTIFICATION_TYPES.CAMPAIGN_PROGRESS_UPDATED,
      title: 'Campaign Progress Updated',
      body: `Progress update for "${campaignData.title}": ${progress}% complete.`,
      relatedId: campaignData._id,
      data: {
        campaignId: campaignData._id,
        progress,
        status: NOTIFICATION_STATUS.CAMPAIGN_PROGRESS_UPDATED
      }
    });
  }

  // Collaboration Notifications
  static async notifyBrandInviteSent(brandId, influencerId, campaignData) {
    // Notify brand that invite was sent
    await createNotification({
      recipientId: brandId,
      recipientType: 'brand',
      type: NOTIFICATION_TYPES.BRAND_INVITE_SENT,
      title: 'Invitation Sent',
      body: `You have successfully invited an influencer to join "${campaignData.title}".`,
      relatedId: campaignData._id,
      data: {
        campaignId: campaignData._id,
        influencerId,
        status: NOTIFICATION_STATUS.SENT
      }
    });
  }

  static async notifyInfluencerInviteReceived(influencerId, brandData, campaignData) {
    // Notify influencer of new invite
    await createNotification({
      recipientId: influencerId,
      recipientType: 'influencer',
      senderId: brandData._id,
      senderType: 'brand',
      type: NOTIFICATION_TYPES.INFLUENCER_INVITE_RECEIVED,
      title: 'New Campaign Invitation',
      body: `${brandData.brandName || brandData.name} has invited you to collaborate on "${campaignData.title}".`,
      relatedId: campaignData._id,
      data: {
        campaignId: campaignData._id,
        brandId: brandData._id,
        brandName: brandData.brandName || brandData.name
      }
    });
  }

  static async notifyRequestAccepted(brandId, influencerId, campaignData, influencerName) {
    // Notify brand that request was accepted
    await createNotification({
      recipientId: brandId,
      recipientType: 'brand',
      type: NOTIFICATION_TYPES.REQUEST_ACCEPTED,
      title: 'Request Accepted',
      body: `${influencerName} has accepted your invitation to "${campaignData.title}".`,
      relatedId: campaignData._id,
      data: {
        campaignId: campaignData._id,
        influencerId,
        influencerName,
        status: NOTIFICATION_STATUS.ACCEPTED
      }
    });

    // Notify influencer that they were accepted
    await createNotification({
      recipientId: influencerId,
      recipientType: 'influencer',
      type: NOTIFICATION_TYPES.REQUEST_ACCEPTED,
      title: 'Application Accepted',
      body: `Congratulations! Your application for "${campaignData.title}" has been accepted.`,
      relatedId: campaignData._id,
      data: {
        campaignId: campaignData._id,
        brandId,
        status: NOTIFICATION_STATUS.ACCEPTED
      }
    });
  }

  static async notifyRequestRejected(brandId, influencerId, campaignData, influencerName) {
    // Notify influencer that request was rejected
    await createNotification({
      recipientId: influencerId,
      recipientType: 'influencer',
      type: NOTIFICATION_TYPES.REQUEST_REJECTED,
      title: 'Application Update',
      body: `Your application for "${campaignData.title}" was not selected at this time.`,
      relatedId: campaignData._id,
      data: {
        campaignId: campaignData._id,
        brandId,
        status: NOTIFICATION_STATUS.REJECTED
      }
    });
  }

  static async notifyApplicationReceived(brandId, influencerId, campaignData, influencerName) {
    // Notify brand of new application
    await createNotification({
      recipientId: brandId,
      recipientType: 'brand',
      type: NOTIFICATION_TYPES.APPLICATION_RECEIVED,
      title: 'New Application Received',
      body: `${influencerName} has applied to your campaign "${campaignData.title}".`,
      relatedId: campaignData._id,
      data: {
        campaignId: campaignData._id,
        influencerId,
        influencerName
      }
    });
  }

  // Content Notifications
  static async notifyContentSubmitted(brandId, influencerId, campaignData, contentData, influencerName) {
    await createNotification({
      recipientId: brandId,
      recipientType: 'brand',
      type: NOTIFICATION_TYPES.CONTENT_SUBMITTED,
      title: 'Content Submitted',
      body: `${influencerName} has submitted content for "${campaignData.title}".`,
      relatedId: campaignData._id,
      data: {
        campaignId: campaignData._id,
        influencerId,
        influencerName,
        contentId: contentData._id
      }
    });
  }

  static async notifyContentApproved(brandId, influencerId, campaignData, contentData, influencerName) {
    await createNotification({
      recipientId: influencerId,
      recipientType: 'influencer',
      type: NOTIFICATION_TYPES.CONTENT_APPROVED,
      title: 'Content Approved',
      body: `Your content for "${campaignData.title}" has been approved!`,
      relatedId: campaignData._id,
      data: {
        campaignId: campaignData._id,
        brandId,
        contentId: contentData._id,
        status: NOTIFICATION_STATUS.ACCEPTED
      }
    });
  }

  static async notifyContentRejected(brandId, influencerId, campaignData, contentData, influencerName, reason) {
    await createNotification({
      recipientId: influencerId,
      recipientType: 'influencer',
      type: NOTIFICATION_TYPES.CONTENT_REJECTED,
      title: 'Content Feedback',
      body: `Your content for "${campaignData.title}" needs revision. ${reason || 'Please check the requirements and resubmit.'}`,
      relatedId: campaignData._id,
      data: {
        campaignId: campaignData._id,
        brandId,
        contentId: contentData._id,
        status: NOTIFICATION_STATUS.REJECTED,
        reason
      }
    });
  }

  // Payment Notifications
  static async notifyPaymentCompleted(recipientId, recipientType, paymentData, campaignData) {
    const title = recipientType === 'brand' ? 'Payment Processed' : 'Payment Received';
    const body = recipientType === 'brand'
      ? `Payment of $${paymentData.amount} has been processed for "${campaignData.title}".`
      : `You have received payment of $${paymentData.amount} for "${campaignData.title}".`;

    await createNotification({
      recipientId,
      recipientType,
      type: NOTIFICATION_TYPES.PAYMENT_COMPLETED,
      title,
      body,
      relatedId: campaignData._id,
      data: {
        campaignId: campaignData._id,
        amount: paymentData.amount,
        transactionId: paymentData.transactionId,
        status: NOTIFICATION_STATUS.PAYMENT_COMPLETED
      }
    });
  }

  static async notifyPaymentFailed(recipientId, recipientType, paymentData, campaignData) {
    await createNotification({
      recipientId,
      recipientType,
      type: NOTIFICATION_TYPES.PAYMENT_FAILED,
      title: 'Payment Failed',
      body: `Payment of $${paymentData.amount} for "${campaignData.title}" could not be processed. Please try again.`,
      relatedId: campaignData._id,
      data: {
        campaignId: campaignData._id,
        amount: paymentData.amount,
        reason: paymentData.failureReason
      }
    });
  }
}

module.exports = {
  NotificationService,
  NOTIFICATION_TYPES,
  NOTIFICATION_STATUS
};