const { Customer } = require('../../models/CustomerMongo');
const { getRazorpayConfig } = require('../payment/razorpayGatewayService');

const sanitizeCustomer = (customerDoc) => {
    const obj = customerDoc?.toObject ? customerDoc.toObject() : customerDoc;
    if (!obj) return null;
    delete obj.password;
    return obj;
};

const getCustomerById = async (customerId) => {
    try {
        const customer = await Customer.findById(customerId).select('-password');
        return customer;
    } catch (error) {
        throw new Error(`Failed to get customer: ${error.message}`);
    }
};

const getCustomerByEmail = async (email, includePassword = false) => {
    try {
        const query = Customer.findOne({ email: email.toLowerCase() });
        if (includePassword) {
            query.select('+password');
        }
        const customer = await query;
        return customer;
    } catch (error) {
        throw new Error(`Failed to get customer by email: ${error.message}`);
    }
};

const updateCustomerProfile = async (customerId, updateData) => {
    try {
        const allowedFields = ['name', 'phone', 'location', 'preferences', 'customerAccountDetails'];
        const filteredData = {};

        for (const key of allowedFields) {
            if (updateData[key] !== undefined) {
                filteredData[key] = updateData[key];
            }
        }

        const updatedCustomer = await Customer.findByIdAndUpdate(
            customerId,
            { $set: filteredData },
            { new: true }
        ).select('-password');

        return updatedCustomer;
    } catch (error) {
        throw new Error(`Failed to update customer profile: ${error.message}`);
    }
};

const updatePurchaseHistory = async (customerId, amount) => {
    try {
        const customer = await Customer.findByIdAndUpdate(
            customerId,
            {
                $inc: { total_purchases: 1, total_spent: amount },
                $set: { last_purchase_date: new Date() }
            },
            { new: true }
        ).select('-password');

        return customer;
    } catch (error) {
        throw new Error(`Failed to update purchase history: ${error.message}`);
    }
};

const deleteCustomer = async (customerId) => {
    try {
        const customer = await Customer.findByIdAndDelete(customerId);
        return customer;
    } catch (error) {
        throw new Error(`Failed to delete customer: ${error.message}`);
    }
};

const isCustomerPaymentProfileComplete = (customerDoc) => Boolean(
    customerDoc?.paymentProfile?.isComplete
);

const formatPaymentProfile = (customerDoc) => {
    const razorpayConfig = getRazorpayConfig();
    const profileComplete = isCustomerPaymentProfileComplete(customerDoc);

    return {
        hasSavedPaymentMethod: Boolean(customerDoc?.razorpay?.defaultPaymentMethodId || customerDoc?.paymentProfile?.cardLast4),
        canMakePayments: Boolean(razorpayConfig.enabled),
        profileComplete,
        requiresPaymentProfileForCheckout: false,
        razorpayCustomerId: customerDoc?.razorpay?.customerId || null,
        razorpayKeyId: razorpayConfig.keyId,
        paymentMethodSummary: {
            cardBrand: customerDoc?.paymentProfile?.cardBrand || null,
            cardLast4: customerDoc?.paymentProfile?.cardLast4 || null
        },
        paymentProfile: {
            billingName: customerDoc?.paymentProfile?.billingName || '',
            billingEmail: customerDoc?.paymentProfile?.billingEmail || '',
            billingPhone: customerDoc?.paymentProfile?.billingPhone || '',
            billingAddress: {
                line1: customerDoc?.paymentProfile?.billingAddress?.line1 || '',
                line2: customerDoc?.paymentProfile?.billingAddress?.line2 || '',
                city: customerDoc?.paymentProfile?.billingAddress?.city || '',
                state: customerDoc?.paymentProfile?.billingAddress?.state || '',
                postalCode: customerDoc?.paymentProfile?.billingAddress?.postalCode || '',
                country: customerDoc?.paymentProfile?.billingAddress?.country || 'US'
            }
        },
        customerAccountDetails: {
            accountHolderName: customerDoc?.customerAccountDetails?.accountHolderName || '',
            defaultShippingAddress: customerDoc?.customerAccountDetails?.defaultShippingAddress || '',
            preferredCurrency: customerDoc?.customerAccountDetails?.preferredCurrency || 'USD'
        }
    };
};

