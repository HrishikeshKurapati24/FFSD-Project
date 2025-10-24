// config/SubscriptionMongo.js

const mongoose = require('mongoose');

// Subscription Plan Schema
const subscriptionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['Free', 'Basic', 'Pro', 'Premium', 'Enterprise']
  },
  userType: {
    type: String,
    required: true,
    enum: ['brand', 'influencer']
  },
  price: {
    monthly: { type: Number, required: true },
    yearly: { type: Number, required: true }
  },
  features: {
    maxCampaigns: { type: Number, default: -1 }, // -1 for unlimited
    maxInfluencers: { type: Number, default: -1 },
    maxBrands: { type: Number, default: -1 },
    analytics: { type: Boolean, default: false },
    advancedAnalytics: { type: Boolean, default: false },
    prioritySupport: { type: Boolean, default: false },
    customBranding: { type: Boolean, default: false },
    apiAccess: { type: Boolean, default: false },
    whiteLabel: { type: Boolean, default: false },
    dedicatedManager: { type: Boolean, default: false },
    bulkOperations: { type: Boolean, default: false },
    exportData: { type: Boolean, default: false },
    socialMediaIntegration: { type: Boolean, default: false },
    contentLibrary: { type: Boolean, default: false },
    collaborationTools: { type: Boolean, default: false }
  },
  limits: {
    storageGB: { type: Number, default: 1 },
    monthlyUploads: { type: Number, default: 10 },
    teamMembers: { type: Number, default: 1 }
  },
  isActive: { type: Boolean, default: true },
  description: String,
  popularBadge: { type: Boolean, default: false }
}, {
  timestamps: true
});

// User Subscription Schema
const userSubscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'userType'
  },
  userType: {
    type: String,
    required: true,
    enum: ['BrandInfo', 'InfluencerInfo']
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired', 'pending'],
    default: 'pending'
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'paypal', 'bank_transfer', 'stripe'],
    default: 'credit_card'
  },
  paymentDetails: {
    transactionId: String,
    paymentGateway: String,
    lastFourDigits: String
  },
  autoRenew: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Payment History Schema
const paymentHistorySchema = new mongoose.Schema({
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserSubscription',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'userType'
  },
  userType: {
    type: String,
    required: true,
    enum: ['BrandInfo', 'InfluencerInfo']
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'pending', 'refunded'],
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'paypal', 'bank_transfer', 'stripe']
  },
  transactionId: String,
  paymentGateway: String,
  description: String,
  invoiceUrl: String,
  paidAt: Date
}, {
  timestamps: true
});

// Create models
const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
const UserSubscription = mongoose.model('UserSubscription', userSubscriptionSchema);
const PaymentHistory = mongoose.model('PaymentHistory', paymentHistorySchema);

module.exports = {
  SubscriptionPlan,
  UserSubscription,
  PaymentHistory
};