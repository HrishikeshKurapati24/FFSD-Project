import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../styles/common/user_feedback.module.css';
import { API_BASE_URL } from '../../services/api';
import { useBrand } from '../../contexts/BrandContext';
import { useInfluencer } from '../../contexts/InfluencerContext';
import { useCustomer } from '../../contexts/CustomerContext';

const UserFeedback = () => {
    const navigate = useNavigate();
    const { brand, loading: brandLoading } = useBrand();
    const { influencer, loading: influencerLoading } = useInfluencer();
    const { customer, loading: customerLoading } = useCustomer();

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userInfo, setUserInfo] = useState({
        userId: 'anonymous',
        userName: 'Anonymous User',
        userType: 'guest'
    });

    const [formData, setFormData] = useState({
        type: 'general',
        subject: '',
        message: ''
    });

    // Check if any context is still loading
    const isAnyLoading = brandLoading || influencerLoading || customerLoading;

    useEffect(() => {
        console.log('[DEBUG] UserFeedback Context Update:', { brand, influencer, customer, isAnyLoading });

        if (brand) {
            setIsLoggedIn(true);
            setUserInfo({
                userId: brand.id || brand._id || brand.userId || brand.email || 'unknown_brand',
                userName: brand.brandName || brand.displayName || 'Brand User',
                userType: 'brand'
            });
        } else if (influencer) {
            setIsLoggedIn(true);
            setUserInfo({
                userId: influencer.id || influencer._id || influencer.userId || influencer.email || 'unknown_influencer',
                userName: influencer.fullName || influencer.displayName || influencer.name || 'Influencer User',
                userType: 'influencer'
            });
        } else if (customer) {
            setIsLoggedIn(true);
            setUserInfo({
                userId: customer.id || customer._id || customer.userId || customer.email || 'unknown_customer',
                userName: customer.fullName || customer.displayName || customer.name || 'Customer User',
                userType: 'customer'
            });
        } else if (!isAnyLoading) {
            // Fully loaded and no user found
            setIsLoggedIn(false);
            setUserInfo({
                userId: 'anonymous',
                userName: 'Anonymous User',
                userType: 'guest'
            });
        }
    }, [brand, influencer, customer, isAnyLoading]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Client-side validation
        if (!formData.subject.trim() || !formData.message.trim()) {
            setMessage({ type: 'error', text: 'Please provide both a subject and a message.' });
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            // Determine the final userId to send, with ultimate fallback
            const finalUserId = userInfo.userId || (isLoggedIn ? 'unknown_auth_user' : 'anonymous');

            // Prepare submission data
            const submissionData = {
                ...formData,
                userId: finalUserId,
                userName: userInfo.userName || 'Unknown User',
                userType: userInfo.userType || 'guest'
            };

            console.log('[DEBUG] Submitting feedback:', submissionData);

            const response = await fetch(`${API_BASE_URL}/admin/feedback/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submissionData),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setMessage({
                    type: 'success',
                    text: isLoggedIn
                        ? 'Thank you! Your feedback has been submitted.'
                        : 'Thank you! Your anonymous feedback has been submitted.'
                });
                setFormData({
                    type: 'general',
                    subject: '',
                    message: ''
                });
                // Redirect back after 2.5 seconds
                setTimeout(() => {
                    navigate(-1);
                }, 2500);
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to submit feedback. Please try again.' });
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
            setMessage({ type: 'error', text: 'An error occurred. Please try again later.' });
        } finally {
            setLoading(false);
        }
    };

    if (isAnyLoading && !isLoggedIn) {
        return (
            <div className={styles.feedbackContainer}>
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <p>Verifying login status...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.feedbackContainer}>
            <div className={styles.feedbackHeader}>
                <h1>Feedback</h1>
                <p>We value your input. Let us know how we can improve.</p>
                {!isLoggedIn && (
                    <p style={{ color: '#888', fontStyle: 'italic', fontSize: '0.9rem', marginTop: '5px' }}>
                        (Submitting as guest)
                    </p>
                )}
            </div>

            {message.text && (
                <div className={message.type === 'success' ? styles.successMessage : styles.errorMessage}>
                    {message.text}
                </div>
            )}

            <form className={styles.feedbackForm} onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                    <label htmlFor="type">Feedback Type</label>
                    <select
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        required
                    >
                        <option value="general">General Feedback</option>
                        <option value="complaint">Complaint</option>
                        <option value="suggestion">Suggestion</option>
                        <option value="bug_report">Bug Report</option>
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="subject">Subject</label>
                    <input
                        type="text"
                        id="subject"
                        name="subject"
                        placeholder="What is this about?"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="message">Message</label>
                    <textarea
                        id="message"
                        name="message"
                        placeholder="Tell us more details..."
                        value={formData.message}
                        onChange={handleChange}
                        required
                    ></textarea>
                </div>

                <button type="submit" className={styles.submitBtn} disabled={loading}>
                    {loading ? (
                        <>Submitting...</>
                    ) : (
                        <>{isLoggedIn ? 'Submit Feedback' : 'Submit feedback as Guest'}</>
                    )}
                </button>

                <button
                    type="button"
                    className={styles.cancelBtn}
                    style={{ background: 'transparent', color: '#666', border: 'none', marginTop: '10px', cursor: 'pointer' }}
                    onClick={() => navigate(-1)}
                >
                    Back to Dashboard
                </button>
            </form>
        </div>
    );
};

export default UserFeedback;
