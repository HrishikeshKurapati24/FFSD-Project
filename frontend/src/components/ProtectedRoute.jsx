import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useCustomer } from '../contexts/CustomerContext';
import { useBrand } from '../contexts/BrandContext';
import { useInfluencer } from '../contexts/InfluencerContext';

/**
 * ProtectedRoute component that checks authentication before rendering child components
 * @param {React.ReactNode} children - Child components to render if authenticated
 * @param {string} requiredRole - Required role: 'customer', 'brand', or 'influencer'
 */
const ProtectedRoute = ({ requiredRole = 'customer', children }) => {
    const location = useLocation();
    const { customer, loading: customerLoading } = useCustomer();
    const { brand, loading: brandLoading } = useBrand();
    const { influencer, loading: influencerLoading } = useInfluencer();

    // Determine loading state based on required role
    const isLoading =
        (requiredRole === 'customer' && customerLoading) ||
        (requiredRole === 'brand' && brandLoading) ||
        (requiredRole === 'influencer' && influencerLoading);

    // Show loading state while checking authentication
    if (isLoading) {
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

    // Check authentication based on required role
    if (requiredRole === 'customer') {
        if (!customer) {
            return <Navigate to="/signin" state={{ from: location.pathname }} replace />;
        }
    } else if (requiredRole === 'brand') {
        if (!brand) {
            return <Navigate to="/signin" state={{ from: location.pathname }} replace />;
        }
    } else if (requiredRole === 'influencer') {
        if (!influencer) {
            return <Navigate to="/signin" state={{ from: location.pathname }} replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
