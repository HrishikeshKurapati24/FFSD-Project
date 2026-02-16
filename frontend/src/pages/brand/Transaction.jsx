import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from '../../styles/brand/transaction.module.css';
import { API_BASE_URL } from '../../services/api';
import { useExternalAssets } from '../../hooks/useExternalAssets';
import BrandNavigation from '../../components/brand/BrandNavigation';
import TransactionAlerts from '../../components/brand/transaction/TransactionAlerts';
import CampaignInfoSection from '../../components/brand/transaction/CampaignInfoSection';
import CampaignProductsSection from '../../components/brand/transaction/CampaignProductsSection';
import InfluencerInfoSection from '../../components/brand/transaction/InfluencerInfoSection';
import CampaignCompletionForm from '../../components/brand/transaction/CampaignCompletionForm';
import ProductDetailsForm from '../../components/brand/transaction/ProductDetailsForm';
import PaymentFormFields from '../../components/brand/transaction/PaymentFormFields';
import DeliverablesSection from '../../components/brand/createCampaign/DeliverablesSection';

const EXTERNAL_ASSETS = {
    styles: [
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
    ]
};

const Transaction = () => {
    useExternalAssets(EXTERNAL_ASSETS);
    const navigate = useNavigate();
    const { requestId1, requestId2 } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // Transaction data state
    const [transactionData, setTransactionData] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        amount: '',
        paymentMethod: '',
        // Campaign completion fields (only when allowComplete is true)
        objectives: '',
        startDate: '',
        endDate: '',
        targetAudience: '',
        // Product fields (only when allowComplete is true)
        prodName: '',
        prodDescription: '',
        originalPrice: '',
        campaignPrice: '',
        category: '',
        targetQty: '',
        productImage: null,
        // Payment method specific fields
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardHolder: '',
        accountNumber: '',
        routingNumber: '',
        bankName: ''
    });

    const [formErrors, setFormErrors] = useState({});
    const [productImagePreview, setProductImagePreview] = useState('');

    // Deliverables state
    const [deliverables, setDeliverables] = useState([
        {
            id: 0,
            task_description: '',
            platform: '',
            num_posts: 0,
            num_reels: 0,
            num_videos: 0
        }
    ]);

    // Deliverables validation errors
    const [deliverableErrors, setDeliverableErrors] = useState({});

    // Fetch transaction data on mount
    useEffect(() => {
        const fetchTransactionData = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${API_BASE_URL}/brand/${requestId1}/${requestId2}/transaction`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                });

                if (response.status === 401) {
                    navigate('/signin');
                    return;
                }

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                setTransactionData(data);

                // Set default amount to remaining budget
                if (data.paymentMax) {
                    setFormData(prev => ({ ...prev, amount: data.paymentMax.toString() }));
                }
            } catch (error) {
                console.error('Error fetching transaction data:', error);
                setError('Failed to load transaction page. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        if (requestId1 && requestId2) {
            fetchTransactionData();
        }
    }, [requestId1, requestId2, navigate]);

    // Auto-hide success message
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    // Menu handlers
    const handleSignOut = async (e) => {
        e?.preventDefault();

        try {
            const response = await fetch(`${API_BASE_URL}/brand/signout`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (response.ok) {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const data = await response.json();
                    if (data.success) {
                        window.location.href = '/signin';
                        return;
                    }
                }
            }

            window.location.href = '/signin';
        } catch (error) {
            console.error('Error during signout:', error);
            window.location.href = '/signin';
        }
    };

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error for this field
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // Handle file input change
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, productImage: file }));
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setProductImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle deliverable field changes
    const handleDeliverableChange = (deliverableId, field, value) => {
        setDeliverables(prev => prev.map(d =>
            d.id === deliverableId ? { ...d, [field]: value } : d
        ));
        // Clear error for this field
        if (deliverableErrors[deliverableId] && deliverableErrors[deliverableId][field]) {
            setDeliverableErrors(prev => ({
                ...prev,
                [deliverableId]: {
                    ...prev[deliverableId],
                    [field]: ''
                }
            }));
        }
    };

    // Add new deliverable
    const handleAddDeliverable = () => {
        const newDeliverable = {
            id: deliverables.length > 0 ? Math.max(...deliverables.map(d => d.id)) + 1 : 0,
            task_description: '',
            platform: '',
            num_posts: 0,
            num_reels: 0,
            num_videos: 0
        };
        setDeliverables(prev => [...prev, newDeliverable]);
    };

    // Remove deliverable
    const handleRemoveDeliverable = (deliverableId) => {
        if (deliverables.length === 1) {
            alert('You must have at least one deliverable.');
            return;
        }
        setDeliverables(prev => prev.filter(d => d.id !== deliverableId));
        // Clear errors for removed deliverable
        if (deliverableErrors[deliverableId]) {
            setDeliverableErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[deliverableId];
                return newErrors;
            });
        }
    };

    // Format card number
    const handleCardNumberChange = (e) => {
        let value = e.target.value.replace(/\s/g, '');
        if (value.length > 16) value = value.slice(0, 16);
        value = value.replace(/(.{4})/g, '$1 ').trim();
        setFormData(prev => ({ ...prev, cardNumber: value }));
        if (formErrors.cardNumber) {
            setFormErrors(prev => ({ ...prev, cardNumber: '' }));
        }
    };

    // Format expiry date
    const handleExpiryDateChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.slice(0, 2) + '/' + value.slice(2, 4);
        }
        setFormData(prev => ({ ...prev, expiryDate: value }));
        if (formErrors.expiryDate) {
            setFormErrors(prev => ({ ...prev, expiryDate: '' }));
        }
    };

    // Validate form
    const validateForm = () => {
        const errors = {};
        const allowComplete = transactionData?.allowComplete;

        // Campaign completion validation (only when allowComplete is true)
        if (allowComplete) {
            if (!formData.objectives || formData.objectives.trim().length < 10) {
                errors.objectives = 'Please enter detailed campaign objectives (at least 10 characters).';
            }

            if (!formData.startDate) {
                errors.startDate = 'Please select a start date.';
            }

            if (!formData.endDate) {
                errors.endDate = 'Please select an end date.';
            }

            if (formData.startDate && formData.endDate) {
                const start = new Date(formData.startDate);
                const end = new Date(formData.endDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                if (start < today) {
                    errors.startDate = 'Start date cannot be in the past.';
                }

                if (end <= start) {
                    errors.endDate = 'End date must be after start date.';
                }

                const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
                if (duration > 365) {
                    errors.endDate = 'Campaign duration cannot exceed 365 days.';
                }
            }

            if (!formData.targetAudience || formData.targetAudience.trim().length < 5) {
                errors.targetAudience = 'Please enter a detailed target audience (at least 5 characters).';
            }

            // Product validation
            if (!formData.prodName) {
                errors.prodName = 'Product name is required.';
            }
            if (!formData.prodDescription) {
                errors.prodDescription = 'Product description is required.';
            }
            if (!formData.originalPrice || parseFloat(formData.originalPrice) < 0) {
                errors.originalPrice = 'Original price must be >= 0.';
            }
            if (!formData.campaignPrice || parseFloat(formData.campaignPrice) < 0) {
                errors.campaignPrice = 'Campaign price must be >= 0.';
            }
            if (formData.originalPrice && formData.campaignPrice && parseFloat(formData.campaignPrice) > parseFloat(formData.originalPrice)) {
                errors.campaignPrice = 'Campaign price cannot exceed original price.';
            }
            if (!formData.category) {
                errors.category = 'Product category is required.';
            }
            if (!formData.targetQty || parseInt(formData.targetQty) < 0) {
                errors.targetQty = 'Target quantity must be a non-negative integer.';
            }
            if (!formData.productImage) {
                errors.productImage = 'Product image is required.';
            }
        }

        // Deliverables validation
        const newDeliverableErrors = {};
        let hasDeliverableErrors = false;
        
        if (deliverables.length === 0) {
            errors.deliverables = 'Please add at least one deliverable.';
            hasDeliverableErrors = true;
        } else {
            deliverables.forEach(deliverable => {
                const deliverableError = {};

                // Task description
                if (!deliverable.task_description || !deliverable.task_description.trim()) {
                    deliverableError.task_description = 'Task description is required';
                    hasDeliverableErrors = true;
                }

                // Platform
                if (!deliverable.platform) {
                    deliverableError.platform = 'Please select a platform';
                    hasDeliverableErrors = true;
                }

                // At least one of posts, reels, or videos should be greater than 0
                if (deliverable.num_posts === 0 && deliverable.num_reels === 0 && deliverable.num_videos === 0) {
                    deliverableError.num_posts = 'Please specify at least one deliverable (posts, reels, or videos)';
                    hasDeliverableErrors = true;
                }

                if (Object.keys(deliverableError).length > 0) {
                    newDeliverableErrors[deliverable.id] = deliverableError;
                }
            });
            setDeliverableErrors(newDeliverableErrors);
        }

        // Payment validation
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            errors.amount = 'Please enter a valid amount.';
        }

        if (transactionData?.paymentMax && parseFloat(formData.amount) > transactionData.paymentMax) {
            errors.amount = `Amount exceeds remaining budget (max ${transactionData.paymentMax}).`;
        }

        if (!formData.paymentMethod) {
            errors.paymentMethod = 'Please select a payment method.';
        }

        if (formData.paymentMethod === 'creditCard') {
            const cardNumber = formData.cardNumber.replace(/\s/g, '');
            if (!cardNumber || cardNumber.length < 16) {
                errors.cardNumber = 'Please enter a valid card number (min 16 digits).';
            }
            if (!formData.expiryDate || !/^\d{2}\/\d{2}$/.test(formData.expiryDate)) {
                errors.expiryDate = 'Please enter a valid expiry date (MM/YY).';
            }
            if (!formData.cvv || formData.cvv.length < 3) {
                errors.cvv = 'Please enter a valid CVV (3-4 digits).';
            }
            if (!formData.cardHolder) {
                errors.cardHolder = 'Please enter the cardholder name.';
            }
        } else if (formData.paymentMethod === 'bankTransfer') {
            if (!formData.accountNumber) {
                errors.accountNumber = 'Please enter an account number.';
            }
            if (!formData.routingNumber) {
                errors.routingNumber = 'Please enter a routing number.';
            }
            if (!formData.bankName) {
                errors.bankName = 'Please enter a bank name.';
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0 && !hasDeliverableErrors;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            // Scroll to first error
            const firstErrorField = Object.keys(formErrors)[0];
            if (firstErrorField) {
                const element = document.getElementById(firstErrorField);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Create FormData for multipart/form-data
            const submitData = new FormData();
            submitData.append('amount', formData.amount);
            submitData.append('paymentMethod', formData.paymentMethod);

            if (transactionData?.allowComplete) {
                submitData.append('objectives', formData.objectives);
                submitData.append('startDate', formData.startDate);
                submitData.append('endDate', formData.endDate);
                submitData.append('targetAudience', formData.targetAudience);
                submitData.append('prodName', formData.prodName);
                submitData.append('prodDescription', formData.prodDescription);
                submitData.append('originalPrice', formData.originalPrice);
                submitData.append('campaignPrice', formData.campaignPrice);
                submitData.append('category', formData.category);
                submitData.append('targetQty', formData.targetQty);
                if (formData.productImage) {
                    submitData.append('productImage', formData.productImage);
                }
            }

            if (formData.paymentMethod === 'creditCard') {
                submitData.append('cardNumber', formData.cardNumber.replace(/\s/g, ''));
                submitData.append('expiryDate', formData.expiryDate);
                submitData.append('cvv', formData.cvv);
                submitData.append('cardHolder', formData.cardHolder);
            } else if (formData.paymentMethod === 'bankTransfer') {
                submitData.append('accountNumber', formData.accountNumber);
                submitData.append('routingNumber', formData.routingNumber);
                submitData.append('bankName', formData.bankName);
            }

            // Include deliverables data
            submitData.append('deliverables', JSON.stringify(deliverables))

            const response = await fetch(`${API_BASE_URL}/brand/${requestId1}/${requestId2}/transaction`, {
                method: 'POST',
                body: submitData,
                credentials: 'include'
            });

            if (response.status === 401) {
                navigate('/signin');
                return;
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const result = await response.json();
                if (result.success) {
                    setSuccessMessage(result.message || 'Campaign completed and payment processed successfully!');
                    setTimeout(() => {
                        navigate('/brand/home');
                    }, 2000);
                } else {
                    setError(result.message || 'Failed to process payment. Please try again.');
                }
            } else {
                // Handle redirect or text response
                if (response.ok) {
                    setSuccessMessage('Campaign completed and payment processed successfully!');
                    setTimeout(() => {
                        navigate('/brand/home');
                    }, 2000);
                } else {
                    const text = await response.text();
                    setError(text || 'Failed to process payment. Please try again.');
                }
            }
        } catch (error) {
            console.error('Error submitting payment:', error);
            setError('Failed to process payment. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !transactionData) {
        return (
            <div className={styles.transactionPageWrapper}>
                <div className="loadingMessage">Loading transaction page...</div>
            </div>
        );
    }

    if (error && !transactionData) {
        return (
            <div className={styles.transactionPageWrapper}>
                <div className="errorMessage">{error}</div>
            </div>
        );
    }

    if (!transactionData) {
        return null;
    }

    return (
        <div className={styles.transactionPageWrapper}>
            <BrandNavigation onSignOut={handleSignOut} />

            <div className={styles.container}>
                <TransactionAlerts
                    successMessage={successMessage}
                    error={error}
                    onDismissSuccess={() => setSuccessMessage(null)}
                    onDismissError={() => setError(null)}
                    styles={styles}
                />

                <CampaignInfoSection transactionData={transactionData} styles={styles} />

                <CampaignProductsSection transactionData={transactionData} styles={styles} />

                <InfluencerInfoSection transactionData={transactionData} styles={styles} />

                {/* Payment Form */}
                <section className={styles.paymentSection}>
                    <h3>Make Payment</h3>
                    <form id="paymentForm" onSubmit={handleSubmit} noValidate>
                        {transactionData.allowComplete && (
                            <>
                                <CampaignCompletionForm
                                    formData={formData}
                                    formErrors={formErrors}
                                    handleInputChange={handleInputChange}
                                    styles={styles}
                                />

                                <ProductDetailsForm
                                    formData={formData}
                                    formErrors={formErrors}
                                    productImagePreview={productImagePreview}
                                    handleInputChange={handleInputChange}
                                    handleFileChange={handleFileChange}
                                    styles={styles}
                                />
                            </>
                        )}

                        <PaymentFormFields
                            formData={formData}
                            formErrors={formErrors}
                            transactionData={transactionData}
                            handleInputChange={handleInputChange}
                            handleCardNumberChange={handleCardNumberChange}
                            handleExpiryDateChange={handleExpiryDateChange}
                            styles={styles}
                        />

                        <DeliverablesSection
                            deliverables={deliverables}
                            deliverableErrors={deliverableErrors}
                            onDeliverableChange={handleDeliverableChange}
                            onRemoveDeliverable={handleRemoveDeliverable}
                            onAddDeliverable={handleAddDeliverable}
                        />

                        <button type="submit" disabled={loading}>
                            {loading ? 'Processing...' : 'Submit Payment'}
                        </button>
                    </form>
                </section>
            </div>
        </div>
    );
};

export default Transaction;
