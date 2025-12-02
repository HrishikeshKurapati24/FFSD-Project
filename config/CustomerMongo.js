const { mongoose } = require('../models/mongoDB');
const bcrypt = require('bcrypt');

// Schema for Customer
const CustomerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters long'],
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long'],
        select: false // Don't return password by default in queries
    },
    phone: {
        type: String,
        trim: true,
        match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number']
    },
    preferences: {
        categories: {
            type: [String],
            default: []
        },
        brands: {
            type: [String],
            default: []
        },
        price_range: {
            min: {
                type: Number,
                default: 0
            },
            max: {
                type: Number,
                default: 10000
            }
        }
    },
    total_purchases: {
        type: Number,
        default: 0
    },
    total_spent: {
        type: Number,
        default: 0
    },
    last_purchase_date: {
        type: Date,
        default: null
    },
    is_verified: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
CustomerSchema.pre('save', async function (next) {
    try {
        this.updatedAt = Date.now();

        // If password is new or modified, hash it before saving
        if (this.isModified('password')) {
            const saltRounds = 10;
            this.password = await bcrypt.hash(this.password, saltRounds);
        }

        next();
    } catch (err) {
        next(err);
    }
});

// Handle findOneAndUpdate / findByIdAndUpdate flows where password may be changed
CustomerSchema.pre('findOneAndUpdate', async function (next) {
    try {
        const update = this.getUpdate();
        if (!update) return next();

        // support both direct set and $set
        const password = update.password || (update.$set && update.$set.password);
        if (password) {
            const saltRounds = 10;
            const hashed = await bcrypt.hash(password, saltRounds);
            if (update.password) update.password = hashed;
            if (update.$set && update.$set.password) update.$set.password = hashed;
            this.setUpdate(update);
        }

        // always update updatedAt
        if (update.$set) {
            update.$set.updatedAt = Date.now();
        } else {
            update.updatedAt = Date.now();
        }

        this.setUpdate(update);
        next();
    } catch (err) {
        next(err);
    }
});

// Create and export Customer model (check if already compiled to avoid overwrite error)
const Customer = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);

module.exports = {
    Customer,
    CustomerSchema
};
