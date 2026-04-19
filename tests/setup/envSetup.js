require('dotenv').config();

// Override for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';
process.env.MONGO_URI = process.env.MONGO_URI.replace('Collab_Sync_DB', 'CollabSync_Test');
process.env.RAZORPAY_KEY_ID = 'rzp_test_mock';
process.env.RAZORPAY_KEY_SECRET = 'mock_secret';
process.env.RAZORPAY_WEBHOOK_SECRET = 'mock_webhook_secret';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
process.env.ELASTICSEARCH_NODE = process.env.ELASTICSEARCH_NODE || 'http://localhost:9200';
