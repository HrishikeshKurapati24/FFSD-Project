import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../styles/landing/signin.module.css';
import { API_BASE_URL } from '../../services/api';
import { useBrand } from '../../contexts/BrandContext';
import { useInfluencer } from '../../contexts/InfluencerContext';
import { useCustomer } from '../../contexts/CustomerContext';

const Signin = () => {
    const navigate = useNavigate();
    const { initializeBrand } = useBrand();
    const { initializeInfluencer } = useInfluencer();
    const { initializeCustomer } = useCustomer();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [errors, setErrors] = useState({
        email: '',
        password: ''
    });
    const [message, setMessage] = useState({ text: '', type: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateEmail = (value) => {
        const emailRegex = /^[\w.!#$%&'*+/=?^`{|}~-]+@[\w-]+(?:\.[\w-]+)+$/;
        if (!value) return 'Email is required';
        if (!emailRegex.test(value)) return 'Enter a valid email address';
        return '';
    };

    const validatePassword = (value) => {
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (!/[0-9]/.test(value)) return 'Password must include at least one digit';
        if (!/[^A-Za-z0-9]/.test(value)) return 'Password must include at least one special character';
        return '';
    };

    const setFieldState = (field, errorMsg) => {
        setErrors(prev => ({
            ...prev,
            [field]: errorMsg || ''
        }));
    };

    const updateSubmitState = () => {
        const emailMsg = validateEmail(formData.email.trim());
        const pwdMsg = validatePassword(formData.password);
        return !(emailMsg || pwdMsg);
    };

    const showMessage = (text, type) => {
        setMessage({ text, type });
        if (type === 'success') {
            setTimeout(() => {
                setMessage({ text: '', type: '' });
            }, 3000);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Live validation
        if (name === 'email') {
            const msg = validateEmail(value.trim());
            setFieldState('email', msg);
        } else if (name === 'password') {
            const msg = validatePassword(value);
            setFieldState('password', msg);
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        if (name === 'email') {
            const msg = validateEmail(value.trim());
            setFieldState('email', msg);
        } else if (name === 'password') {
            const msg = validatePassword(value);
            setFieldState('password', msg);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Final validation gate before submit
        const emailMsg = validateEmail(formData.email.trim());
        const pwdMsg = validatePassword(formData.password);
        setFieldState('email', emailMsg);
        setFieldState('password', pwdMsg);

        if (emailMsg || pwdMsg) {
            showMessage(emailMsg || pwdMsg, 'error');
            setIsSubmitting(false);
            return;
        }

        try {
            // Asynchronous authentication request
            const response = await fetch(`${API_BASE_URL}/auth/signin`, {
                method: 'POST',
                credentials: 'include', // Include cookies and authorization headers
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    email: formData.email.trim(),
                    password: formData.password
                })
            });

            // Check if response is OK before trying to parse JSON
            if (!response.ok) {
                // Try to parse error response as JSON
                let errorData;
                try {
                    errorData = await response.json();
                } catch (parseError) {
                    // If response is not JSON (e.g., 404 HTML page)
                    errorData = {
                        message: response.status === 404
                            ? 'Server endpoint not found. Please check your backend server.'
                            : `Server error: ${response.status} ${response.statusText}`
                    };
                }

                // Handle different error cases
                if (response.status === 401 && errorData.error) {
                    showMessage(errorData.error || 'Token expired. Please sign in again.', 'error');
                } else {
                    showMessage(errorData.message || 'Invalid credentials', 'error');
                }
                return;
            }

            // Parse successful response
            let data;
            try {
                data = await response.json();
            } catch (parseError) {
                console.error('Error parsing response:', parseError);
                showMessage('Invalid response from server. Please try again.', 'error');
                return;
            }

            showMessage(data.message || 'Sign-in successful', 'success');
            // Token cookie is automatically set by backend
            // Initialize context with user data from response
            if (data.user) {
                if (data.user.userType === 'brand') {
                    await initializeBrand(data.user);
                } else if (data.user.userType === 'influencer') {
                    await initializeInfluencer(data.user);
                } else if (data.user.userType === 'customer') {
                    await initializeCustomer(data.user);
                }
            }
            // Redirect after successful authentication
            setTimeout(() => {
                window.location.href = data.redirectUrl;
            }, 1500);
        } catch (error) {
            console.error('Signin error:', error);
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                showMessage('Unable to connect to server. Please check if the backend server is running.', 'error');
            } else {
                showMessage('An error occurred. Please try again.', 'error');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const isFormValid = updateSubmitState();

    return (
        <div className={styles['signin-page']}>
            <div className={`${styles.orb} ${styles['orb-1']}`}></div>
            <div className={`${styles.orb} ${styles['orb-2']}`}></div>

            <div className={styles['signin-container']}>
                <div className={styles['form-container']}>
                    <div className={styles.logo}>CollabSync</div>
                    <h1>Welcome Back</h1>
                    <h2>Enter your credentials to access your account</h2>

                    <form onSubmit={handleSubmit}>
                        <div className={`${styles.message} ${styles[message.type]}`} style={{ display: message.text ? 'block' : 'none' }}>
                            {message.text}
                        </div>

                        <div className={styles['form-group']}>
                            <label htmlFor="email">Email Address</label>
                            <div className={styles['input-wrapper']}>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    onBlur={handleBlur}
                                    required
                                    className={errors.email ? styles.invalid : ''}
                                    aria-invalid={errors.email ? 'true' : 'false'}
                                />
                            </div>
                            <small
                                className={styles['error-text']}
                                aria-live="polite"
                                style={{
                                    display: errors.email ? 'block' : 'none',
                                    marginTop: errors.email ? '6px' : '',
                                    padding: errors.email ? '6px 8px' : '',
                                    borderRadius: errors.email ? '4px' : '',
                                    background: errors.email ? 'rgba(255, 77, 79, 0.12)' : '',
                                    border: errors.email ? '1px solid #ff4d4f' : '',
                                    color: errors.email ? '#b00020' : ''
                                }}
                            >
                                {errors.email}
                            </small>
                        </div>

                        <div className={styles['form-group']}>
                            <label htmlFor="password">Password</label>
                            <div className={styles['input-wrapper']}>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    onBlur={handleBlur}
                                    required
                                    className={errors.password ? styles.invalid : ''}
                                    aria-invalid={errors.password ? 'true' : 'false'}
                                />
                            </div>
                            <small
                                className={styles['error-text']}
                                aria-live="polite"
                                style={{
                                    display: errors.password ? 'block' : 'none',
                                    marginTop: errors.password ? '6px' : '',
                                    padding: errors.password ? '6px 8px' : '',
                                    borderRadius: errors.password ? '4px' : '',
                                    background: errors.password ? 'rgba(255, 77, 79, 0.12)' : '',
                                    border: errors.password ? '1px solid #ff4d4f' : '',
                                    color: errors.password ? '#b00020' : ''
                                }}
                            >
                                {errors.password}
                            </small>
                        </div>

                        <button
                            type="submit"
                            disabled={!isFormValid || isSubmitting}
                            style={{
                                opacity: (!isFormValid || isSubmitting) ? 0.6 : 1,
                                cursor: (!isFormValid || isSubmitting) ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {isSubmitting ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>

                    <a href="/role-selection" className={styles['back-link']} onClick={(e) => {
                        e.preventDefault();
                        navigate('/');
                    }}>
                        Back to Home
                    </a>
                </div>

                <div className={styles['image-container']}>
                    <div className={styles['image-wrapper']}>
                        <img src="/Sign/SignUp_picture3.jpg" alt="Sign In Illustration" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signin;