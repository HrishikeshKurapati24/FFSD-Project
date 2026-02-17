import React, { useState, useEffect } from 'react';
import styles from '../../styles/admin/InfluencerList.module.css';
import adminStyles from '../../styles/admin/admin_dashboard.module.css';
import AdminNavbar from '../../components/admin/AdminNavbar';
import { API_BASE_URL } from '../../services/api';

export default function InfluencerList() {
    const [influencers, setInfluencers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState({ name: 'Admin' });
    const [notifications, setNotifications] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortDirection, setSortDirection] = useState('desc'); // 'desc' or 'asc'

    useEffect(() => {
        fetchUserData();
        fetchVerifiedInfluencers();
        fetchNotifications();
    }, []);

    const fetchUserData = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/verify`, {
                headers: { 'Accept': 'application/json' },
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                if (data.authenticated) setUser(data.user);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    const fetchVerifiedInfluencers = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/verified-influencers`, {
                headers: { 'Accept': 'application/json' },
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setInfluencers(data.influencers);
                }
            }
        } catch (error) {
            console.error('Error fetching influencers:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchNotifications = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/notifications`, {
                headers: { 'Accept': 'application/json' },
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                if (data.success) setNotifications(data.notifications);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const filteredInfluencers = influencers.filter(inf => {
        const searchVal = searchTerm.toLowerCase();
        const infName = (inf.displayName || inf.fullName || '').toLowerCase();
        const email = (inf.email || '').toLowerCase();
        const platform = (inf.platform || '').toLowerCase();
        const categories = (inf.categories || []).map(c => c.toLowerCase());

        return infName.includes(searchVal) ||
            email.includes(searchVal) ||
            platform.includes(searchVal) ||
            categories.some(cat => cat.includes(searchVal));
    }).sort((a, b) => {
        const audA = a.audienceSize || 0;
        const audB = b.audienceSize || 0;
        return sortDirection === 'desc' ? audB - audA : audA - audB;
    });

    return (
        <AdminNavbar user={user} notifications={notifications}>
            <div className={adminStyles.mainContent}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <h1>Verified Influencers</h1>
                        <div className={styles.headerActions}>
                            <div className={styles.sortControls}>
                                <span className={styles.sortLabel}>Sort by Audience:</span>
                                <select
                                    className={styles.sortSelect}
                                    value={sortDirection}
                                    onChange={(e) => setSortDirection(e.target.value)}
                                >
                                    <option value="desc">High to Low</option>
                                    <option value="asc">Low to High</option>
                                </select>
                            </div>
                            <div className={styles.searchBar}>
                                <i className="fas fa-search"></i>
                                <input
                                    type="text"
                                    placeholder="Search influencers, categories, or platforms..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className={styles.loader}>Loading...</div>
                    ) : (
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Influencer</th>
                                        <th>Email</th>
                                        <th>Category</th>
                                        <th>Platform</th>
                                        <th>Audience</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredInfluencers.length > 0 ? (
                                        filteredInfluencers.map((inf) => (
                                            <tr key={inf._id}>
                                                <td>
                                                    <div className={styles.infInfo}>
                                                        {inf.profilePicUrl ? (
                                                            <img src={inf.profilePicUrl} alt="" className={styles.avatar} onError={(e) => e.target.style.display = 'none'} />
                                                        ) : (
                                                            <div className={styles.avatarPlaceholder}>
                                                                {(inf.displayName || inf.fullName || 'I').charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                        <span className={styles.infName}>{inf.displayName || inf.fullName}</span>
                                                    </div>
                                                </td>
                                                <td>{inf.email}</td>
                                                <td>
                                                    <div className={styles.categoriesContainer}>
                                                        {inf.categories && inf.categories.length > 0 ? (
                                                            inf.categories.map((cat, i) => (
                                                                <span key={i} className={styles.categoryBadge}>{cat}</span>
                                                            ))
                                                        ) : (
                                                            <span className={styles.categoryBadge}>{inf.niche || 'N/A'}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>{inf.platform || 'N/A'}</td>
                                                <td>{(inf.audienceSize || 0).toLocaleString()}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className={styles.noData}>No verified influencers found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AdminNavbar>
    );
}
