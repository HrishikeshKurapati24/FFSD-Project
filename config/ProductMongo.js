const { mongoose } = require('../models/mongoDB');

// Product Schema - for products that can be sold through campaigns
const productSchema = new mongoose.Schema({
    brand_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BrandInfo',
        required: [true, 'Brand ID is required']
    },
    campaign_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CampaignInfo',
        required: [true, 'Campaign ID is required']
    },
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        maxlength: [200, 'Product name cannot exceed 200 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    images: [{
        url: {
            type: String,
            match: [/^(https?:\/\/.*\.(jpg|jpeg|png|gif|webp)$|\/.*\.(jpg|jpeg|png|gif|webp)$)/, 'Please provide a valid image URL']
        },
        alt: {
            type: String,
            trim: true
        },
        is_primary: {
            type: Boolean,
            default: false
        }
    }],
    original_price: {
        type: Number,
        min: [0, 'Price cannot be negative']
    },
    campaign_price: {
        type: Number,
        min: [0, 'Campaign price cannot be negative'],
        validate: {
            validator: function (value) {
                return value <= this.original_price;
            },
            message: 'Campaign price cannot be higher than original price'
        }
    },
    discount_percentage: {
        type: Number,
        min: [0, 'Discount percentage cannot be negative'],
        max: [100, 'Discount percentage cannot exceed 100']
    },
    category: {
        type: String,
        trim: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    target_quantity: {
        type: Number,
        default: 0,
        min: [0, 'Target quantity cannot be negative']
    },
    sold_quantity: {
        type: Number,
        default: 0,
        min: [0, 'Sold quantity cannot be negative']
    },
    is_digital: {
        type: Boolean,
        default: false
    },
    delivery_info: {
        estimated_days: {
            type: Number,
            min: [0, 'Estimated delivery days cannot be negative']
        },
        shipping_cost: {
            type: Number,
            default: 0,
            min: [0, 'Shipping cost cannot be negative']
        },
        free_shipping_threshold: {
            type: Number,
            min: [0, 'Free shipping threshold cannot be negative']
        }
    },
    specifications: {
        type: Map,
        of: String
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'out_of_stock', 'discontinued'],
        default: 'active'
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BrandInfo',
        required: true
    },
    special_instructions: {
        type: String,
        trim: true,
        maxlength: [500, 'Special instructions cannot exceed 500 characters']
    }
}, {
    timestamps: true
});

// Campaign Content Schema - for influencer-created content with attached products
const campaignContentSchema = new mongoose.Schema({
    campaign_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CampaignInfo',
        required: [true, 'Campaign ID is required']
    },
    influencer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InfluencerInfo',
        required: [true, 'Influencer ID is required']
    },
    caption: {
        type: String,
        required: [true, 'Content caption is required'],
        trim: true,
        maxlength: [2200, 'Caption cannot exceed 2200 characters']
    },
    media_urls: [{
        url: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: ['image', 'video', 'gif'],
            required: true
        },
        original_name: String,
        thumbnail: String,
        duration: Number // for videos
    }],
    attached_products: [{
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
    }],
    hashtags: [{
        type: String,
        trim: true
    }],
    mentions: [{
        type: String,
        trim: true
    }],
    scheduled_at: {
        type: Date
    },
    published_at: {
        type: Date
    },
    status: {
        type: String,
        enum: ['draft', 'submitted', 'approved', 'rejected', 'published', 'scheduled'],
        default: 'draft'
    },
    brand_feedback: {
        type: String,
        trim: true,
        maxlength: [500, 'Brand feedback cannot exceed 500 characters']
    },
    special_instructions: {
        type: String,
        trim: true,
        maxlength: [500, 'Special instructions cannot exceed 500 characters']
    }
}, {
    timestamps: true
});

// Content Tracking Schema - for tracking user interactions with content
const contentTrackingSchema = new mongoose.Schema({
    content_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CampaignContent',
        required: [true, 'Content ID is required']
    },
    user_session_id: {
        type: String,
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer' // We'll need to create a Customer model later
    },
    action_type: {
        type: String,
        enum: ['view', 'click', 'add_to_cart', 'purchase', 'share', 'like', 'comment'],
        required: [true, 'Action type is required']
    },
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    },
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    },
    ip_address: {
        type: String
    },
    user_agent: {
        type: String
    },
    referrer: {
        type: String
    }
}, {
    timestamps: true
});

// Customer Schema - for tracking customer purchases and interactions
const customerSchema = new mongoose.Schema({
    // Link to authenticated customer identity (Customer from CustomerMongo.js) - optional
    customer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        index: true,
        default: null
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
    },
    phone: {
        type: String,
        trim: true,
        match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number']
    },
    name: {
        type: String,
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    preferences: {
        categories: [String],
        brands: [String],
        price_range: {
            min: { type: Number, min: 0 },
            max: { type: Number, min: 0 }
        }
    },
    total_purchases: {
        type: Number,
        default: 0,
        min: [0, 'Total purchases cannot be negative']
    },
    total_spent: {
        type: Number,
        default: 0,
        min: [0, 'Total spent cannot be negative']
    },
    last_purchase_date: {
        type: Date
    },
    is_verified: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },
    admin_notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Create indexes for better query performance
productSchema.index({ brand_id: 1, campaign_id: 1, status: 1 });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ campaign_price: 1 });

campaignContentSchema.index({ campaign_id: 1, influencer_id: 1, status: 1 });
campaignContentSchema.index({ status: 1, published_at: -1 });
campaignContentSchema.index({ is_featured: 1, published_at: -1 });

contentTrackingSchema.index({ content_id: 1, action_type: 1 });
contentTrackingSchema.index({ user_session_id: 1 });
contentTrackingSchema.index({ created_at: -1 });

// Create models
const Product = mongoose.model('Product', productSchema);
const CampaignContent = mongoose.model('CampaignContent', campaignContentSchema);
const ContentTracking = mongoose.model('ContentTracking', contentTrackingSchema);
// Use a distinct model name to avoid colliding with the main Customer model
const Customer = mongoose.models.ProductCustomer || mongoose.model('ProductCustomer', customerSchema);

module.exports = {
    Product,
    CampaignContent,
    ContentTracking,
    Customer
};