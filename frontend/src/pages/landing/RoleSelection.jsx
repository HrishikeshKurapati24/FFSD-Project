import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../styles/landing/role_selection.module.css';

const RoleSelection = () => {
    const navigate = useNavigate();

    const handleRoleSelection = (role) => {
        if (role === 'influencer') {
            navigate('/influencer/Signup');
        } else if (role === 'brand') {
            navigate('/brand/Signup');
        } else if (role === 'customer') {
            navigate('/customer/signup');
        }
    };

    return (
        <div className={styles['role-selection-page']}>
            <div className={styles['role-container']}>
                {/* Left Section */}
                <div className={styles['text-container']}>
                    <div className={styles.logo}>CollabSync</div>
                    <h1>Sign Up</h1>
                    <p>Please select your role to continue:</p>

                    <div className={styles['role-buttons']}>
                        <button
                            className={`${styles['role-btn']} ${styles['influencer-btn']}`}
                            onClick={() => handleRoleSelection('influencer')}
                        >
                            I'm an Influencer
                        </button>
                        <button
                            className={`${styles['role-btn']} ${styles['brand-btn']}`}
                            onClick={() => handleRoleSelection('brand')}
                        >
                            I'm a Brand
                        </button>
                        <button
                            className={`${styles['role-btn']} ${styles['customer-btn']}`}
                            onClick={() => handleRoleSelection('customer')}
                        >
                            I'm a Customer
                        </button>
                    </div>

                    <a href="/" className={styles['back-link']} onClick={(e) => {
                        e.preventDefault();
                        navigate('/');
                    }}>
                        Back to Home
                    </a>
                </div>

                {/* Image Section */}
                <div className={styles['image-container']}>
                    <img src="/Sign/SighUp_for_both.svg" alt="Sign Up Illustration" />
                </div>
            </div>
        </div>
    );
};

export default RoleSelection;