const { mongoose } = require('../mongoDB');

const feedbackSchema = new mongoose.Schema({
    createdById: { type: mongoose.Schema.Types.ObjectId, required: true },
    createdByType: { type: String, required: true },
    subject: { type: String, required: true },
    feedbackType: { type: String, required: true },
    messages: [{
        senderId: mongoose.Schema.Types.ObjectId,
        senderType: String,
        message: String,
        attachments: [String],
        createdAt: { type: Date, default: Date.now }
    }],
    priority: String,
    status: String
}, { timestamps: true });

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = { Feedback };
