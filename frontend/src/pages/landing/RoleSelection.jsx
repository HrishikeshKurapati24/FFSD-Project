import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/role_selection.css';

const RoleSelection = () => {
    const navigate = useNavigate();

    const handleRoleSelection = (role) => {
        if (role === 'influencer') {
            navigate('/influencer/Signup');
        } else if (role === 'brand') {
            navigate('/brand/Signup');
        }
    };

    return (
        <div className="role-selection-page">
            <div className="role-container">
                {/* Left Section */}
                <div className="text-container">
                    <div className="logo">CollabSync</div>
                    <h1>Sign Up</h1>
                    <p>Please select your role to continue:</p>

                    <div className="role-buttons">
                        <button
                            className="role-btn influencer-btn"
                            onClick={() => handleRoleSelection('influencer')}
                        >
                            I'm an Influencer
                        </button>
                        <button
                            className="role-btn brand-btn"
                            onClick={() => handleRoleSelection('brand')}
                        >
                            I'm a Brand
                        </button>
                    </div>
                </div>

                {/* Image Section */}
                <div className="image-container">
                    <img src="/Sign/SighUp_for_both.svg" alt="Sign Up Illustration" />
                </div>
            </div>
        </div>
    );
};

export default RoleSelection;