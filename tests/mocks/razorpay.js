const razorpayMock = {
    orders: {
        create: jest.fn().mockImplementation((payload) => Promise.resolve({
            id: 'order_' + Math.random().toString(36).substr(2, 9),
            amount: payload.amount,
            currency: payload.currency || 'INR',
            receipt: payload.receipt,
            status: 'created',
            notes: payload.notes || {}
        }))
    },
    payments: {
        fetch: jest.fn().mockImplementation((paymentId) => Promise.resolve({
            id: paymentId,
            status: 'captured',
            amount: 10000,
            order_id: 'order_123'
        }))
    }
};

module.exports = razorpayMock;
