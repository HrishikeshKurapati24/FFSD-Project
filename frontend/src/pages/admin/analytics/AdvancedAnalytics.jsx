import React, { useState, useEffect, useRef } from 'react';
import { Network } from 'vis-network';
import AdminNavbar from '../../../components/admin/AdminNavbar';
import { API_BASE_URL } from '../../../services/api';
import styles from '../../../styles/admin/AdvancedAnalytics.module.css';
import adminStyles from '../../../styles/admin/admin_dashboard.module.css';

export default function AdvancedAnalytics() {
    const [user, setUser] = useState({ name: 'Admin' });
    const [roiData, setRoiData] = useState([]);
    const [brands, setBrands] = useState([]);
    const [matchmakingResults, setMatchmakingResults] = useState([]);
    const [selectedBrand, setSelectedBrand] = useState('');
    const [ecosystemData, setEcosystemData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notifications, setNotifications] = useState([]);

    const networkRef = useRef(null);
    const networkContainerRef = useRef(null);

    // Fetch user data for auth
    useEffect(() => {
        fetchUserData();
        fetchNotifications();
    }, []);

    // Fetch all analytics data
    useEffect(() => {
        fetchROIData();
        fetchBrands();
        fetchEcosystemData();
    }, []);

    // Initialize network graph when ecosystem data is loaded
    useEffect(() => {
        if (ecosystemData && networkContainerRef.current) {
            initializeNetworkGraph();
        }

        return () => {
            if (networkRef.current) {
                networkRef.current.destroy();
                networkRef.current = null;
            }
        };
    }, [ecosystemData]);

    const fetchUserData = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/verify`, {
                credentials: 'include'
            });

            if (response.status === 401) {
                window.location.href = '/admin/login';
                return;
            }

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
        try {
            const response = await fetch(`${API_BASE_URL}/admin/notifications`, {
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

    const fetchROIData = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/analytics/influencer-roi`, {
                credentials: 'include'
            });

            if (response.status === 401) {
                window.location.href = '/admin/login';
                return;
            }

            if (response.ok) {
                const data = await response.json();
                setRoiData(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching ROI data:', error);
            setError('Failed to load ROI data');
        }
    };

    const fetchBrands = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/verified-brands`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.brands) {
                    setBrands(data.brands);
                }
            }
        } catch (error) {
            console.error('Error fetching brands:', error);
        }
    };

    const fetchMatchmaking = async (brandId) => {
        if (!brandId) {
            setMatchmakingResults([]);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/admin/analytics/matchmaking/${brandId}`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Matchmaking response:', data);
                setMatchmakingResults(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching matchmaking data:', error);
            setError('Failed to load matchmaking recommendations');
        }
    };

    const fetchEcosystemData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/admin/analytics/ecosystem`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Ecosystem response:', data);
                // Backend sends { success: true, data: { nodes: [], links: [] } }
                setEcosystemData(data.data);
            }
        } catch (error) {
            console.error('Error fetching ecosystem data:', error);
            setError('Failed to load ecosystem graph');
        } finally {
            setLoading(false);
        }
    };

    const handleBrandChange = (e) => {
        const brandId = e.target.value;
        setSelectedBrand(brandId);
        fetchMatchmaking(brandId);
    };

    const initializeNetworkGraph = () => {
        if (!networkContainerRef.current || !ecosystemData) return;

        // Destroy existing network
        if (networkRef.current) {
            networkRef.current.destroy();
        }

        const data = {
            nodes: ecosystemData.nodes || [],
            edges: ecosystemData.edges || ecosystemData.links || []
        };

        const options = {
            nodes: {
                shape: 'dot',
                size: 20,
                font: {
                    size: 14,
                    color: '#333'
                },
                borderWidth: 2,
                shadow: true
            },
            groups: {
                brand: {
                    color: { background: '#4FC3F7', border: '#03A9F4' },
                    shape: 'dot'
                },
                influencer: {
                    color: { background: '#BA68C8', border: '#9C27B0' },
                    shape: 'dot'
                }
            },
            edges: {
                width: 2,
                color: { color: '#848484', highlight: '#2B7CE9', inherit: false },
                smooth: {
                    type: 'continuous'
                }
            },
            physics: {
                enabled: true,
                barnesHut: {
                    gravitationalConstant: -2000,
                    centralGravity: 0.3,
                    springLength: 150,
                    springConstant: 0.04
                },
                stabilization: {
                    iterations: 150
                }
            },
            interaction: {
                hover: true,
                tooltipDelay: 100,
                zoomView: true,
                dragView: true
            }
        };

        networkRef.current = new Network(networkContainerRef.current, data, options);
    };

    const AttributionGraphNode = ({ label, icon, color }) => (
        <div className={styles.attributionNode} style={{ borderColor: color }}>
            <div className={styles.nodeIcon} style={{ backgroundColor: color }}>
                <i className={`fas ${icon}`}></i>
            </div>
            <div className={styles.nodeLabel}>{label}</div>
        </div>
    );

    return (
        <AdminNavbar user={user} notifications={notifications}>
            <div className={adminStyles.mainContent}>
                <div className={styles.header}>
                    <h1>🚀 Advanced Analytics - God Mode</h1>
                    <p>Deep insights into influencer ROI, matchmaking intelligence, and ecosystem visualization</p>
                </div>

                {/* ROI Leaderboard Section */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2>💰 Influencer ROI Leaderboard</h2>
                        <p>Top performing influencers ranked by revenue generation</p>
                    </div>

                    <div className={styles.card}>
                        {roiData.length > 0 ? (
                            <div className={styles.tableContainer}>
                                <table className={styles.roiTable}>
                                    <thead>
                                        <tr>
                                            <th>Rank</th>
                                            <th>Influencer</th>
                                            <th>Total Revenue</th>
                                            <th>Campaigns</th>
                                            <th>Avg. Order Value</th>
                                            <th>ROI Score</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {roiData.map((influencer, index) => (
                                            <tr key={influencer.influencerId || index}>
                                                <td className={styles.rank}>
                                                    <span className={styles.rankBadge}>#{index + 1}</span>
                                                </td>
                                                <td className={styles.influencerInfo}>
                                                    <div className={styles.influencerName}>
                                                        {influencer.influencerName || 'Unknown'}
                                                    </div>
                                                </td>
                                                <td className={styles.revenue}>
                                                    ${influencer.totalRevenue?.toLocaleString() || '0'}
                                                </td>
                                                <td>{influencer.campaignCount || 0}</td>
                                                <td>${influencer.avgOrderValue?.toFixed(2) || '0.00'}</td>
                                                <td>
                                                    <div className={styles.scoreBar}>
                                                        <div
                                                            className={styles.scoreProgress}
                                                            style={{ width: `${Math.min(influencer.roiScore * 10, 100)}%` }}
                                                        ></div>
                                                        <span className={styles.scoreText}>
                                                            {influencer.roiScore?.toFixed(1) || '0.0'}x
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <i className="fas fa-chart-line"></i>
                                <p>No sales data available yet to calculate ROI</p>
                                <small>Revenue tracking begins when customers make purchases through influencer referrals</small>
                            </div>
                        )}
                    </div>
                </div>

                {/* Matchmaking Section */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2>🤝 AI Brand-Influencer Matchmaking</h2>
                        <p>Intelligent compatibility scoring for optimal collaborations</p>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.matchmakingTool}>
                            <label htmlFor="brand-select">Select Brand:</label>
                            <select
                                id="brand-select"
                                value={selectedBrand}
                                onChange={handleBrandChange}
                                className={styles.brandSelect}
                            >
                                <option value="">-- Choose a Brand --</option>
                                {brands.map(brand => (
                                    <option key={brand._id} value={brand._id}>
                                        {brand.brandName || brand.name || 'Unnamed Brand'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {matchmakingResults.length > 0 && (
                            <div className={styles.matchmakingResults}>
                                {matchmakingResults.some(m => m.matchReasons?.some(r => r.includes('Category Match'))) && (
                                    <div className={styles.perfectMatchesSection}>
                                        <h3 className={styles.perfectMatchTitle}>✨ Perfect Category Matches</h3>
                                        <div className={styles.recommendationGrid}>
                                            {matchmakingResults
                                                .filter(m => m.matchReasons?.some(r => r.includes('Category Match')))
                                                .map((match, index) => (
                                                    <div key={`perfect-${match.influencer?._id || index}`} className={`${styles.matchCard} ${styles.perfectMatchCard}`}>
                                                        <div className={styles.matchHeader}>
                                                            <div className={styles.influencerAvatar}>
                                                                <img
                                                                    src={match.influencer?.profilePicture || match.influencer?.profilePicUrl || '/images/default-avatar.jpg'}
                                                                    alt={match.influencer?.fullName}
                                                                />
                                                            </div>
                                                            <div className={styles.matchInfo}>
                                                                <h4>{match.influencer?.fullName || match.influencer?.username || 'Unknown'}</h4>
                                                                <div className={styles.matchScore}>
                                                                    <span className={styles.scoreLabel}>Match Score:</span>
                                                                    <div className={styles.matchProgress}>
                                                                        <div
                                                                            className={styles.matchProgressBar}
                                                                            style={{
                                                                                width: `${match.score || match.matchScore || 0}%`,
                                                                                backgroundColor: '#4CAF50'
                                                                            }}
                                                                        ></div>
                                                                    </div>
                                                                    <span className={styles.scoreValue}>{match.score || match.matchScore || 0}%</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className={styles.matchCriteria}>
                                                            {match.matchReasons && match.matchReasons.map((criteria, i) => (
                                                                <span key={i} className={`${styles.criteriaBadge} ${criteria.includes('Category') ? styles.categoryBadge : ''}`}>
                                                                    {criteria.includes('Category') ? '🌟 ' : '✓ '}{criteria}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}

                                <h3 className={styles.otherMatchTitle}>All Recommended Influencers:</h3>
                                <div className={styles.recommendationGrid}>
                                    {matchmakingResults.map((match, index) => (
                                        <div key={match.influencer?._id || index} className={styles.matchCard}>
                                            <div className={styles.matchHeader}>
                                                <div className={styles.influencerAvatar}>
                                                    <img
                                                        src={match.influencer?.profilePicture || match.influencer?.profilePicUrl || '/images/default-avatar.jpg'}
                                                        alt={match.influencer?.fullName}
                                                    />
                                                </div>
                                                <div className={styles.matchInfo}>
                                                    <h4>{match.influencer?.fullName || match.influencer?.username || 'Unknown'}</h4>
                                                    <div className={styles.matchScore}>
                                                        <span className={styles.scoreLabel}>Match Score:</span>
                                                        <div className={styles.matchProgress}>
                                                            <div
                                                                className={styles.matchProgressBar}
                                                                style={{
                                                                    width: `${match.score || match.matchScore || 0}%`,
                                                                    backgroundColor: (match.score || match.matchScore) >= 70 ? '#4CAF50' :
                                                                        (match.score || match.matchScore) >= 40 ? '#FF9800' : '#f44336'
                                                                }}
                                                            ></div>
                                                        </div>
                                                        <span className={styles.scoreValue}>{match.score || match.matchScore || 0}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={styles.matchCriteria}>
                                                {match.matchReasons && match.matchReasons.map((criteria, i) => (
                                                    <span key={i} className={styles.criteriaBadge}>
                                                        ✓ {criteria}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedBrand && matchmakingResults.length === 0 && (
                            <div className={styles.emptyState}>
                                <i className="fas fa-user-friends"></i>
                                <p>No matching influencers found</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Attribution Graph Section */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2>🧵 The "Golden Thread" Journey Map</h2>
                        <p>Visualize the complete path from customer interaction to revenue</p>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.attributionGraph}>
                            <AttributionGraphNode label="Influencer Post" icon="fa-ad" color="#BA68C8" />
                            <div className={styles.connector}><i className="fas fa-arrow-right"></i></div>
                            <AttributionGraphNode label="Customer Impression" icon="fa-eye" color="#4FC3F7" />
                            <div className={styles.connector}><i className="fas fa-arrow-right"></i></div>
                            <AttributionGraphNode label="Product Click" icon="fa-mouse-pointer" color="#FFD54F" />
                            <div className={styles.connector}><i className="fas fa-arrow-right"></i></div>
                            <AttributionGraphNode label="Brand Revenue" icon="fa-money-bill-wave" color="#81C784" />
                        </div>
                        <div className={styles.attributionDetails}>
                            <div className={styles.detailsBox}>
                                <h4>Sample Attribution Flow</h4>
                                <ul>
                                    <li><strong>Influencer:</strong> TechUnbox Pro</li>
                                    <li><strong>Action:</strong> Published Video Review</li>
                                    <li><strong>Customer:</strong> Jane Doe (ID: 4421)</li>
                                    <li><strong>Result:</strong> $299 Purchase for Brand X</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Ecosystem Network Graph Section */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2>🌐 The Ecosystem - Network Graph</h2>
                        <p>Interactive visualization of brands, influencers, and their collaborations</p>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.graphLegend}>
                            <div className={styles.legendItem}>
                                <span className={styles.legendDot} style={{ backgroundColor: '#4FC3F7' }}></span>
                                <span>Brands</span>
                            </div>
                            <div className={styles.legendItem}>
                                <span className={styles.legendDot} style={{ backgroundColor: '#BA68C8' }}></span>
                                <span>Influencers</span>
                            </div>
                            <div className={styles.legendItem}>
                                <span className={styles.legendDot} style={{ backgroundColor: '#4CAF50' }}></span>
                                <span>Collaborations</span>
                            </div>
                        </div>

                        {loading ? (
                            <div className={styles.loadingState}>
                                <i className="fas fa-spinner fa-spin"></i>
                                <p>Loading ecosystem data...</p>
                            </div>
                        ) : (
                            <div
                                ref={networkContainerRef}
                                className={styles.networkGraph}
                                style={{ height: '600px', border: '1px solid #ddd', borderRadius: '8px' }}
                            ></div>
                        )}
                    </div>
                </div>

                {error && (
                    <div className={styles.errorMessage}>
                        <i className="fas fa-exclamation-circle"></i>
                        <span>{error}</span>
                    </div>
                )}
            </div>
        </AdminNavbar>
    );
}
