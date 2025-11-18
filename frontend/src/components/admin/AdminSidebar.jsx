import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import adminStyles from '../../styles/admin/admin_dashboard.module.css';

const AdminSidebar = ({ isOpen, onClose }) => {
    const location = useLocation();

    const menuItems = [
        {
            path: '/admin/dashboard',
            icon: 'fas fa-tachometer-alt',
            label: 'Dashboard'
        },
        {
            path: '/admin/user_management',
            icon: 'fas fa-users',
            label: 'User Management'
        },
        {
            path: '/admin/customer-management',
            icon: 'fas fa-shopping-cart',
            label: 'Customer Management'
        },
        {
            path: '/admin/collaboration_monitoring',
            icon: 'fas fa-handshake',
            label: 'Collaboration Monitoring'
        },
        {
            path: '/admin/payment_verification',
            icon: 'fas fa-money-check',
            label: 'Payment Verification'
        },
        {
            path: '/admin/feedback_and_moderation',
            icon: 'fas fa-comments',
            label: 'Feedback & Moderation'
        },
        {
            path: '/admin/brand-analytics',
            icon: 'fas fa-building',
            label: 'Brand Analytics'
        },
        {
            path: '/admin/influencer-analytics',
            icon: 'fas fa-star',
            label: 'Influencer Analytics'
        },
        {
            path: '/admin/campaign-analytics',
            icon: 'fas fa-chart-line',
            label: 'Campaign Analytics'
        }
    ];

    const isActive = (path) => {
        return location.pathname === path;
    };

    return (
        <div className={`${adminStyles.sidebar} ${isOpen ? adminStyles.active : ''}`} id="sidebar">
            <div className={adminStyles.menu}>
                <ul className={adminStyles.list}>
                    {menuItems.map((item) => (
                        <li key={item.path} className={isActive(item.path) ? adminStyles.active : ''}>
                            <Link to={item.path} onClick={onClose}>
                                <i className={item.icon}></i>
                                <span>{item.label}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default AdminSidebar;