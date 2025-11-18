import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from '../../styles/influencer_collaborations.module.css';
import { API_BASE_URL } from '../../services/api';

const Campaigns = () => {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);
    const [collabs, setCollabs] = useState([]);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [budgetFilter, setBudgetFilter] = useState('');
    const [channelFilter, setChannelFilter] = useState('');
    const [durationFilter, setDurationFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    // Verify authentication
    useEffect(() => {
        const verifyAuth = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/auth/verify`, {
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.status === 401) {
                    navigate('/signin');
                    return;
                }

                const data = await response.json();
                if (data.authenticated) {
                    setAuthenticated(true);
                    fetchCampaigns();
                } else {
                    navigate('/signin');
                }
            } catch (error) {
                console.error('Auth verification error:', error);
                navigate('/signin');
            }
        };

        verifyAuth();
    }, [navigate]);

    // Fetch campaigns data
    const fetchCampaigns = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/influencer/collab`, {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.status === 401) {
                navigate('/signin');
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to fetch campaigns');
            }

            const data = await response.json();
            if (data.success) {
                setCollabs(data.collabs || []);
            }
        } catch (error) {
            console.error('Error fetching campaigns:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter campaigns based on all filter criteria
    const filteredCampaigns = useMemo(() => {
        return collabs.filter(campaign => {
            // Text search filter
            if (searchTerm) {
                const searchData = `${campaign.title || ''} ${campaign.brand_name || ''} ${campaign.description || ''} ${campaign.objectives || ''} ${campaign.product_names || ''} ${campaign.primary_category || ''}`.toLowerCase();
                if (!searchData.includes(searchTerm.toLowerCase())) {
                    return false;
                }
            }

            // Status filter
            if (statusFilter) {
                const campaignStatus = (campaign.status || 'active').toLowerCase();
                if (campaignStatus !== statusFilter.toLowerCase()) {
                    return false;
                }
            }

            // Budget filter
            if (budgetFilter) {
                const budget = parseFloat(campaign.budget) || 0;
                switch (budgetFilter) {
                    case '0-500':
                        if (budget < 0 || budget > 500) return false;
                        break;
                    case '500-1000':
                        if (budget < 500 || budget > 1000) return false;
                        break;
                    case '1000-5000':
                        if (budget < 1000 || budget > 5000) return false;
                        break;
                    case '5000+':
                        if (budget < 5000) return false;
                        break;
                }
            }

            // Channel filter
            if (channelFilter) {
                const channels = Array.isArray(campaign.required_channels) 
                    ? campaign.required_channels.join(',').toLowerCase()
                    : (campaign.required_channels || '').toLowerCase();
                if (!channels.includes(channelFilter.toLowerCase())) {
                    return false;
                }
            }

            // Duration filter
            if (durationFilter) {
                let duration = campaign.duration || 0;
                if (!duration && campaign.start_date && campaign.end_date) {
                    const start = new Date(campaign.start_date);
                    const end = new Date(campaign.end_date);
                    const diffTime = Math.abs(end - start);
                    duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                }

                switch (durationFilter) {
                    case '1-7':
                        if (duration < 1 || duration > 7) return false;
                        break;
                    case '8-30':
                        if (duration < 8 || duration > 30) return false;
                        break;
                    case '31-90':
                        if (duration < 31 || duration > 90) return false;
                        break;
                    case '90+':
                        if (duration < 90) return false;
                        break;
                }
            }

            // Category filter
            if (categoryFilter) {
                const category = (campaign.primary_category || '').toLowerCase();
                if (!category.includes(categoryFilter.toLowerCase())) {
                    return false;
                }
            }

            return true;
        });
    }, [collabs, searchTerm, statusFilter, budgetFilter, channelFilter, durationFilter, categoryFilter]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const clearSearch = () => {
        setSearchTerm('');
    };

    const resetAllFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
        setBudgetFilter('');
        setChannelFilter('');
        setDurationFilter('');
        setCategoryFilter('');
    };

    const hasActiveFilters = searchTerm || statusFilter || budgetFilter || channelFilter || durationFilter || categoryFilter;

    if (loading) {
        return (
            <div className={styles['campaigns-page']}>
                <div style={{ padding: '20px', textAlign: 'center' }}>Loading campaigns...</div>
            </div>
        );
    }

    return (
        <div className={styles['campaigns-page']}>
            {/* Header */}
            <header>
                <div className={styles['header-container']}>
                    <div className={styles['logo']}>CollabSync</div>
                    <nav>
                        <ul>
                            <li><Link to="/influencer/home">Home</Link></li>
                            <li><Link to="/influencer/explore">Explore Brands</Link></li>
                            <li><Link to="/influencer/profile">My Profile</Link></li>
                        </ul>
                    </nav>
                </div>
            </header>

            {/* Sidebar Navigation */}
            <button className={styles['toggle-btn']} onClick={() => setMenuOpen(true)}>☰</button>
            <div className={styles['menu']} style={{ width: menuOpen ? '250px' : '0' }}>
                <span className={styles['close-btn']} onClick={() => setMenuOpen(false)}>&times;</span>
                <Link to="/influencer/campaigns" onClick={() => setMenuOpen(false)}>Campaigns</Link>
                <Link to="/influencer/signout" onClick={() => setMenuOpen(false)}>Sign Out</Link>
            </div>

            {/* Main Content */}
            <div className={styles['container']}>
                <div className={styles['search-container']}>
                    <div className={styles['search-input-group']}>
                        <input 
                            type="text" 
                            className={styles['search-bar']} 
                            id="searchBar"
                            placeholder="Search campaigns by title, brand, products, category, or description..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                        {searchTerm && (
                            <button className={styles['clear-search-btn']} onClick={clearSearch}>✕</button>
                        )}
                    </div>

                    <div className={styles['filter-options']}>
                        <div className={styles['filter-group']}>
                            <label htmlFor="statusFilter">Status:</label>
                            <select 
                                id="statusFilter" 
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="request">Request</option>
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>

                        <div className={styles['filter-group']}>
                            <label htmlFor="budgetFilter">Budget Range:</label>
                            <select 
                                id="budgetFilter" 
                                value={budgetFilter}
                                onChange={(e) => setBudgetFilter(e.target.value)}
                            >
                                <option value="">Any Budget</option>
                                <option value="0-500">$0 - $500</option>
                                <option value="500-1000">$500 - $1,000</option>
                                <option value="1000-5000">$1,000 - $5,000</option>
                                <option value="5000+">$5,000+</option>
                            </select>
                        </div>

                        <div className={styles['filter-group']}>
                            <label htmlFor="channelFilter">Channel:</label>
                            <select 
                                id="channelFilter" 
                                value={channelFilter}
                                onChange={(e) => setChannelFilter(e.target.value)}
                            >
                                <option value="">All Channels</option>
                                <option value="Instagram">Instagram</option>
                                <option value="YouTube">YouTube</option>
                                <option value="TikTok">TikTok</option>
                                <option value="Facebook">Facebook</option>
                                <option value="Twitter">Twitter</option>
                                <option value="LinkedIn">LinkedIn</option>
                            </select>
                        </div>

                        <div className={styles['filter-group']}>
                            <label htmlFor="durationFilter">Duration:</label>
                            <select 
                                id="durationFilter" 
                                value={durationFilter}
                                onChange={(e) => setDurationFilter(e.target.value)}
                            >
                                <option value="">Any Duration</option>
                                <option value="1-7">1-7 days</option>
                                <option value="8-30">8-30 days</option>
                                <option value="31-90">31-90 days</option>
                                <option value="90+">90+ days</option>
                            </select>
                        </div>

                        <div className={styles['filter-group']}>
                            <label htmlFor="categoryFilter">Category:</label>
                            <select 
                                id="categoryFilter" 
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                            >
                                <option value="">All Categories</option>
                                <option value="fashion">Fashion</option>
                                <option value="beauty">Beauty</option>
                                <option value="lifestyle">Lifestyle</option>
                                <option value="food">Food</option>
                                <option value="travel">Travel</option>
                                <option value="technology">Technology</option>
                                <option value="fitness">Fitness</option>
                                <option value="entertainment">Entertainment</option>
                                <option value="business">Business</option>
                                <option value="education">Education</option>
                                <option value="health">Health</option>
                                <option value="automotive">Automotive</option>
                                <option value="sports">Sports</option>
                                <option value="gaming">Gaming</option>
                            </select>
                        </div>
                    </div>

                    {hasActiveFilters && (
                        <div className={styles['search-results-info']} style={{ display: 'flex' }}>
                            <span>{filteredCampaigns.length} campaigns found</span>
                            <button className={styles['reset-filters-btn']} onClick={resetAllFilters}>Reset Filters</button>
                        </div>
                    )}
                </div>

                <div className={styles['campaign-list']}>
                    {filteredCampaigns && filteredCampaigns.length > 0 ? (
                        filteredCampaigns.map(campaign => {
                            let duration = campaign.duration || 0;
                            if (!duration && campaign.start_date && campaign.end_date) {
                                const start = new Date(campaign.start_date);
                                const end = new Date(campaign.end_date);
                                const diffTime = Math.abs(end - start);
                                duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            }

                            return (
                                <div key={campaign.id || campaign._id} className={styles['campaign-card']}>
                                    <div className={styles['campaign-header']}>
                                        <h2 className={styles['campaign-title']}>{campaign.title}</h2>
                                    </div>

                                    {campaign.description && (
                                        <div className={styles['campaign-description']}>
                                            {campaign.description}
                                        </div>
                                    )}

                                    <div className={styles['campaign-details']}>
                                        <div className={styles['detail-item']}>
                                            <span className={styles['detail-label']}>Brand</span>
                                            <span className={styles['detail-value']}>
                                                {campaign.brand_name || 'Unknown Brand'}
                                            </span>
                                        </div>

                                        <div className={styles['detail-item']}>
                                            <span className={styles['detail-label']}>Budget</span>
                                            <span className={styles['detail-value']}>${campaign.budget || '0'}</span>
                                        </div>

                                        <div className={styles['detail-item']}>
                                            <span className={styles['detail-label']}>Duration (Days)</span>
                                            <span className={styles['detail-value']}>
                                                {duration ? `${duration} days` : 'Not specified'}
                                            </span>
                                        </div>

                                        {campaign.product_names && (
                                            <div className={styles['detail-item']}>
                                                <span className={styles['detail-label']}>Products</span>
                                                <span className={styles['detail-value']}>
                                                    {campaign.product_names}
                                                </span>
                                            </div>
                                        )}

                                        {campaign.primary_category && (
                                            <div className={styles['detail-item']}>
                                                <span className={styles['detail-label']}>Category</span>
                                                <span className={styles['detail-value']}>
                                                    {campaign.primary_category}
                                                </span>
                                            </div>
                                        )}

                                        <div className={styles['detail-item']}>
                                            <span className={styles['detail-label']}>Min Followers</span>
                                            <span className={styles['detail-value']}>
                                                {campaign.min_followers ? campaign.min_followers.toLocaleString() : 'No minimum'}
                                            </span>
                                        </div>

                                        {campaign.start_date && campaign.end_date && (
                                            <div className={styles['detail-item']}>
                                                <span className={styles['detail-label']}>Duration</span>
                                                <span className={styles['detail-value']}>
                                                    {new Date(campaign.start_date).toLocaleDateString()} - {new Date(campaign.end_date).toLocaleDateString()}
                                                </span>
                                            </div>
                                        )}

                                        {campaign.target_audience && (
                                            <div className={styles['detail-item']}>
                                                <span className={styles['detail-label']}>Target Audience</span>
                                                <span className={styles['detail-value']}>
                                                    {campaign.target_audience}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {campaign.required_channels && campaign.required_channels.length > 0 && (
                                        <div className={styles['detail-item']}>
                                            <span className={styles['detail-label']}>Required Channels</span>
                                            <div className={styles['channels-list']}>
                                                {Array.isArray(campaign.required_channels) ? (
                                                    campaign.required_channels.map((channel, idx) => (
                                                        <span key={idx} className={styles['channel-tag']}>
                                                            {channel}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className={styles['channel-tag']}>
                                                        {campaign.required_channels}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {campaign.objectives && (
                                        <div className={styles['detail-item']} style={{ marginTop: '12px' }}>
                                            <span className={styles['detail-label']}>Campaign Objectives</span>
                                            <span className={styles['detail-value']} style={{ fontWeight: 400, lineHeight: 1.4 }}>
                                                {campaign.objectives}
                                            </span>
                                        </div>
                                    )}

                                    <div className={styles['campaign-actions']}>
                                        <div className={styles['campaign-dates']}>
                                            {campaign.start_date && (
                                                <>Starts: {new Date(campaign.start_date).toLocaleDateString()}</>
                                            )}
                                        </div>
                                        <Link 
                                            to={`/influencer/collab/${campaign._id || campaign.id}`} 
                                            className={styles['view-details-btn']}
                                        >
                                            View Details & Apply
                                        </Link>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className={styles['no-campaigns']}>
                            <h3>No Campaigns Available</h3>
                            <p>There are currently no active campaigns. Check back later for new opportunities!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Campaigns;
