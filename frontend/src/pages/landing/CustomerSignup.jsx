import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../styles/landing/signin.module.css';
import { API_BASE_URL } from '../../services/api';
import { useCustomer } from '../../contexts/CustomerContext';

const CustomerSignup = () => {
    const navigate = useNavigate();
    const { initializeCustomer } = useCustomer();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: ''
    });
    const [errors, setErrors] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: ''
    });
    const [message, setMessage] = useState({ text: '', type: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateName = (value) => {
        const name = value.trim();
        if (!name) return 'Name is required';
        if (name.length < 2) return 'Name must be at least 2 characters';
        if (name.length > 100) return 'Name cannot exceed 100 characters';
        if (!/^[a-zA-Z\s]+$/.test(name)) return 'Name can only contain letters and spaces';
        if (name === 'test' || name === 'admin') return 'Please use a real name';
        return '';
    };

    const validateEmail = (value) => {
        const emailRegex = /^[\w.!#$%&'*+/=?^`{|}~-]+@[\w-]+(?:\.[\w-]+)+$/;
        if (!value) return 'Email is required';
        if (!emailRegex.test(value)) return 'Enter a valid email address';
        if (value === 'test@test.com') return 'Please use a real email address';
        return '';
    };

    const validatePassword = (value) => {
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (!/[0-9]/.test(value)) return 'Password must include at least one digit';
        if (!/[^A-Za-z0-9]/.test(value)) return 'Password must include at least one special character';
        return '';
    };

    const validateConfirmPassword = (pwd, confirmPwd) => {
        if (!confirmPwd) return 'Please confirm your password';
        if (pwd !== confirmPwd) return 'Passwords do not match';
        return '';
    };

    const validatePhone = (value) => {
        if (!value) return ''; // Phone is optional
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        if (!phoneRegex.test(value.replace(/\s/g, ''))) return 'Enter a valid phone number';
        return '';
    };

    const setFieldState = (field, errorMsg) => {
        setErrors(prev => ({
            ...prev,
            [field]: errorMsg || ''
        }));
    };

    const updateSubmitState = () => {
        const nameMsg = validateName(formData.name);
        const emailMsg = validateEmail(formData.email.trim());
        const pwdMsg = validatePassword(formData.password);
        const confirmMsg = validateConfirmPassword(formData.password, formData.confirmPassword);
        const phoneMsg = validatePhone(formData.phone);
        return !(nameMsg || emailMsg || pwdMsg || confirmMsg || phoneMsg);
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
        if (name === 'name') {
            const msg = validateName(value);
            setFieldState('name', msg);
        } else if (name === 'email') {
            const msg = validateEmail(value.trim());
            setFieldState('email', msg);
        } else if (name === 'password') {
            const msg = validatePassword(value);
            setFieldState('password', msg);
            if (formData.confirmPassword) {
                const confirmMsg = validateConfirmPassword(value, formData.confirmPassword);
                setFieldState('confirmPassword', confirmMsg);
            }
        } else if (name === 'confirmPassword') {
            const msg = validateConfirmPassword(formData.password, value);
            setFieldState('confirmPassword', msg);
        } else if (name === 'phone') {
            const msg = validatePhone(value);
            setFieldState('phone', msg);
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        if (name === 'name') {
            const msg = validateName(value);
            setFieldState('name', msg);
        } else if (name === 'email') {
            const msg = validateEmail(value.trim());
            setFieldState('email', msg);
        } else if (name === 'password') {
            const msg = validatePassword(value);
            setFieldState('password', msg);
        } else if (name === 'confirmPassword') {
            const msg = validateConfirmPassword(formData.password, value);
            setFieldState('confirmPassword', msg);
        } else if (name === 'phone') {
            const msg = validatePhone(value);
            setFieldState('phone', msg);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Final validation gate before submit
        const nameMsg = validateName(formData.name);
        const emailMsg = validateEmail(formData.email.trim());
        const pwdMsg = validatePassword(formData.password);
        const confirmMsg = validateConfirmPassword(formData.password, formData.confirmPassword);
        const phoneMsg = validatePhone(formData.phone);

        setFieldState('name', nameMsg);
        setFieldState('email', emailMsg);
        setFieldState('password', pwdMsg);
        setFieldState('confirmPassword', confirmMsg);
        setFieldState('phone', phoneMsg);

        if (nameMsg || emailMsg || pwdMsg || confirmMsg || phoneMsg) {
            showMessage('Please fix the errors above', 'error');
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/auth/customer/signup`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    email: formData.email.trim(),
                    password: formData.password,
                    phone: formData.phone.trim()
                })
            });

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (parseError) {
                    errorData = {
                        message: response.status === 404
                            ? 'Server endpoint not found. Please check your backend server.'
                            : `Server error: ${response.status} ${response.statusText}`
                    };
                }
                showMessage(errorData.message || 'Signup failed', 'error');
                setIsSubmitting(false);
                return;
            }

            let data;
            try {
                data = await response.json();
            } catch (parseError) {
                console.error('Error parsing response:', parseError);
                showMessage('Invalid response from server. Please try again.', 'error');
                setIsSubmitting(false);
                return;
            }

            showMessage(data.message || 'Signup successful! Redirecting...', 'success');

            // Redirect to signin page after success
            setTimeout(() => {
                navigate('/signin', { state: { fromSignup: true, userType: 'customer' } });
            }, 1500);
        } catch (error) {
            console.error('Signup error:', error);
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
                    <h1>Create Account</h1>
                    <h2>Sign up as a Customer to browse campaigns</h2>

                    <form onSubmit={handleSubmit}>
                        <div className={`${styles.message} ${styles[message.type]}`} style={{ display: message.text ? 'block' : 'none' }}>
                            {message.text}
                        </div>

                        <div className={styles['form-group']}>
                            <label htmlFor="name">Full Name</label>
                            <div className={styles['input-wrapper']}>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    onBlur={handleBlur}
                                    required
                                    className={errors.name ? styles.invalid : ''}
                                    aria-invalid={errors.name ? 'true' : 'false'}
                                />
                            </div>
                            <small
                                className={styles['error-text']}
                                aria-live="polite"
                                style={{
                                    display: errors.name ? 'block' : 'none',
                                    marginTop: errors.name ? '6px' : '',
                                    padding: errors.name ? '6px 8px' : '',
                                    borderRadius: errors.name ? '4px' : '',
                                    background: errors.name ? 'rgba(255, 77, 79, 0.12)' : '',
                                    border: errors.name ? '1px solid #ff4d4f' : '',
                                    color: errors.name ? '#b00020' : ''
                                }}
                            >
                                {errors.name}
                            </small>
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
                                    placeholder="Enter a strong password"
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

                        <div className={styles['form-group']}>
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <div className={styles['input-wrapper']}>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    placeholder="Re-enter your password"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    onBlur={handleBlur}
                                    required
                                    className={errors.confirmPassword ? styles.invalid : ''}
                                    aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                                />
                            </div>
                            <small
                                className={styles['error-text']}
                                aria-live="polite"
                                style={{
                                    display: errors.confirmPassword ? 'block' : 'none',
                                    marginTop: errors.confirmPassword ? '6px' : '',
                                    padding: errors.confirmPassword ? '6px 8px' : '',
                                    borderRadius: errors.confirmPassword ? '4px' : '',
                                    background: errors.confirmPassword ? 'rgba(255, 77, 79, 0.12)' : '',
                                    border: errors.confirmPassword ? '1px solid #ff4d4f' : '',
                                    color: errors.confirmPassword ? '#b00020' : ''
                                }}
                            >
                                {errors.confirmPassword}
                            </small>
                        </div>

                        <div className={styles['form-group']}>
                            <label htmlFor="phone">Phone Number (Optional)</label>
                            <div className={styles['input-wrapper']}>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    placeholder="+1 (555) 123-4567"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    onBlur={handleBlur}
                                    className={errors.phone ? styles.invalid : ''}
                                    aria-invalid={errors.phone ? 'true' : 'false'}
                                />
                            </div>
                            <small
                                className={styles['error-text']}
                                aria-live="polite"
                                style={{
                                    display: errors.phone ? 'block' : 'none',
                                    marginTop: errors.phone ? '6px' : '',
                                    padding: errors.phone ? '6px 8px' : '',
                                    borderRadius: errors.phone ? '4px' : '',
                                    background: errors.phone ? 'rgba(255, 77, 79, 0.12)' : '',
                                    border: errors.phone ? '1px solid #ff4d4f' : '',
                                    color: errors.phone ? '#b00020' : ''
                                }}
                            >
                                {errors.phone}
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
                            {isSubmitting ? 'Creating Account...' : 'Sign Up'}
                        </button>
                    </form>

                    <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
                        Already have an account? <a href="/signin" style={{ color: '#6c63ff', textDecoration: 'none', fontWeight: '500' }}>Sign in here</a>
                    </p>

                    <a href="/role-selection" className={styles['back-link']} onClick={(e) => {
                        e.preventDefault();
                        navigate('/role-selection');
                    }}>
                        Back to Role Selection
                    </a>
                </div>

                <div className={styles['image-container']}>
                    <div className={styles['image-wrapper']}>
                        <img src="/Sign/SignUp_picture3.jpg" alt="Sign Up Illustration" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerSignup;
