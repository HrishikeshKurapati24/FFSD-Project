import React, { useState, useEffect } from 'react';
import styles from '../../styles/admin/customer_management.module.css';
import adminStyles from '../../styles/admin/admin_dashboard.module.css';
import AdminNavbar from '../../components/admin/AdminNavbar';
import { API_BASE_URL } from '../../services/api';

const CustomerMonitoring = () => {
    const [user, setUser] = useState({ name: 'Admin' });

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/verify`, {
                headers: { 'Accept': 'application/json' },
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                if (data.authenticated && data.user) {
                    setUser(data.user);
                }
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    return (
        <div className={adminStyles.adminDashboardContainer}>
            <AdminNavbar user={user} />

            <main className={adminStyles.mainContent}>
                <header className={adminStyles.dashboardHeader}>
                    <div className={adminStyles.headerTitle}>
                        <h1>Customer Monitoring</h1>
                        <p>Monitor active customer sessions and activities</p>
                    </div>
                </header>

                <div className={styles.managementSection}>
                    <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                        <i className="fas fa-desktop" style={{ fontSize: '3rem', marginBottom: '20px', color: '#d1d5db' }}></i>
                        <h3>Real-time Monitoring</h3>
                        <p>This feature is currently under development.</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CustomerMonitoring;
