const { mongoose } = require('../mongoDB');

const subscriptionPlanSchema = new mongoose.Schema({
    name: { type: String, required: true },
    version: String,
    billingCycle: { type: String, required: true },
    price: { type: Number, required: true },
    userType: { type: String, required: true },
    features: [String],
    limits: mongoose.Schema.Types.Mixed,
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const userSubscriptionSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    userType: { type: String, required: true },
    subscription_id: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
    status: { type: String, required: true },
    billingCycle: String,
    autoRenew: { type: Boolean, default: true },
    providerSubscriptionId: String,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: { type: Boolean, default: false },
    start_date: Date,
    end_date: Date
}, { timestamps: true });

const subscriptionPaymentSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    userType: { type: String, required: true },
    plan_id: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
    amount: { type: Number, required: true },
    status: { type: String, required: true },
    paymentProvider: String,
    paymentMethodId: String,
    providerPaymentId: String,
    payment_date: Date
}, { timestamps: true });

const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
const UserSubscription = mongoose.model('UserSubscription', userSubscriptionSchema);
const SubscriptionPayment = mongoose.model('SubscriptionPayment', subscriptionPaymentSchema);

module.exports = { SubscriptionPlan, UserSubscription, SubscriptionPayment };
