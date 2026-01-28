import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../styles/landing/brand_signup.module.css';
import { API_BASE_URL } from '../../services/api';

const BrandSignup = () => {
    const navigate = useNavigate();

    // Form fields state
    const [formData, setFormData] = useState({
        brandName: '',
        email: '',
        password: '',
        industry: '',
        website: '',
        totalAudience: '0',
        phone: ''
    });

    // Error messages state
    const [errors, setErrors] = useState({
        brandName: '',
        email: '',
        password: '',
        industry: '',
        website: '',
        totalAudience: '',
        phone: ''
    });

    // Character counts state
    const [charCounts, setCharCounts] = useState({
        brandName: '0/50 characters',
        industry: '0/50 characters'
    });

    // Message box state
    const [message, setMessage] = useState({ text: '', type: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Validation functions
    const validateBrandName = (value) => {
        if (!value) return 'Brand name is required';
        if (value.length < 2) return 'Brand name must be at least 2 characters';
        if (value.length > 50) return 'Brand name cannot exceed 50 characters';
        if (!/^[a-zA-Z0-9\s&.-]+$/.test(value)) return 'Brand name can only contain letters, numbers, spaces, &, dots, and hyphens';

        const vaguePatterns = [
            /^(test|testing|demo|sample|example|asdf|qwerty|123|abc|xyz)$/i,
            /^(brand|company|business|corp|corporation)$/i,
            /^(user|admin|guest|temp|temporary)$/i,
            /^(name|brandname|companyname)$/i,
            /^[a-z]{1,3}$/i,
            /^[0-9]+$/,
            /^(.)\1+$/,
            /^(my|the|a|an)\s+(brand|company|business)$/i
        ];

        if (vaguePatterns.some(pattern => pattern.test(value.trim()))) {
            return 'Please enter a real brand name';
        }

        return '';
    };

    const validateEmail = (value) => {
        const emailRegex = /^[\w.!#$%&'*+/=?^`{|}~-]+@[\w-]+(?:\.[\w-]+)+$/;
        if (!value) return 'Email is required';
        if (!emailRegex.test(value)) return 'Enter a valid email address';

        const vagueEmailPatterns = [
            /^(test|testing|demo|sample|example|asdf|qwerty|123|abc|xyz)@/i,
            /^(user|admin|guest|temp|temporary)@/i,
            /^(email|mail|contact)@/i,
            /@(test|testing|demo|sample|example|localhost|temp|temporary)\./i,
            /@(test|testing|demo|sample|example)\.(com|org|net)$/i,
            /^(.)\1+@/i,
            /@(.)\1+\./i
        ];

        if (vagueEmailPatterns.some(pattern => pattern.test(value.trim()))) {
            return 'Please enter a real email address';
        }

        return '';
    };

    const validatePassword = (value) => {
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (!/[0-9]/.test(value)) return 'Password must include at least one digit';
        if (!/[^A-Za-z0-9]/.test(value)) return 'Password must include at least one special character';
        return '';
    };

    const validateIndustry = (value) => {
        if (!value) return 'Industry is required';
        if (value.length < 2) return 'Industry must be at least 2 characters';
        if (value.length > 50) return 'Industry cannot exceed 50 characters';

        const vaguePatterns = [
            /^(test|testing|demo|sample|example|asdf|qwerty|123|abc|xyz)$/i,
            /^(industry|sector|field|area|domain)$/i,
            /^(general|other|misc|miscellaneous)$/i,
            /^[a-z]{1,2}$/i,
            /^[0-9]+$/,
            /^(.)\1+$/,
            /^(stuff|things|random|whatever|business)$/i,
            /^(my|the|a|an)\s+(industry|business|field)$/i
        ];

        if (vaguePatterns.some(pattern => pattern.test(value.trim()))) {
            return 'Please enter a specific industry';
        }

        return '';
    };

    const validateWebsite = (value) => {
        if (!value) return 'Website is required';
        const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
        if (!urlRegex.test(value)) return 'Please enter a valid website URL (e.g., https://example.com)';
        return '';
    };

    const validateTotalAudience = (value) => {
        if (!value) return 'Total audience is required';
        const num = parseInt(value, 10);
        if (isNaN(num)) return 'Total audience must be a valid number';
        if (num < 0) return 'Total audience cannot be negative';
        if (num > 1000000000) return 'Total audience cannot exceed 1,000,000,000';
        return '';
    };

    const validatePhone = (value) => {
        if (!value) return 'Contact number is required';

        const digitsOnly = value.replace(/\D/g, '');

        if (digitsOnly.length < 10) return 'Phone number must have at least 10 digits';
        if (digitsOnly.length > 15) return 'Phone number cannot exceed 15 digits';

        const phoneRegex = /^\+?[1-9]\d{9,14}$/;
        if (!phoneRegex.test(value)) return 'Please enter a valid phone number format';

        const vaguePhonePatterns = [
            /^(\d)\1{9,}$/,
            /^123456789\d*$/,
            /^000000000\d*$/,
            /^111111111\d*$/,
            /^(\d{3})\1{2,}$/,
            /^(\d{2})\1{4,}$/
        ];

        if (vaguePhonePatterns.some(pattern => pattern.test(digitsOnly))) {
            return 'Please enter a real phone number';
        }

        return '';
    };

    const setFieldError = (field, errorMsg) => {
        setErrors(prev => ({
            ...prev,
            [field]: errorMsg || ''
        }));
    };

    const showMessage = (text, type) => {
        setMessage({ text, type });
        if (type === 'success') {
            setTimeout(() => {
                setMessage({ text: '', type: '' });
            }, 3000);
        }
    };

    const updateCharCount = (field, value, maxLength) => {
        const count = value.length;
        setCharCounts(prev => ({
            ...prev,
            [field]: `${count}/${maxLength} characters`
        }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let processedValue = value;

        // Enforce character limits
        if (name === 'brandName' && value.length > 50) {
            processedValue = value.slice(0, 50);
        } else if (name === 'industry' && value.length > 50) {
            processedValue = value.slice(0, 50);
        } else if (name === 'totalAudience') {
            // Enforce numeric constraints for totalAudience
            if (value && !isNaN(value)) {
                const numValue = parseInt(value, 10);
                if (numValue < 0) {
                    processedValue = '0';
                } else if (numValue > 1000000000) {
                    processedValue = '1000000000';
                }
            }
        }

        setFormData(prev => ({
            ...prev,
            [name]: processedValue
        }));

        // Update character counts
        if (name === 'brandName') {
            updateCharCount('brandName', processedValue, 50);
        } else if (name === 'industry') {
            updateCharCount('industry', processedValue, 50);
        }

        // Live validation
        let errorMsg = '';
        if (name === 'brandName') {
            errorMsg = validateBrandName(processedValue.trim());
        } else if (name === 'email') {
            errorMsg = validateEmail(processedValue.trim());
        } else if (name === 'password') {
            errorMsg = validatePassword(processedValue);
        } else if (name === 'industry') {
            errorMsg = validateIndustry(processedValue.trim());
        } else if (name === 'website') {
            errorMsg = validateWebsite(processedValue.trim());
        } else if (name === 'totalAudience') {
            errorMsg = validateTotalAudience(processedValue);
        } else if (name === 'phone') {
            errorMsg = validatePhone(processedValue.trim());
        }

        setFieldError(name, errorMsg);
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        let errorMsg = '';

        if (name === 'brandName') {
            errorMsg = validateBrandName(value.trim());
        } else if (name === 'email') {
            errorMsg = validateEmail(value.trim());
        } else if (name === 'password') {
            errorMsg = validatePassword(value);
        } else if (name === 'industry') {
            errorMsg = validateIndustry(value.trim());
        } else if (name === 'website') {
            errorMsg = validateWebsite(value.trim());
        } else if (name === 'totalAudience') {
            errorMsg = validateTotalAudience(value);
        } else if (name === 'phone') {
            errorMsg = validatePhone(value.trim());
        }

        setFieldError(name, errorMsg);
    };

    const isFormValid = () => {
        const brandNameMsg = validateBrandName(formData.brandName.trim());
        const emailMsg = validateEmail(formData.email.trim());
        const passwordMsg = validatePassword(formData.password);
        const industryMsg = validateIndustry(formData.industry.trim());
        const websiteMsg = validateWebsite(formData.website.trim());
        const totalAudienceMsg = validateTotalAudience(formData.totalAudience);
        const phoneMsg = validatePhone(formData.phone.trim());

        return !(brandNameMsg || emailMsg || passwordMsg || industryMsg || websiteMsg || totalAudienceMsg || phoneMsg);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Final validation
        const brandNameMsg = validateBrandName(formData.brandName.trim());
        const emailMsg = validateEmail(formData.email.trim());
        const passwordMsg = validatePassword(formData.password);
        const industryMsg = validateIndustry(formData.industry.trim());
        const websiteMsg = validateWebsite(formData.website.trim());
        const totalAudienceMsg = validateTotalAudience(formData.totalAudience);
        const phoneMsg = validatePhone(formData.phone.trim());

        // Set all errors
        setErrors({
            brandName: brandNameMsg,
            email: emailMsg,
            password: passwordMsg,
            industry: industryMsg,
            website: websiteMsg,
            totalAudience: totalAudienceMsg,
            phone: phoneMsg
        });

        const hasErrors = Boolean(brandNameMsg || emailMsg || passwordMsg || industryMsg || websiteMsg || totalAudienceMsg || phoneMsg);

        if (hasErrors) {
            showMessage('Please fix all errors before submitting', 'error');
            setIsSubmitting(false);
            return;
        }

        try {
            const data = {
                brandName: formData.brandName.trim(),
                email: formData.email.trim(),
                password: formData.password,
                industry: formData.industry.trim(),
                website: formData.website.trim(),
                totalAudience: parseInt(formData.totalAudience, 10) || 0,
                phone: formData.phone.trim(),
            };

            const response = await fetch(`${API_BASE_URL}/signup-form-brand`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(data),
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
                throw new Error(errorData.message || 'Failed to create account');
            }

            const result = await response.json();

            showMessage('Account created successfully! Redirecting to plan selection...', 'success');

            setTimeout(() => {
                if (result.redirectTo) {
                    // Extract path from redirectTo URL if it's a full URL
                    const redirectPath = result.redirectTo.startsWith('http')
                        ? new URL(result.redirectTo).pathname + new URL(result.redirectTo).search
                        : result.redirectTo;
                    navigate(redirectPath);
                } else {
                    navigate('/signin');
                }
            }, 2000);
        } catch (error) {
            console.error('Error:', error);
            showMessage(error.message || 'An error occurred. Please try again.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formValid = isFormValid();

    return (
        <div className={styles['brand-signup-page']}>
            <div className={styles['signup-container']}>
                <div className={styles['form-container']}>
                    <div className={styles.logo}>CollabSync</div>
                    <h1>Brand Sign Up</h1>

                    <form onSubmit={handleSubmit} noValidate>
                        <div
                            className={`${styles.message} ${styles[message.type]}`}
                            style={{ display: message.text ? 'block' : 'none' }}
                        >
                            {message.text}
                        </div>

                        <div className={styles['form-group']}>
                            <label htmlFor="brandName">Brand Name</label>
                            <input
                                type="text"
                                id="brandName"
                                name="brandName"
                                placeholder="Your Brand Name"
                                value={formData.brandName}
                                onChange={handleInputChange}
                                onBlur={handleBlur}
                                className={errors.brandName ? styles.invalid : ''}
                                aria-invalid={errors.brandName ? 'true' : 'false'}
                            />
                            <small
                                className={styles['error-text']}
                                style={{ display: errors.brandName ? 'block' : 'none' }}
                            >
                                {errors.brandName}
                            </small>
                            <div className={styles['char-count']}>
                                {charCounts.brandName}
                            </div>
                        </div>

                        <div className={styles['form-group']}>
                            <label htmlFor="email">Email</label>
                            <input
                                type="text"
                                id="email"
                                name="email"
                                placeholder="Your Email"
                                value={formData.email}
                                onChange={handleInputChange}
                                onBlur={handleBlur}
                                className={errors.email ? styles.invalid : ''}
                                aria-invalid={errors.email ? 'true' : 'false'}
                            />
                            <small
                                className={styles['error-text']}
                                style={{ display: errors.email ? 'block' : 'none' }}
                            >
                                {errors.email}
                            </small>
                        </div>

                        <div className={styles['form-group']}>
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                placeholder="At least 8 chars, one digit, one special char"
                                value={formData.password}
                                onChange={handleInputChange}
                                onBlur={handleBlur}
                                className={errors.password ? styles.invalid : ''}
                                aria-invalid={errors.password ? 'true' : 'false'}
                            />
                            <small
                                className={styles['error-text']}
                                style={{ display: errors.password ? 'block' : 'none' }}
                            >
                                {errors.password}
                            </small>
                        </div>

                        <div className={styles['form-group']}>
                            <label htmlFor="industry">Industry</label>
                            <input
                                type="text"
                                id="industry"
                                name="industry"
                                placeholder="Your Industry"
                                value={formData.industry}
                                onChange={handleInputChange}
                                onBlur={handleBlur}
                                className={errors.industry ? styles.invalid : ''}
                                aria-invalid={errors.industry ? 'true' : 'false'}
                            />
                            <small
                                className={styles['error-text']}
                                style={{ display: errors.industry ? 'block' : 'none' }}
                            >
                                {errors.industry}
                            </small>
                            <div className={styles['char-count']}>
                                {charCounts.industry}
                            </div>
                        </div>

                        <div className={styles['form-group']}>
                            <label htmlFor="website">Website</label>
                            <input
                                type="text"
                                id="website"
                                name="website"
                                placeholder="Your Website URL"
                                value={formData.website}
                                onChange={handleInputChange}
                                onBlur={handleBlur}
                                className={errors.website ? styles.invalid : ''}
                                aria-invalid={errors.website ? 'true' : 'false'}
                            />
                            <small
                                className={styles['error-text']}
                                style={{ display: errors.website ? 'block' : 'none' }}
                            >
                                {errors.website}
                            </small>
                        </div>

                        <div className={styles['form-group']}>
                            <label htmlFor="totalAudience">Total Audience</label>
                            <input
                                type="number"
                                id="totalAudience"
                                name="totalAudience"
                                placeholder="Total Audience"
                                min="0"
                                value={formData.totalAudience}
                                onChange={handleInputChange}
                                onBlur={handleBlur}
                                className={errors.totalAudience ? styles.invalid : ''}
                                aria-invalid={errors.totalAudience ? 'true' : 'false'}
                            />
                            <small
                                className={styles['error-text']}
                                style={{ display: errors.totalAudience ? 'block' : 'none' }}
                            >
                                {errors.totalAudience}
                            </small>
                        </div>

                        <div className={styles['form-group']}>
                            <label htmlFor="phone">Contact Number</label>
                            <input
                                type="text"
                                id="phone"
                                name="phone"
                                placeholder="+1234567890"
                                value={formData.phone}
                                onChange={handleInputChange}
                                onBlur={handleBlur}
                                className={errors.phone ? styles.invalid : ''}
                                aria-invalid={errors.phone ? 'true' : 'false'}
                            />
                            <small
                                className={styles['error-text']}
                                style={{ display: errors.phone ? 'block' : 'none' }}
                            >
                                {errors.phone}
                            </small>
                        </div>

                        <button
                            type="submit"
                            disabled={!formValid || isSubmitting}
                            style={{
                                opacity: (!formValid || isSubmitting) ? 0.6 : 1,
                                cursor: (!formValid || isSubmitting) ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {isSubmitting ? 'Creating Account...' : 'Sign Up as Brand'}
                        </button>
                    </form>

                    <p className={styles['signin-link']}>
                        Already have an account?{' '}
                        <a href="/signin" onClick={(e) => {
                            e.preventDefault();
                            navigate('/signin');
                        }}>Sign in</a>
                    </p>

                    <a href="/role-selection" className={styles['back-link']} onClick={(e) => {
                        e.preventDefault();
                        navigate('/role-selection');
                    }}>
                        Back to Role Selection
                    </a>
                </div>

                <div className={styles['image-container']}>
                    <img src="/Sign/SighUp_for_both.svg" alt="Sign Up Illustration" />
                </div>
            </div>
        </div>
    );
};

export default BrandSignup;