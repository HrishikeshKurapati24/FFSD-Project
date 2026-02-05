import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../styles/landing/influencer_signup.module.css';
import { API_BASE_URL } from '../../services/api';

const InfluencerSignup = () => {
    const navigate = useNavigate();

    // Form fields state
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        platform: '',
        socialHandle: '',
        audience: '',
        niche: '',
        phone: ''
    });

    // Error messages state
    const [errors, setErrors] = useState({
        fullName: '',
        email: '',
        password: '',
        platform: '',
        socialHandle: '',
        audience: '',
        niche: '',
        phone: ''
    });

    // Character counts state
    const [charCounts, setCharCounts] = useState({
        fullName: '0/50 characters',
        socialHandle: '0/30 characters',
        niche: '0/50 characters'
    });

    // Message box state
    const [message, setMessage] = useState({ text: '', type: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Validation functions
    const validateFullName = (value) => {
        if (!value) return 'Full name is required';
        if (value.length < 2) return 'Full name must be at least 2 characters';
        if (value.length > 50) return 'Full name cannot exceed 50 characters';
        if (!/^[a-zA-Z\s]+$/.test(value)) return 'Full name can only contain letters and spaces';

        const vaguePatterns = [
            /^(test|testing|demo|sample|example|asdf|qwerty|123|abc|xyz)$/i,
            /^(user|admin|guest|temp|temporary)$/i,
            /^(name|firstname|lastname|fullname)$/i,
            /^[a-z]{1,3}$/i,
            /^[0-9]+$/,
            /^(.)\1+$/
        ];

        if (vaguePatterns.some(pattern => pattern.test(value.trim()))) {
            return 'Please enter a real name';
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

    const validatePlatform = (value) => {
        if (!value) return 'Please select a social media platform';
        return '';
    };

    const validateSocialHandle = (value) => {
        if (!value) return 'Social media handle is required';
        if (value.length < 2) return 'Handle must be at least 2 characters';
        if (value.length > 30) return 'Handle cannot exceed 30 characters';
        if (!/^[a-zA-Z0-9_.@]+$/.test(value)) return 'Handle can only contain letters, numbers, dots, underscores, and @';

        const vaguePatterns = [
            /^(test|testing|demo|sample|example|asdf|qwerty|123|abc|xyz)$/i,
            /^(user|admin|guest|temp|temporary)$/i,
            /^(handle|username|social|media)$/i,
            /^[a-z]{1,2}$/i,
            /^[0-9]+$/,
            /^(.)\1+$/,
            /^@?$/,
            /^@[a-z]{1,2}$/i
        ];

        if (vaguePatterns.some(pattern => pattern.test(value.trim()))) {
            return 'Please enter a real social media handle';
        }

        return '';
    };

    const validateAudience = (value) => {
        if (!value) return 'Audience size is required';
        const num = parseInt(value, 10);
        if (isNaN(num)) return 'Audience size must be a valid number';
        if (num < 100) return 'Audience size should be at least 100 followers';
        if (num > 1000000000) return 'Audience size cannot exceed 1 billion';
        return '';
    };

    const validateNiche = (value) => {
        if (!value) return 'Niche/Category is required';
        if (value.length < 2) return 'Niche must be at least 2 characters';
        if (value.length > 50) return 'Niche cannot exceed 50 characters';

        const vaguePatterns = [
            /^(test|testing|demo|sample|example|asdf|qwerty|123|abc|xyz)$/i,
            /^(niche|category|type|kind|sort)$/i,
            /^(general|other|misc|miscellaneous)$/i,
            /^[a-z]{1,2}$/i,
            /^[0-9]+$/,
            /^(.)\1+$/,
            /^(stuff|things|random|whatever)$/i
        ];

        if (vaguePatterns.some(pattern => pattern.test(value.trim()))) {
            return 'Please enter a specific or valid niche';
        }

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
            return 'Please enter a real phone number, not a test or placeholder number';
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
        if (name === 'fullName' && value.length > 50) {
            processedValue = value.slice(0, 50);
        } else if (name === 'socialHandle' && value.length > 30) {
            processedValue = value.slice(0, 30);
        } else if (name === 'niche' && value.length > 50) {
            processedValue = value.slice(0, 50);
        } else if (name === 'audience') {
            // Enforce numeric constraints for audience
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
        if (name === 'fullName') {
            updateCharCount('fullName', processedValue, 50);
        } else if (name === 'socialHandle') {
            updateCharCount('socialHandle', processedValue, 30);
        } else if (name === 'niche') {
            updateCharCount('niche', processedValue, 50);
        }

        // Live validation
        let errorMsg = '';
        if (name === 'fullName') {
            errorMsg = validateFullName(processedValue.trim());
        } else if (name === 'email') {
            errorMsg = validateEmail(processedValue.trim());
        } else if (name === 'password') {
            errorMsg = validatePassword(processedValue);
        } else if (name === 'platform') {
            errorMsg = validatePlatform(processedValue);
        } else if (name === 'socialHandle') {
            errorMsg = validateSocialHandle(processedValue.trim());
        } else if (name === 'audience') {
            errorMsg = validateAudience(processedValue);
        } else if (name === 'niche') {
            errorMsg = validateNiche(processedValue.trim());
        } else if (name === 'phone') {
            errorMsg = validatePhone(processedValue.trim());
        }

        setFieldError(name, errorMsg);
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        let errorMsg = '';

        if (name === 'fullName') {
            errorMsg = validateFullName(value.trim());
        } else if (name === 'email') {
            errorMsg = validateEmail(value.trim());
        } else if (name === 'password') {
            errorMsg = validatePassword(value);
        } else if (name === 'platform') {
            errorMsg = validatePlatform(value);
        } else if (name === 'socialHandle') {
            errorMsg = validateSocialHandle(value.trim());
        } else if (name === 'audience') {
            errorMsg = validateAudience(value);
        } else if (name === 'niche') {
            errorMsg = validateNiche(value.trim());
        } else if (name === 'phone') {
            errorMsg = validatePhone(value.trim());
        }

        setFieldError(name, errorMsg);
    };

    const isFormValid = () => {
        const fullNameMsg = validateFullName(formData.fullName.trim());
        const emailMsg = validateEmail(formData.email.trim());
        const passwordMsg = validatePassword(formData.password);
        const platformMsg = validatePlatform(formData.platform);
        const socialHandleMsg = validateSocialHandle(formData.socialHandle.trim());
        const audienceMsg = validateAudience(formData.audience);
        const nicheMsg = validateNiche(formData.niche.trim());
        const phoneMsg = validatePhone(formData.phone.trim());

        return !(fullNameMsg || emailMsg || passwordMsg || platformMsg ||
            socialHandleMsg || audienceMsg || nicheMsg || phoneMsg);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Final validation
        const fullNameMsg = validateFullName(formData.fullName.trim());
        const emailMsg = validateEmail(formData.email.trim());
        const passwordMsg = validatePassword(formData.password);
        const platformMsg = validatePlatform(formData.platform);
        const socialHandleMsg = validateSocialHandle(formData.socialHandle.trim());
        const audienceMsg = validateAudience(formData.audience);
        const nicheMsg = validateNiche(formData.niche.trim());
        const phoneMsg = validatePhone(formData.phone.trim());

        // Set all errors
        setErrors({
            fullName: fullNameMsg,
            email: emailMsg,
            password: passwordMsg,
            platform: platformMsg,
            socialHandle: socialHandleMsg,
            audience: audienceMsg,
            niche: nicheMsg,
            phone: phoneMsg
        });

        const hasErrors = Boolean(fullNameMsg || emailMsg || passwordMsg || platformMsg ||
            socialHandleMsg || audienceMsg || nicheMsg || phoneMsg);

        if (hasErrors) {
            showMessage('Please fix all errors before submitting', 'error');
            setIsSubmitting(false);
            return;
        }

        try {
            const data = {
                fullName: formData.fullName.trim(),
                email: formData.email.trim(),
                password: formData.password,
                platform: formData.platform,
                socialHandle: formData.socialHandle.trim(),
                audience: parseInt(formData.audience, 10),
                niche: formData.niche.trim(),
                phone: formData.phone.trim(),
            };

            const response = await fetch(`${API_BASE_URL}/signup-form-influencer`, {
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
        <div className={styles['influencer-signup-page']}>
            <div className={styles['signup-wrapper']}>
                <div className={styles['signup-left']}>
                    <div className={styles['brand-title']}>CollabSync</div>
                    <h2>Influencer Sign Up</h2>

                    <form onSubmit={handleSubmit} noValidate>
                        <div
                            className={`${styles.message} ${styles[message.type]}`}
                            style={{ display: message.text ? 'block' : 'none' }}
                        >
                            {message.text}
                        </div>

                        <label htmlFor="fullName">Full Name</label>
                        <input
                            type="text"
                            id="fullName"
                            name="fullName"
                            placeholder="Your Full Name"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            className={errors.fullName ? styles.invalid : ''}
                            aria-invalid={errors.fullName ? 'true' : 'false'}
                        />
                        <div
                            className={styles['error-message']}
                            style={{ display: errors.fullName ? 'block' : 'none' }}
                        >
                            {errors.fullName}
                        </div>
                        <div className={styles['char-count']}>{charCounts.fullName}</div>

                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="Your Email"
                            value={formData.email}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            className={errors.email ? styles.invalid : ''}
                            aria-invalid={errors.email ? 'true' : 'false'}
                        />
                        <div
                            className={styles['error-message']}
                            style={{ display: errors.email ? 'block' : 'none' }}
                        >
                            {errors.email}
                        </div>

                        <label htmlFor="password">Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                name="password"
                                placeholder="At least 8 characters, one digit, and one special character"
                                value={formData.password}
                                onChange={handleInputChange}
                                onBlur={handleBlur}
                                className={errors.password ? styles.invalid : ''}
                                aria-invalid={errors.password ? 'true' : 'false'}
                                style={{ paddingRight: '40px' }}
                            />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: '8px',
                                            top: '35%',
                                            transform: 'translateY(-50%)',
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            background: '#f0f0f0',
                                            border: '1px solid #ccc',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            color: '#666',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '0'
                                        }}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? '🙈' : '👁️'}
                                    </button>
                        </div>
                        <div
                            className={styles['error-message']}
                            style={{ display: errors.password ? 'block' : 'none' }}
                        >
                            {errors.password}
                        </div>

                        <label htmlFor="platform">Social Media Platform</label>
                        <select
                            id="platform"
                            name="platform"
                            value={formData.platform}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            className={errors.platform ? styles.invalid : ''}
                            aria-invalid={errors.platform ? 'true' : 'false'}
                        >
                            <option value="">Select Platform</option>
                            <option value="instagram">Instagram</option>
                            <option value="youtube">YouTube</option>
                            <option value="tiktok">TikTok</option>
                            <option value="facebook">Facebook</option>
                            <option value="twitter">Twitter</option>
                            <option value="linkedin">LinkedIn</option>
                        </select>
                        <div
                            className={styles['error-message']}
                            style={{ display: errors.platform ? 'block' : 'none' }}
                        >
                            {errors.platform}
                        </div>

                        <label htmlFor="socialHandle">Social Media Handle</label>
                        <input
                            type="text"
                            id="socialHandle"
                            name="socialHandle"
                            placeholder="@yourhandle"
                            value={formData.socialHandle}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            className={errors.socialHandle ? styles.invalid : ''}
                            aria-invalid={errors.socialHandle ? 'true' : 'false'}
                        />
                        <div
                            className={styles['error-message']}
                            style={{ display: errors.socialHandle ? 'block' : 'none' }}
                        >
                            {errors.socialHandle}
                        </div>
                        <div className={styles['char-count']}>{charCounts.socialHandle}</div>

                        <label htmlFor="audience">Audience Size</label>
                        <input
                            type="number"
                            id="audience"
                            name="audience"
                            placeholder="e.g. 10000"
                            value={formData.audience}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            className={errors.audience ? styles.invalid : ''}
                            aria-invalid={errors.audience ? 'true' : 'false'}
                        />
                        <div
                            className={styles['error-message']}
                            style={{ display: errors.audience ? 'block' : 'none' }}
                        >
                            {errors.audience}
                        </div>

                        <label htmlFor="niche">Niche/Category</label>
                        <input
                            type="text"
                            id="niche"
                            name="niche"
                            placeholder="e.g. fashion, tech, travel"
                            value={formData.niche}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            className={errors.niche ? styles.invalid : ''}
                            aria-invalid={errors.niche ? 'true' : 'false'}
                        />
                        <div
                            className={styles['error-message']}
                            style={{ display: errors.niche ? 'block' : 'none' }}
                        >
                            {errors.niche}
                        </div>
                        <div className={styles['char-count']}>{charCounts.niche}</div>

                        <label htmlFor="phone">Contact Number</label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            placeholder="+1234567890 or 1234567890"
                            value={formData.phone}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            className={errors.phone ? styles.invalid : ''}
                            aria-invalid={errors.phone ? 'true' : 'false'}
                        />
                        <div
                            className={styles['error-message']}
                            style={{ display: errors.phone ? 'block' : 'none' }}
                        >
                            {errors.phone}
                        </div>

                        <button
                            type="submit"
                            disabled={!formValid || isSubmitting}
                            style={{
                                opacity: (!formValid || isSubmitting) ? 0.6 : 1,
                                cursor: (!formValid || isSubmitting) ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {isSubmitting ? 'Creating Account...' : 'Sign Up as Influencer'}
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

                <div className={styles['signup-right']}>
                    <img src="/Sign/SighUp_for_both.svg" alt="Sign Up Illustration" />
                </div>
            </div>
        </div>
    );
};

export default InfluencerSignup;