const getCustomerProfileWithPayment = async (customerId) => {
    const customer = await Customer.findById(customerId).select('-password').lean();
    if (!customer) {
        throw new Error('Customer not found');
    }
    return {
        customer,
        payment: formatPaymentProfile(customer)
    };
};

const createCustomerPaymentSetupOrder = async (customerId) => {
    const customer = await Customer.findById(customerId);
    if (!customer) {
        throw new Error('Customer not found');
    }

    const razorpayConfig = getRazorpayConfig();
    if (!razorpayConfig.enabled) {
        throw new Error('Razorpay is not configured on server');
    }

    const setupOrderId = `setup_profile_${Date.now()}`;
    customer.razorpay = {
        ...(customer.razorpay || {}),
        lastSetupOrderId: setupOrderId
    };
    await customer.save();

    return {
        setupOrderId,
        razorpayKeyId: razorpayConfig.keyId
    };
};

const saveCustomerPaymentMethod = async (customerId, payload = {}) => {
    const {
        paymentMethodId,
        setupOrderId,
        cardDetails = {},
        billingDetails = {},
        customerAccountDetails = {},
        profileUpdates = {}
    } = payload;

    const customer = await Customer.findById(customerId);
    if (!customer) {
        throw new Error('Customer not found');
    }

    if (profileUpdates?.name) customer.name = profileUpdates.name;
    if (profileUpdates?.phone !== undefined) customer.phone = profileUpdates.phone;
    if (profileUpdates?.location !== undefined) customer.location = profileUpdates.location;
    const address = billingDetails?.address || {};
    const cardNumber = String(cardDetails?.cardNumber || '').replace(/\D/g, '');
    const cardLast4 = cardNumber ? cardNumber.slice(-4) : (customer.paymentProfile?.cardLast4 || '');
    const cardBrand = cardDetails?.network || customer.paymentProfile?.cardBrand || '';
    const billingName = billingDetails?.name || customer.paymentProfile?.billingName || customer.name || '';
    const billingEmail = billingDetails?.email || customer.paymentProfile?.billingEmail || customer.email;
    const isComplete = Boolean(billingName && billingEmail);

    customer.razorpay = {
        ...(customer.razorpay || {}),
        defaultPaymentMethodId: paymentMethodId || customer?.razorpay?.defaultPaymentMethodId || null,
        paymentMethodConfigured: isComplete,
        lastSetupOrderId: setupOrderId || customer?.razorpay?.lastSetupOrderId || null
    };

    customer.paymentProfile = {
        billingName,
        billingEmail,
        billingPhone: billingDetails?.phone || customer.paymentProfile?.billingPhone || customer.phone || '',
        billingAddress: {
            line1: address.line1 || customer.paymentProfile?.billingAddress?.line1 || '',
            line2: address.line2 || customer.paymentProfile?.billingAddress?.line2 || '',
            city: address.city || customer.paymentProfile?.billingAddress?.city || '',
            state: address.state || customer.paymentProfile?.billingAddress?.state || '',
            postalCode: address.postal_code || address.postalCode || customer.paymentProfile?.billingAddress?.postalCode || '',
            country: address.country || customer.paymentProfile?.billingAddress?.country || 'US'
        },
        cardBrand,
        cardLast4,
        isComplete,
        completedAt: isComplete ? new Date() : customer.paymentProfile?.completedAt
    };

    customer.customerAccountDetails = {
        accountHolderName: customerAccountDetails?.accountHolderName || customer.customerAccountDetails?.accountHolderName || customer.name || '',
        defaultShippingAddress: customerAccountDetails?.defaultShippingAddress || customer.customerAccountDetails?.defaultShippingAddress || '',
        preferredCurrency: customerAccountDetails?.preferredCurrency || customer.customerAccountDetails?.preferredCurrency || 'USD'
    };

    await customer.save();

    return {
        customer: sanitizeCustomer(customer),
        payment: formatPaymentProfile(customer)
    };
};

module.exports = {
    getCustomerById,
    getCustomerByEmail,
    updateCustomerProfile,
    updatePurchaseHistory,
    deleteCustomer,
    isCustomerPaymentProfileComplete,
    getCustomerProfileWithPayment,
    createCustomerPaymentSetupOrder,
    saveCustomerPaymentMethod
};
