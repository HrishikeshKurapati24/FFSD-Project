// config/SubscriptionMongo.js

const mongoose = require('mongoose');

// Subscription Plan Schema
const subscriptionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['Free', 'Basic', 'Premium']
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
    collaborationTools: { type: Boolean, default: false }
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
  usage: {
    campaignsUsed: { type: Number, default: 0 },
    influencersConnected: { type: Number, default: 0 },
    brandsConnected: { type: Number, default: 0 },
    storageUsedGB: { type: Number, default: 0 },
    uploadsThisMonth: { type: Number, default: 0 }
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
  paidAt: Date,
  cardDetails: {
    cardName: String,
    last4: String,
    brand: String,
    expiryMonth: Number,
    expiryYear: Number,
    encryptedCardNumber: String  // Encrypted full card number for auto-fill
  },
  billingAddress: String
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