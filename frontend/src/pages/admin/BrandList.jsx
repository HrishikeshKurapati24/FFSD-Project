import React, { useState, useEffect } from 'react';
import styles from '../../styles/admin/BrandList.module.css';
import adminStyles from '../../styles/admin/admin_dashboard.module.css';
import AdminNavbar from '../../components/admin/AdminNavbar';
import { API_BASE_URL } from '../../services/api';

export default function BrandList() {
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState({ name: 'Admin' });
    const [notifications, setNotifications] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortDirection, setSortDirection] = useState('desc'); // 'desc' or 'asc'

    useEffect(() => {
        fetchUserData();
        fetchVerifiedBrands();
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

    const fetchVerifiedBrands = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/verified-brands`, {
                headers: { 'Accept': 'application/json' },
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setBrands(data.brands);
                }
            }
        } catch (error) {
            console.error('Error fetching brands:', error);
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

    const filteredBrands = brands.filter(brand => {
        const searchVal = searchTerm.toLowerCase();
        const brandName = (brand.brandName || brand.name || '').toLowerCase();
        const email = (brand.email || '').toLowerCase();
        const categories = (brand.categories || []).map(c => c.toLowerCase());

        return brandName.includes(searchVal) ||
            email.includes(searchVal) ||
            categories.some(cat => cat.includes(searchVal));
    }).sort((a, b) => {
        const audA = a.totalAudience || 0;
        const audB = b.totalAudience || 0;
        return sortDirection === 'desc' ? audB - audA : audA - audB;
    });

    return (
        <AdminNavbar user={user} notifications={notifications}>
            <div className={adminStyles.mainContent}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <h1>Verified Brands</h1>
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
                                    placeholder="Search brands or categories..."
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
                                        <th>Brand</th>
                                        <th>Email</th>
                                        <th>Website</th>
                                        <th>Category</th>
                                        <th>Audience</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBrands.length > 0 ? (
                                        filteredBrands.map((brand) => (
                                            <tr key={brand._id}>
                                                <td>
                                                    <div className={styles.brandInfo}>
                                                        {brand.logoUrl ? (
                                                            <img src={brand.logoUrl} alt="" className={styles.logo} onError={(e) => e.target.style.display = 'none'} />
                                                        ) : (
                                                            <div className={styles.avatar}>
                                                                {(brand.brandName || brand.name || 'B').charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                        <span className={styles.brandName}>{brand.brandName || brand.name}</span>
                                                    </div>
                                                </td>
                                                <td>{brand.email}</td>
                                                <td>
                                                    {brand.website ? (
                                                        <a href={brand.website} target="_blank" rel="noopener noreferrer" className={styles.link}>
                                                            {brand.website.replace(/^https?:\/\//, '')}
                                                        </a>
                                                    ) : 'N/A'}
                                                </td>
                                                <td>
                                                    <div className={styles.categoriesContainer}>
                                                        {brand.categories && brand.categories.length > 0 ? (
                                                            brand.categories.map((cat, i) => (
                                                                <span key={i} className={styles.categoryBadge}>{cat}</span>
                                                            ))
                                                        ) : (
                                                            <span className={styles.categoryBadge}>{brand.industry || 'N/A'}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>{(brand.totalAudience || 0).toLocaleString()}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className={styles.noData}>No verified brands found.</td>
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
