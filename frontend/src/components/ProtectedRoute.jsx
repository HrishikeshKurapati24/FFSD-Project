import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkAuth } from '../utils/auth';

/**
 * ProtectedRoute component that checks authentication before rendering child components
 * @param {React.ReactNode} children - Child components to render if authenticated
 * @param {string} requiredUserType - Optional: 'brand' or 'influencer' to restrict access
 * @param {React.ReactNode} fallback - Optional: Component to show while checking auth
 */
const ProtectedRoute = ({ children, requiredUserType = null, fallback = null }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const verifyAuth = async () => {
            try {
                setIsLoading(true);
                const authResult = await checkAuth();

                if (authResult.authenticated && authResult.user) {
                    // Check if user type is required and matches
                    if (requiredUserType && authResult.user.userType !== requiredUserType) {
                        // User doesn't have required role
                        console.log(`Access denied: Required ${requiredUserType}, but user is ${authResult.user.userType}`);
                        navigate('/signin');
                        return;
                    }

                    setIsAuthenticated(true);
                    setUser(authResult.user);
                } else {
                    // Not authenticated - redirect to login
                    navigate('/signin');
                }
            } catch (error) {
                console.error('Error verifying authentication:', error);
                navigate('/signin');
            } finally {
                setIsLoading(false);
            }
        };

        verifyAuth();
    }, [navigate, requiredUserType]);

    // Show loading state while checking authentication
    if (isLoading) {
        if (fallback) {
            return fallback;
        }
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '100vh' 
            }}>
                <div>Loading...</div>
            </div>
        );
    }

    // If authenticated, render children with user prop
    if (isAuthenticated && user) {
        // Clone children and pass user as prop if it's a single element
        if (React.isValidElement(children)) {
            return React.cloneElement(children, { user });
        }
        return children;
    }

    // Not authenticated - this shouldn't render as we redirect above
    return null;
};

export default ProtectedRoute;
