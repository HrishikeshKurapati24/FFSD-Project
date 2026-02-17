import React, { useState, useEffect } from 'react';
import styles from '../../styles/admin/collaboration_monitoring.module.css';
import adminStyles from '../../styles/admin/admin_dashboard.module.css';
import AdminNavbar from '../../components/admin/AdminNavbar';
import InfluencerDeliverablesModal from '../../components/admin/InfluencerDeliverablesModal';
import { API_BASE_URL } from '../../services/api';

export default function CollaborationMonitoring() {
    const [user, setUser] = useState({ name: 'Admin' });
    const [collaborations, setCollaborations] = useState([]);
    const [filteredCollaborations, setFilteredCollaborations] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [sortOrder, setSortOrder] = useState('desc'); // 'desc' or 'asc' for revenue

    // Modal State
    const [selectedCollaboration, setSelectedCollaboration] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        fetchUserData();
        fetchCollaborations();
        fetchNotifications();
    }, []);

    useEffect(() => {
        filterAndSortCollaborations();
    }, [filters, collaborations, sortOrder]);

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

    const fetchNotifications = async () => {
        // Implementation reused from existing code if needed, or simplified
        try {
            const response = await fetch(`${API_BASE_URL}/admin/notifications`, {
                headers: { 'Accept': 'application/json' },
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.notifications) {
                    setNotifications(data.notifications);
                }
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const fetchCollaborations = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/collaboration_monitoring`, {
                headers: { 'Accept': 'application/json' },
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.collaborations) {
                    setCollaborations(data.collaborations);
                }
            }
        } catch (error) {
            console.error('Error fetching collaborations:', error);
        }
    };

    const filterAndSortCollaborations = () => {
        let result = [...collaborations];

        // Filter
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            result = result.filter(collab => {
                const title = (collab.title || '').toLowerCase();
                const brand = (collab.brand || '').toLowerCase();
                const influencers = (collab.influencers || []).map(inf => (inf.influencer || '').toLowerCase());

                return title.includes(searchLower) ||
                    brand.includes(searchLower) ||
                    influencers.some(inf => inf.includes(searchLower));
            });
        }

        if (filters.status !== 'all') {
            result = result.filter(collab => {
                const status = (collab.status || '').toLowerCase();
                return status === filters.status.toLowerCase();
            });
        }

        if (filters.startDate) {
            result = result.filter(collab => {
                if (!collab.startDate) return false;
                return new Date(collab.startDate) >= new Date(filters.startDate);
            });
        }

        if (filters.endDate) {
            result = result.filter(collab => {
                if (!collab.endDate) return false;
                return new Date(collab.endDate) <= new Date(filters.endDate);
            });
        }

        // Sort by Revenue
        result.sort((a, b) => {
            const revA = a.revenue || 0;
            const revB = b.revenue || 0;
            return sortOrder === 'desc' ? revB - revA : revA - revB;
        });

        setFilteredCollaborations(result);
    };

    const handleFilterChange = (name, value) => {
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const toggleSortOrder = () => {
        setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    };

    const resetFilters = () => {
        setFilters({ search: '', status: 'all', startDate: '', endDate: '' });
        setSortOrder('desc');
    };

    const handleViewDetails = async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/collaboration_monitoring/${id}`, {
                headers: { 'Accept': 'application/json' },
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                setSelectedCollaboration(data);
                setIsModalOpen(true);
            } else {
                console.error('Failed to fetch collaboration details');
            }
        } catch (error) {
            console.error('Error fetching details:', error);
        }
    };

    const closeDetailsModal = () => {
        setIsModalOpen(false);
        setSelectedCollaboration(null);
    };

    return (
        <AdminNavbar user={user} notifications={notifications}>
            <main className={adminStyles.mainContent}>
                <section className={styles.collaborationMonitoring}>
                    <div className={styles.pageHeader}>
                        <h1>Collaboration Monitoring</h1>
                        <p>Monitor campaigns, revenue, and influencer performance.</p>
                    </div>

                    {/* Filters & Controls */}
                    <div className={styles.filtersContainer}>
                        <div className={styles.filters}>
                            <div className={styles.searchWrapper}>
                                <i className="fas fa-search"></i>
                                <input
                                    type="text"
                                    placeholder="Search Campaign, Brand, or Influencer..."
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                />
                            </div>

                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className={styles.filterSelect}
                            >
                                <option value="all">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="completed">Completed</option>
                                <option value="pending">Pending</option>
                            </select>

                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                className={styles.dateInput}
                            />
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                className={styles.dateInput}
                            />
                        </div>

                        <div className={styles.actions}>
                            <button onClick={toggleSortOrder} className={styles.sortBtn}>
                                <i className={`fas fa-sort-amount-${sortOrder === 'desc' ? 'down' : 'up'}`}></i>
                                Sort by Revenue
                            </button>
                            <button onClick={resetFilters} className={styles.resetBtn}>
                                <i className="fas fa-sync-alt"></i> Reset
                            </button>
                        </div>
                    </div>

                    {/* Campaign Cards Grid */}
                    <div className={styles.campaignsGrid}>
                        {filteredCollaborations.length > 0 ? (
                            filteredCollaborations.map(campaign => (
                                <div key={campaign.id} className={styles.campaignCard}>
                                    <div className={styles.cardHeader}>
                                        <div className={styles.headerTop}>
                                            <span className={`${styles.statusBadge} ${styles[campaign.status || 'pending']}`}>
                                                {campaign.status || 'Pending'}
                                            </span>
                                            <span className={styles.revenueBadge}>
                                                ${(campaign.revenue || 0).toLocaleString()}
                                            </span>
                                        </div>
                                        <h3>{campaign.title || 'Untitled Campaign'}</h3>
                                        <div className={styles.brandName}>
                                            <i className="fas fa-building"></i> {campaign.brand}
                                        </div>
                                    </div>

                                    <div className={styles.cardBody}>
                                        <div className={styles.dateRange}>
                                            <i className="far fa-calendar-alt"></i>
                                            {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : 'N/A'}
                                            {' - '}
                                            {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'N/A'}
                                        </div>

                                        <div className={styles.influencersSection}>
                                            <h4>Influencers ({campaign.influencers?.length || 0})</h4>
                                            <div className={styles.influencerTags}>
                                                {(campaign.influencers || []).slice(0, 3).map((inf, idx) => (
                                                    <span key={idx} className={styles.influencerTag}>
                                                        {inf.influencer}
                                                    </span>
                                                ))}
                                                {(campaign.influencers?.length || 0) > 3 && (
                                                    <span className={styles.moreTag}>+{campaign.influencers.length - 3} more</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        className={`${adminStyles.btnPrimary}`}
                                        style={{ width: '100%', marginTop: '15px' }}
                                        onClick={() => handleViewDetails(campaign.id)}
                                    >
                                        View Details
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className={styles.noData}>
                                <i className="fas fa-folder-open"></i>
                                <p>No campaigns found matching your filters.</p>
                            </div>
                        )}
                    </div>
                </section>

                <InfluencerDeliverablesModal
                    isOpen={isModalOpen}
                    onClose={closeDetailsModal}
                    data={selectedCollaboration}
                />
            </main>
        </AdminNavbar >
    );
}