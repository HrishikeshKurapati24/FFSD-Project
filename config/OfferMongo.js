const mongoose = require('mongoose');

const OfferSchema = new mongoose.Schema({
    brand_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BrandInfo',
        required: true
    },
    description: {
        type: String,
        required: true,
        maxlength: 500
    },
    start_date: {
        type: Date,
        required: true
    },
    end_date: {
        type: Date,
        required: true
    },
    eligibility: {
        type: String,
        required: true,
        maxlength: 200
    },
    offer_percentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    offer_details: {
        type: String,
        required: true,
        maxlength: 500
    },
    status: {
        type: String,
        enum: ['active', 'expired', 'cancelled'],
        default: 'active'
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Update the updated_at timestamp before saving
OfferSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});

const Offer = mongoose.model('Offer', OfferSchema);

module.exports = Offer;