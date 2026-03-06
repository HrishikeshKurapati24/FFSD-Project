const { mongoose } = require('../mongoDB');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["community_manager", 'financial_analyst', 'campaign_manager', "superadmin"], required: true },
    isActive: { type: Boolean, default: true },
    lastLogin: Date
}, { timestamps: true });

const adminActionLogSchema = new mongoose.Schema({
    admin_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    targetId: mongoose.Schema.Types.ObjectId,
    targetType: String,
    reason: String,
    metadata: mongoose.Schema.Types.Mixed,
    status: String,
    ip_address: String
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const AdminActionLog = mongoose.model('AdminActionLog', adminActionLogSchema);

module.exports = { User, AdminActionLog };
