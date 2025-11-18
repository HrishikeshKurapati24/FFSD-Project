import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../styles/admin/login.module.css';

export default function Login() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        rememberMe: false
    });
    const [errors, setErrors] = useState({
        username: '',
        password: ''
    });
    const [showModal, setShowModal] = useState(false);
    const [resetFormData, setResetFormData] = useState({
        username: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [resetErrors, setResetErrors] = useState({
        username: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        const storedUsername = localStorage.getItem('adminUsername');
        if (storedUsername) {
            setFormData(prev => ({
                ...prev,
                username: storedUsername,
                rememberMe: true
            }));
        }
    }, []);

    const validateUsername = (value) => {
        if (value.trim().length < 3) {
            return "Username must be at least 3 characters";
        }
        return '';
    };

    const validatePassword = (value) => {
        if (value.trim().length < 6) {
            return "Password must be at least 6 characters";
        }
        return '';
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        const fieldValue = type === 'checkbox' ? checked : value;
        
        setFormData(prev => ({
            ...prev,
            [name]: fieldValue
        }));

        // Live validation
        if (name === 'username') {
            const error = validateUsername(value);
            setErrors(prev => ({ ...prev, username: error }));
        } else if (name === 'password') {
            const error = validatePassword(value);
            setErrors(prev => ({ ...prev, password: error }));
        }
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();

        const usernameError = validateUsername(formData.username);
        const passwordError = validatePassword(formData.password);

        setErrors({
            username: usernameError,
            password: passwordError
        });

        if (usernameError || passwordError) {
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/admin/login/verify', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include', // IMPORTANT: Include cookies to receive the JWT token
                body: JSON.stringify({
                    username: formData.username,
                    password: formData.password,
                    rememberMe: formData.rememberMe
                })
            });

            const result = await response.json();

            if (result.success) {
                if (formData.rememberMe) {
                    localStorage.setItem('adminUsername', formData.username);
                } else {
                    localStorage.removeItem('adminUsername');
                }
                if (result.redirect) {
                    window.location.href = result.redirect;
                } else {
                    navigate('/admin/dashboard');
                }
            } else {
                alert(result.message || 'Login failed');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred during login');
        }
    };

    const handleResetInputChange = (e) => {
        const { name, value } = e.target;
        setResetFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Live validation
        if (name === 'username') {
            const error = validateUsername(value);
            setResetErrors(prev => ({ ...prev, username: error }));
        } else if (name === 'newPassword') {
            const error = validatePassword(value);
            setResetErrors(prev => ({ ...prev, newPassword: error }));
        } else if (name === 'confirmPassword') {
            if (value !== resetFormData.newPassword) {
                setResetErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match" }));
            } else {
                setResetErrors(prev => ({ ...prev, confirmPassword: '' }));
            }
        }
    };

    const handleResetSubmit = async (e) => {
        e.preventDefault();

        const usernameError = validateUsername(resetFormData.username);
        const passwordError = validatePassword(resetFormData.newPassword);
        const confirmError = resetFormData.newPassword !== resetFormData.confirmPassword 
            ? "Passwords do not match" 
            : '';

        setResetErrors({
            username: usernameError,
            newPassword: passwordError,
            confirmPassword: confirmError
        });

        if (usernameError || passwordError || confirmError) {
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/admin/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: resetFormData.username,
                    newPassword: resetFormData.newPassword
                })
            });

            const result = await response.json();

            if (result.success) {
                alert('Password reset successful! Please login with your new password.');
                setShowModal(false);
                setResetFormData({
                    username: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                setResetErrors({
                    username: '',
                    newPassword: '',
                    confirmPassword: ''
                });
            } else {
                alert(result.message || 'Failed to reset password');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while resetting password');
        }
    };

    const closeModal = (e) => {
        if (e.target.id === 'forgotPasswordModal' || e.target.className.includes('close')) {
            setShowModal(false);
        }
    };

    return (
        <div className={styles.loginContainer}>
            <div className={styles.loginBox}>
                <div className={styles.logo}>
                    <h1>CollabSync</h1>
                    <p>Admin Portal for Influencer & Brand Collaboration</p>
                </div>
                <h2>Admin Login</h2>
                <form id="loginForm" onSubmit={handleLoginSubmit}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="username">Admin Username</label>
                        <div className={styles.inputWrapper}>
                            <i className="fas fa-user"></i>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                placeholder="Enter your username"
                                value={formData.username}
                                onChange={handleInputChange}
                                autoComplete="username"
                                required
                            />
                        </div>
                        {errors.username && <small className={styles.errorMessage}>{errors.username}</small>}
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="password">Password</label>
                        <div className={styles.inputWrapper}>
                            <i className="fas fa-lock"></i>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleInputChange}
                                autoComplete="current-password"
                                required
                            />
                        </div>
                        {errors.password && <small className={styles.errorMessage}>{errors.password}</small>}
                    </div>
                    <div className={styles.options}>
                        <label className={styles.rememberMe}>
                            <input
                                type="checkbox"
                                id="rememberMe"
                                name="rememberMe"
                                checked={formData.rememberMe}
                                onChange={handleInputChange}
                            />
                            Remember Me
                        </label>
                        <a
                            href="#"
                            className={styles.forgotPassword}
                            onClick={(e) => {
                                e.preventDefault();
                                setShowModal(true);
                            }}
                        >
                            Forgot Password?
                        </a>
                    </div>
                    <button type="submit" className={styles.loginBtn}>Log In</button>
                </form>
                <p className={styles.supportText}>
                    Need help? Contact <a href="mailto:support@CollabSync.com">support@collabsync.com</a>
                </p>
            </div>

            {showModal && (
                <div
                    id="forgotPasswordModal"
                    className={styles.modal}
                    onClick={closeModal}
                >
                    <div className={styles.modalContent}>
                        <span className={styles.close} onClick={() => setShowModal(false)}>&times;</span>
                        <h2>Reset Password</h2>
                        <form id="forgotPasswordForm" onSubmit={handleResetSubmit}>
                            <div className={styles.inputGroup}>
                                <label htmlFor="resetUsername">Username</label>
                                <div className={styles.inputWrapper}>
                                    <i className="fas fa-user"></i>
                                    <input
                                        type="text"
                                        id="resetUsername"
                                        name="username"
                                        placeholder="Enter your username"
                                        value={resetFormData.username}
                                        onChange={handleResetInputChange}
                                        autoComplete="username"
                                        required
                                    />
                                </div>
                                {resetErrors.username && <small className={styles.errorMessage}>{resetErrors.username}</small>}
                            </div>
                            <div className={styles.inputGroup}>
                                <label htmlFor="newPassword">New Password</label>
                                <div className={styles.inputWrapper}>
                                    <i className="fas fa-lock"></i>
                                    <input
                                        type="password"
                                        id="newPassword"
                                        name="newPassword"
                                        placeholder="Enter new password"
                                        value={resetFormData.newPassword}
                                        onChange={handleResetInputChange}
                                        autoComplete="new-password"
                                        required
                                    />
                                </div>
                                {resetErrors.newPassword && <small className={styles.errorMessage}>{resetErrors.newPassword}</small>}
                            </div>
                            <div className={styles.inputGroup}>
                                <label htmlFor="confirmPassword">Confirm Password</label>
                                <div className={styles.inputWrapper}>
                                    <i className="fas fa-lock"></i>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        placeholder="Confirm new password"
                                        value={resetFormData.confirmPassword}
                                        onChange={handleResetInputChange}
                                        autoComplete="new-password"
                                        required
                                    />
                                </div>
                                {resetErrors.confirmPassword && <small className={styles.errorMessage}>{resetErrors.confirmPassword}</small>}
                            </div>
                            <button type="submit" className={styles.resetBtn}>Reset Password</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
