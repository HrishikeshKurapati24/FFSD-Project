import React, { useState, useEffect } from 'react';
import styles from '../../styles/admin/settings.module.css';

export default function Settings() {
    const [user, setUser] = useState({ name: '', email: '' });
    const [profileData, setProfileData] = useState({ name: '', email: '' });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [notificationSettings, setNotificationSettings] = useState({
        emailNotifications: false,
        browserNotifications: false
    });

    useEffect(() => {
        // Fetch user data from backend
        const fetchUserData = async () => {
            try {
                const response = await fetch('/admin/verify');
                if (response.ok) {
                    const data = await response.json();
                    if (data.authenticated && data.user) {
                        setUser(data.user);
                        setProfileData({
                            name: data.user.name || data.user.username || '',
                            email: data.user.email || ''
                        });
                    }
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };
        fetchUserData();
    }, []);

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'profile',
                    ...profileData
                })
            });
            const result = await response.json();
            if (result.success) {
                alert('Profile updated successfully!');
            } else {
                alert(result.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('An error occurred while updating profile');
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert('New passwords do not match');
            return;
        }
        try {
            const response = await fetch('/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'password',
                    ...passwordData
                })
            });
            const result = await response.json();
            if (result.success) {
                alert('Password changed successfully!');
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
            } else {
                alert(result.message || 'Failed to change password');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            alert('An error occurred while changing password');
        }
    };

    const handleNotificationSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'notifications',
                    ...notificationSettings
                })
            });
            const result = await response.json();
            if (result.success) {
                alert('Notification preferences saved!');
            } else {
                alert(result.message || 'Failed to save preferences');
            }
        } catch (error) {
            console.error('Error saving preferences:', error);
            alert('An error occurred while saving preferences');
        }
    };

    return (
        <div className={styles.settingsContainer}>
            <h1><i className="fas fa-cog"></i> Settings</h1>

            <div className={styles.settingsSection}>
                <h2>Profile Settings</h2>
                <form id="profile-form" onSubmit={handleProfileSubmit}>
                    <div className={styles.formGroup}>
                        <label htmlFor="name">Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={profileData.name}
                            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="profile-picture">Profile Picture</label>
                        <input type="file" id="profile-picture" name="profile-picture" accept="image/*" />
                    </div>
                    <button type="submit">Save Profile</button>
                </form>
            </div>

            <div className={styles.settingsSection}>
                <h2>Password Settings</h2>
                <form id="password-form" onSubmit={handlePasswordSubmit}>
                    <div className={styles.formGroup}>
                        <label htmlFor="current-password">Current Password</label>
                        <input
                            type="password"
                            id="current-password"
                            name="current-password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="new-password">New Password</label>
                        <input
                            type="password"
                            id="new-password"
                            name="new-password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="confirm-password">Confirm New Password</label>
                        <input
                            type="password"
                            id="confirm-password"
                            name="confirm-password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        />
                    </div>
                    <button type="submit">Change Password</button>
                </form>
            </div>

            <div className={styles.settingsSection}>
                <h2>Notification Settings</h2>
                <form id="notification-form" onSubmit={handleNotificationSubmit}>
                    <div className={`${styles.formGroup} ${styles.checkbox}`}>
                        <input
                            type="checkbox"
                            id="email-notifications"
                            name="email-notifications"
                            checked={notificationSettings.emailNotifications}
                            onChange={(e) => setNotificationSettings({
                                ...notificationSettings,
                                emailNotifications: e.target.checked
                            })}
                        />
                        <label htmlFor="email-notifications">Email Notifications</label>
                    </div>
                    <div className={`${styles.formGroup} ${styles.checkbox}`}>
                        <input
                            type="checkbox"
                            id="browser-notifications"
                            name="browser-notifications"
                            checked={notificationSettings.browserNotifications}
                            onChange={(e) => setNotificationSettings({
                                ...notificationSettings,
                                browserNotifications: e.target.checked
                            })}
                        />
                        <label htmlFor="browser-notifications">Browser Notifications</label>
                    </div>
                    <button type="submit">Save Preferences</button>
                </form>
            </div>
        </div>
    );
}
