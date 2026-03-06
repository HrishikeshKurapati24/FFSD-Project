const { mongoose } = require('../mongoDB');

const campaignPaymentSchema = new mongoose.Schema({
    campaign_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
    brand_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
    influencer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Influencer', required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["pending", "processing", "completed", "failed"] },
    payment_date: { type: Date, required: true },
    split_percentage: { type: String, enum: ["60/40", "70/30", "50/50"] },
    type: { type: String, enum: ["bonus", "firsthalf", "secondhalf", "fullpayment"] },
    paymentProvider: String,
    paymentMethodId: String,
    providerPaymentId: String
}, { timestamps: true });

const CampaignPayment = mongoose.model('CampaignPayment', campaignPaymentSchema);

module.exports = { CampaignPayment };
