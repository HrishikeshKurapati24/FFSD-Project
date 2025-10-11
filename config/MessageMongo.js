const { mongoose } = require('../models/mongoDB');

const messageSchema = new mongoose.Schema({
    brand_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BrandInfo',
        required: true
    },
    influencer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InfluencerInfo',
        required: true
    },
    campaign_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CampaignInfo',
        required: true
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    }
}, { timestamps: true });

messageSchema.index({ brand_id: 1, influencer_id: 1, campaign_id: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = { Message };


