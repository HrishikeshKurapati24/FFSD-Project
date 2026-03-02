import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdmin } from '../contexts/AdminContext';
import { PAGE_ACCESS } from '../constants/adminAccess';

/**
 * AdminProtectedRoute — guards every admin page.
 *
 * 1. Not authenticated  → redirect to /admin/login
 * 2. Authenticated but role lacks permission  → Redirect to /admin/dashboard
 * 3. Authenticated with permission  → render page
 */
const AdminProtectedRoute = ({ children }) => {
    const location = useLocation();
    const { admin, loading, isAuthenticated } = useAdmin();

    // Show spinner while verifying session
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                background: '#0f172a',
                color: '#94a3b8',
                fontFamily: 'sans-serif',
                fontSize: '16px',
                gap: '12px'
            }}>
                <div style={{
                    width: '24px',
                    height: '24px',
                    border: '3px solid #334155',
                    borderTop: '3px solid #6366f1',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                Verifying access...
            </div>
        );
    }

    // Not authenticated — redirect to login
    if (!isAuthenticated) {
        return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
    }

    // If already at dashboard, allow it (dashboard is the fallback)
    if (location.pathname === '/admin/dashboard') {
        return children;
    }

    // Check page-level role access
    const allowedRoles = PAGE_ACCESS[location.pathname] ?? ['superadmin'];
    const hasAccess = allowedRoles.includes(admin?.role) || admin?.role === 'superadmin';

    if (!hasAccess) {
        // Instead of showing Access Denied, redirect to dashboard
        return <Navigate to="/admin/dashboard" replace />;
    }

    return children;
};

export default AdminProtectedRoute;
