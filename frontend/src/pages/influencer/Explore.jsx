import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import styles from '../../styles/influencer_explore.module.css';
import { API_BASE_URL } from '../../services/api';

const Explore = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [menuOpen, setMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);
    
    const [brands, setBrands] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const [viewMode, setViewMode] = useState(() => {
        const saved = localStorage.getItem('brandList:view');
        const fromUrl = searchParams.get('view');
        return fromUrl || saved || 'list';
    });

    // Invite modal state
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [inviteForm, setInviteForm] = useState({
        campaignTitle: '',
        campaignDescription: '',
        budget: '',
        productName: '',
        channels: []
    });
    const [formErrors, setFormErrors] = useState({});
    const [sendingInvite, setSendingInvite] = useState(false);

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
                    fetchBrands();
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

    // Fetch brands data
    const fetchBrands = async () => {
        try {
            setLoading(true);
            const categoryParam = selectedCategory !== 'all' ? selectedCategory : '';
            const searchParam = searchQuery || '';
            const url = `${API_BASE_URL}/influencer/explore?${categoryParam ? `category=${categoryParam}` : ''}${searchParam ? `${categoryParam ? '&' : ''}search=${searchParam}` : ''}`;
            
            const response = await fetch(url, {
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
                throw new Error('Failed to fetch brands');
            }

            const data = await response.json();
            if (data.success) {
                setBrands(data.brands || []);
                setCategories(data.categories || []);
            }
        } catch (error) {
            console.error('Error fetching brands:', error);
        } finally {
            setLoading(false);
        }
    };

    // Update URL params when filters change
    useEffect(() => {
        const params = new URLSearchParams();
        if (searchQuery) params.set('search', searchQuery);
        if (selectedCategory && selectedCategory !== 'all') params.set('category', selectedCategory);
        if (viewMode) params.set('view', viewMode);
        setSearchParams(params);
        localStorage.setItem('brandList:view', viewMode);
    }, [searchQuery, selectedCategory, viewMode, setSearchParams]);

    // Filter brands client-side (for better UX)
    const filteredBrands = useMemo(() => {
        return brands.filter(brand => {
            if (selectedCategory !== 'all' && brand.industry !== selectedCategory) {
                return false;
            }
            if (searchQuery) {
                const searchLower = searchQuery.toLowerCase();
                return (
                    (brand.brandName || brand.name || '').toLowerCase().includes(searchLower) ||
                    (brand.industry || '').toLowerCase().includes(searchLower) ||
                    (brand.description || '').toLowerCase().includes(searchLower)
                );
            }
            return true;
        });
    }, [brands, selectedCategory, searchQuery]);

    // Validation functions
    const validateTitle = (title) => {
        if (!title || title.trim().length === 0) return 'Campaign title is required';
        if (title.trim().length < 5) return 'Campaign title must be at least 5 characters long';
        if (title.trim().length > 100) return 'Campaign title must not exceed 100 characters';
        return null;
    };

    const validateDescription = (description) => {
        if (!description || description.trim().length === 0) return 'Campaign description is required';
        if (description.trim().length < 20) return 'Campaign description must be at least 20 characters long';
        if (description.trim().length > 1000) return 'Campaign description must not exceed 1000 characters';
        return null;
    };

    const validateBudget = (budget) => {
        const budgetNum = parseFloat(budget);
        if (!budget || isNaN(budgetNum)) return 'Valid budget amount is required';
        if (budgetNum <= 0) return 'Budget must be greater than $0';
        if (budgetNum > 1000000000) return 'Budget must not exceed $1,000,000,000';
        return null;
    };

    const validateProductName = (productName) => {
        if (!productName || productName.trim().length === 0) return 'Product name is required';
        if (productName.trim().length < 3) return 'Product name must be at least 3 characters long';
        if (productName.trim().length > 200) return 'Product name must not exceed 200 characters';
        return null;
    };

    const validateChannels = (channels) => {
        if (!channels || channels.length === 0) return 'Please select at least one channel';
        return null;
    };

    // Invite modal functions
    const openInviteModal = (brandId, brandName) => {
        setSelectedBrand({ id: brandId, name: brandName });
        setInviteModalOpen(true);
        setInviteForm({
            campaignTitle: '',
            campaignDescription: '',
            budget: '',
            productName: '',
            channels: []
        });
        setFormErrors({});
    };

    const closeInviteModal = () => {
        setInviteModalOpen(false);
        setSelectedBrand(null);
        setInviteForm({
            campaignTitle: '',
            campaignDescription: '',
            budget: '',
            productName: '',
            channels: []
        });
        setFormErrors({});
    };

    const handleInviteSubmit = async (e) => {
        e.preventDefault();

        if (!selectedBrand) return;

        // Validate form
        const errors = {};
        const titleError = validateTitle(inviteForm.campaignTitle);
        if (titleError) errors.campaignTitle = titleError;

        const descriptionError = validateDescription(inviteForm.campaignDescription);
        if (descriptionError) errors.campaignDescription = descriptionError;

        const budgetError = validateBudget(inviteForm.budget);
        if (budgetError) errors.budget = budgetError;

        const productNameError = validateProductName(inviteForm.productName);
        if (productNameError) errors.productName = productNameError;

        const channelsError = validateChannels(inviteForm.channels);
        if (channelsError) errors.channels = channelsError;

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        setSendingInvite(true);
        try {
            const response = await fetch(`${API_BASE_URL}/influencer/invite-brand`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    brandId: selectedBrand.id,
                    title: inviteForm.campaignTitle.trim(),
                    description: inviteForm.campaignDescription.trim(),
                    budget: parseFloat(inviteForm.budget),
                    product_name: inviteForm.productName.trim(),
                    required_channels: inviteForm.channels
                })
            });

            const data = await response.json();
            if (data.success) {
                alert(`Invitation sent successfully to ${selectedBrand.name}!`);
                closeInviteModal();
            } else {
                const errorMessage = data.message || 'Unknown error';
                if (data.showUpgradeLink) {
                    if (confirm(errorMessage + '\n\nWould you like to upgrade your plan now?')) {
                        navigate('/subscription/manage');
                    }
                } else {
                    alert('Failed to send invite: ' + errorMessage);
                }
            }
        } catch (error) {
            console.error('Error sending invite:', error);
            alert('An error occurred while sending the invite. Please try again.');
        } finally {
            setSendingInvite(false);
        }
    };

    const handleChannelChange = (channel, checked) => {
        if (checked) {
            setInviteForm(prev => ({
                ...prev,
                channels: [...prev.channels, channel]
            }));
        } else {
            setInviteForm(prev => ({
                ...prev,
                channels: prev.channels.filter(c => c !== channel)
            }));
        }
        if (formErrors.channels) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.channels;
                return newErrors;
            });
        }
    };

    const applyFilters = () => {
        fetchBrands();
    };

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedCategory('all');
        setSearchParams({});
    };

    const toggleView = () => {
        const next = viewMode === 'list' ? 'grid' : 'list';
        setViewMode(next);
    };

    if (loading) {
        return (
            <div className={styles['explore-page']}>
                <div style={{ padding: '20px', textAlign: 'center' }}>Loading brands...</div>
            </div>
        );
    }

    return (
        <div className={styles['explore-page']}>
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
                <div className={styles['intro']}>
      <h1>Explore Brands</h1>
      <p>Connect with top brands to elevate your collaboration opportunities.</p>
    </div>

                {/* Filter Section */}
                <div className={styles['filter-section']}>
                    <div className={styles['filter-controls']}>
                        <div className={styles['search-box']}>
                            <input 
                                type="text" 
                                id="searchInput" 
                                placeholder="Search brands..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        applyFilters();
                                    }
                                }}
                            />
                            <button type="button" onClick={applyFilters} className={styles['search-btn']}>
                                <i className="fas fa-search"></i>
          </button>
        </div>
                        <div className={styles['category-filter']}>
                            <select 
                                id="categoryFilter" 
                                value={selectedCategory}
                                onChange={(e) => {
                                    setSelectedCategory(e.target.value);
                                    applyFilters();
                                }}
                            >
                                <option value="all">All Categories</option>
                                {categories.map((category, idx) => (
                                    <option key={idx} value={category}>{category}</option>
                                ))}
          </select>
        </div>
                        <div className={styles['filter-actions']}>
                            <button type="button" onClick={clearFilters} className={styles['clear-btn']}>
                                <i className="fas fa-times"></i> Clear Filters
          </button>
        </div>
      </div>
    </div>

                {/* Results Info */}
                <div className={styles['results-info']}>
                    <p>
                        Found {filteredBrands.length} brands
                        {selectedCategory && selectedCategory !== 'all' && (
                            <> in <strong>{selectedCategory}</strong></>
                        )}
                        {searchQuery && (
                            <> matching "<strong>{searchQuery}</strong>"</>
                        )}
      </p>
    </div>

                {/* Toggle Button */}
                <div className={styles['toggle-container']}>
                    <button 
                        id="viewToggle" 
                        className={styles['toggle-button']}
                        onClick={toggleView}
                        aria-pressed={viewMode === 'grid'}
                        aria-label={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
                    >
                        {viewMode === 'grid' ? 'List view' : 'Grid view'}
                    </button>
    </div>

                {/* Brand List */}
                <div 
                    className={`${styles['brand-list']} ${viewMode === 'grid' ? styles['grid'] : styles['list']}`}
                    id="brandList"
                >
                    {filteredBrands && filteredBrands.length > 0 ? (
                        filteredBrands.map((brand, idx) => (
                            <div key={brand._id || idx} className={styles['brand-item']}>
                                <div className={styles['brand-logo-container']}>
                                    <img 
                                        loading="lazy" 
                                        src={brand.logoUrl || '/images/default-brand.png'}
                                        alt={brand.brandName || brand.name}
                                    />
                                    {brand.verified && (
                                        <span className={styles['verified-badge']} title="Verified Brand">
                                            <i className="fas fa-check-circle"></i>
                </span>
                                    )}
            </div>
                                <div className={styles['brand-details']}>
                                    <div className={styles['brand-header']}>
                                        <h2 className={styles['brand-name']}>
                                            {brand.brandName || brand.name}
                </h2>
                                        {brand.avgCampaignRating && brand.avgCampaignRating > 0 && (
                                            <div className={styles['brand-rating']}>
                                                <i className="fas fa-star"></i>
                                                <span>{brand.avgCampaignRating.toFixed(1)}</span>
                  </div>
                                        )}
              </div>

                                    {brand.tagline && (
                                        <p className={styles['brand-tagline']}>{brand.tagline}</p>
                                    )}

                                    <div className={styles['brand-info-grid']}>
                                        {brand.industry && (
                                            <div className={styles['info-item']}>
                                                <i className="fas fa-tags"></i>
                                                <span>{brand.industry}</span>
                      </div>
                                        )}

                                        {brand.location && (
                                            <div className={styles['info-item']}>
                                                <i className="fas fa-map-marker-alt"></i>
                                                <span>{brand.location}</span>
                          </div>
                                        )}

                                        {brand.completedCampaigns !== undefined && (
                                            <div className={styles['info-item']}>
                                                <i className="fas fa-check-double"></i>
                                                <span>{brand.completedCampaigns} Campaigns</span>
                              </div>
                                        )}

                                        {brand.influencerPartnerships !== undefined && (
                                            <div className={styles['info-item']}>
                                                <i className="fas fa-users"></i>
                                                <span>{brand.influencerPartnerships} Partnerships</span>
                                  </div>
                                        )}
                  </div>

                                    {brand.mission && (
                                        <p className={styles['brand-mission']}>
                                            {brand.mission.substring(0, 120)}
                                            {brand.mission.length > 120 ? '...' : ''}
                                        </p>
                                    )}
            </div>
                                <div className={styles['button-group']}>
                                    <button 
                                        className={styles['invite-button']}
                                        onClick={() => openInviteModal(brand._id, brand.brandName || brand.name)}
                                    >
                                        Invite
                                    </button>
                                    <Link 
                                        to={`/influencer/brand_profile/${brand._id}`} 
                                        className={styles['profile-button']}
                                    >
                                        View Profile
                                    </Link>
            </div>
          </div>
                        ))
                    ) : (
                        <div className={styles['no-brands-message']}>
                <h2>No brands found</h2>
                <p>There are currently no brands available for collaboration.</p>
              </div>
                    )}
    </div>
  </div>

            {/* Invite Modal */}
            {inviteModalOpen && selectedBrand && (
                <div 
                    id="inviteModal" 
                    className={styles['invite-modal']} 
                    style={{ display: 'flex' }}
                    onClick={(e) => {
                        if (e.target.id === 'inviteModal') {
                            closeInviteModal();
                        }
                    }}
                >
                    <div className={styles['invite-modal-content']} onClick={(e) => e.stopPropagation()}>
                        <span className={styles['invite-modal-close']} onClick={closeInviteModal}>&times;</span>
                        <h2 className={styles['invite-modal-title']}>Invite Brand to Collaborate</h2>
                        <p id="inviteBrandName" className={styles['invite-brand-name']}>
                            Inviting: {selectedBrand.name}
                        </p>

                        <form id="inviteForm" onSubmit={handleInviteSubmit}>
                            <div className={styles['form-group']}>
                                <label htmlFor="campaignTitle">Campaign Title *</label>
                                <input 
                                    type="text" 
                                    id="campaignTitle" 
                                    required 
                                    placeholder="e.g., Summer Fashion Collection"
                                    value={inviteForm.campaignTitle}
                                    onChange={(e) => {
                                        setInviteForm(prev => ({ ...prev, campaignTitle: e.target.value }));
                                        if (formErrors.campaignTitle) {
                                            setFormErrors(prev => {
                                                const newErrors = { ...prev };
                                                delete newErrors.campaignTitle;
                                                return newErrors;
                                            });
                                        }
                                    }}
                                />
                                {formErrors.campaignTitle && (
                                    <div className={styles['field-error']}>{formErrors.campaignTitle}</div>
                                )}
        </div>

                            <div className={styles['form-group']}>
                                <label htmlFor="campaignDescription">Campaign Description *</label>
                                <textarea 
                                    id="campaignDescription" 
                                    required 
                                    rows="4"
                                    placeholder="Describe what you want to collaborate on..."
                                    value={inviteForm.campaignDescription}
                                    onChange={(e) => {
                                        setInviteForm(prev => ({ ...prev, campaignDescription: e.target.value }));
                                        if (formErrors.campaignDescription) {
                                            setFormErrors(prev => {
                                                const newErrors = { ...prev };
                                                delete newErrors.campaignDescription;
                                                return newErrors;
                                            });
                                        }
                                    }}
                                />
                                {formErrors.campaignDescription && (
                                    <div className={styles['field-error']}>{formErrors.campaignDescription}</div>
                                )}
        </div>

                            <div className={styles['form-group']}>
                                <label htmlFor="budget">Proposed Budget ($) *</label>
                                <input 
                                    type="number" 
                                    id="budget" 
                                    required 
                                    min="0" 
                                    placeholder="5000"
                                    value={inviteForm.budget}
                                    onChange={(e) => {
                                        let value = e.target.value.replace(/[^0-9.]/g, '');
                                        const parts = value.split('.');
                                        if (parts.length > 2) {
                                            value = parts[0] + '.' + parts.slice(1).join('');
                                        }
                                        if (parts[1] && parts[1].length > 2) {
                                            value = parts[0] + '.' + parts[1].substring(0, 2);
                                        }
                                        setInviteForm(prev => ({ ...prev, budget: value }));
                                        if (formErrors.budget) {
                                            setFormErrors(prev => {
                                                const newErrors = { ...prev };
                                                delete newErrors.budget;
                                                return newErrors;
                                            });
                                        }
                                    }}
                                />
                                {formErrors.budget && (
                                    <div className={styles['field-error']}>{formErrors.budget}</div>
                                )}
        </div>

                            <div className={styles['form-group']}>
                                <label htmlFor="productName">Product Name *</label>
                                <input 
                                    type="text" 
                                    id="productName" 
                                    required 
                                    placeholder="e.g., Summer Collection Dress"
                                    value={inviteForm.productName}
                                    onChange={(e) => {
                                        setInviteForm(prev => ({ ...prev, productName: e.target.value }));
                                        if (formErrors.productName) {
                                            setFormErrors(prev => {
                                                const newErrors = { ...prev };
                                                delete newErrors.productName;
                                                return newErrors;
                                            });
                                        }
                                    }}
                                />
                                {formErrors.productName && (
                                    <div className={styles['field-error']}>{formErrors.productName}</div>
                                )}
        </div>

                            <div className={styles['form-group']}>
                                <label htmlFor="requiredChannels">Channels You'll Use *</label>
                                <div className={styles['channel-checkboxes']}>
                                    {['Instagram', 'YouTube', 'TikTok', 'Facebook', 'Twitter', 'LinkedIn'].map(channel => (
                                        <label key={channel}>
                                            <input 
                                                type="checkbox" 
                                                name="channels" 
                                                value={channel}
                                                checked={inviteForm.channels.includes(channel)}
                                                onChange={(e) => handleChannelChange(channel, e.target.checked)}
                                            />
                                            {channel}
                                        </label>
                                    ))}
          </div>
                                {formErrors.channels && (
                                    <div className={styles['field-error']}>{formErrors.channels}</div>
                                )}
        </div>

                            <div className={styles['invite-modal-actions']}>
                                <button type="submit" className={styles['invite-btn-send']} disabled={sendingInvite}>
                                    <i className="fas fa-paper-plane"></i> {sendingInvite ? 'Sending...' : 'Send Invitation'}
          </button>
                                <button type="button" onClick={closeInviteModal} className={styles['invite-btn-cancel']}>
            Cancel
          </button>
        </div>
      </form>
    </div>
                </div>
            )}
  </div>
  );
};

export default Explore;
