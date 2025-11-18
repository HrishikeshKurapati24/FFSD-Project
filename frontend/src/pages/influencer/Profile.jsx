import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from '../../styles/influencer_profile.module.css';
import { API_BASE_URL } from '../../services/api';

const Profile = () => {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);
    const [influencer, setInfluencer] = useState(null);

    // Modal states
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [imagesModalOpen, setImagesModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState('');

    // Edit form state
    const [editForm, setEditForm] = useState({
        displayName: '',
        username: '',
        bio: '',
        location: '',
        audienceGender: '',
        audienceAgeRange: '',
        categories: [],
        languages: [],
        socials: []
    });
    const [categoryInput, setCategoryInput] = useState('');
    const [languageInput, setLanguageInput] = useState('');
    const [formErrors, setFormErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    // Image form state
    const [profilePic, setProfilePic] = useState(null);
    const [bannerImage, setBannerImage] = useState(null);
    const [profilePicPreview, setProfilePicPreview] = useState('');
    const [bannerPreview, setBannerPreview] = useState('');
    const [imageErrors, setImageErrors] = useState({});
    const [uploadingImages, setUploadingImages] = useState(false);

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
                    fetchProfile();
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

    // Fetch profile data
    const fetchProfile = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/influencer/profile`, {
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
                throw new Error('Failed to fetch profile');
            }

            const data = await response.json();
            if (data.success) {
                setInfluencer(data.influencer);
                setEditForm({
                    displayName: data.influencer.displayName || '',
                    username: data.influencer.username || '',
                    bio: data.influencer.bio || '',
                    location: data.influencer.location || '',
                    audienceGender: data.influencer.audienceGender || '',
                    audienceAgeRange: data.influencer.audienceAgeRange || '',
                    categories: data.influencer.categories || [],
                    languages: data.influencer.languages || [],
                    socials: data.influencer.socials || []
                });
                setProfilePicPreview(data.influencer.profilePicUrl || '/images/default-avatar.jpg');
                setBannerPreview(data.influencer.bannerUrl || '/images/default-banner.jpg');
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    // Validation functions
    const validateDisplayName = (name) => {
        if (!name) return 'Display name is required';
        if (name.length <= 3 || name.length >= 50) return 'Display name must be > 3 and < 50 characters';
        if (/\d/.test(name)) return 'Display name must not contain numbers';
        return null;
    };

    const validateUsername = (username) => {
        if (!username) return 'Username is required';
        if (username.length <= 3 || username.length >= 80) return 'Username must be > 3 and < 80 characters';
        if (!/\d/.test(username)) return 'Username must include at least one number';
        return null;
    };

    const validateAgeRange = (ageRange) => {
        if (!ageRange) return null;
        const ageMatch = ageRange.match(/^(\d+)-(\d+)$/);
        if (!ageMatch) return 'Age range must be in format min-max, e.g., 18-35';
        const min = parseInt(ageMatch[1], 10);
        const max = parseInt(ageMatch[2], 10);
        if (min >= max) return 'Minimum age must be less than maximum age';
        return null;
    };

    // Tag management
    const addCategory = () => {
        if (categoryInput.trim() && !editForm.categories.includes(categoryInput.trim())) {
            setEditForm(prev => ({
                ...prev,
                categories: [...prev.categories, categoryInput.trim()]
            }));
            setCategoryInput('');
            if (formErrors.categories) {
                setFormErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.categories;
                    return newErrors;
                });
            }
        }
    };

    const removeCategory = (category) => {
        setEditForm(prev => ({
            ...prev,
            categories: prev.categories.filter(c => c !== category)
        }));
    };

    const addLanguage = () => {
        if (languageInput.trim() && !editForm.languages.includes(languageInput.trim())) {
            setEditForm(prev => ({
                ...prev,
                languages: [...prev.languages, languageInput.trim()]
            }));
            setLanguageInput('');
            if (formErrors.languages) {
                setFormErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.languages;
                    return newErrors;
                });
            }
        }
    };

    const removeLanguage = (language) => {
        setEditForm(prev => ({
            ...prev,
            languages: prev.languages.filter(l => l !== language)
        }));
    };

    // Social links management
    const addSocialLink = () => {
        setEditForm(prev => ({
            ...prev,
            socials: [...prev.socials, { platform: 'instagram', url: '', followers: 0 }]
        }));
    };

    const removeSocialLink = (index) => {
        setEditForm(prev => ({
            ...prev,
            socials: prev.socials.filter((_, i) => i !== index)
        }));
    };

    const updateSocialLink = (index, field, value) => {
        setEditForm(prev => ({
            ...prev,
            socials: prev.socials.map((social, i) => 
                i === index ? { ...social, [field]: value } : social
            )
        }));
    };

    // Handle profile form submission
    const handleProfileSubmit = async (e) => {
        e.preventDefault();

        const errors = {};
        const displayNameError = validateDisplayName(editForm.displayName);
        if (displayNameError) errors.displayName = displayNameError;

        const usernameError = validateUsername(editForm.username);
        if (usernameError) errors.username = usernameError;

        if (!editForm.bio) errors.bio = 'Bio is required';

        const ageRangeError = validateAgeRange(editForm.audienceAgeRange);
        if (ageRangeError) errors.audienceAgeRange = ageRangeError;

        if (!editForm.categories || editForm.categories.length < 1) {
            errors.categories = 'Add at least one content category';
        }

        if (!editForm.languages || editForm.languages.length < 1) {
            errors.languages = 'Add at least one language';
        }

        if (!editForm.socials || editForm.socials.length < 1) {
            errors.socials = 'Add at least one social media link';
        }

        // Validate social links
        if (editForm.socials && editForm.socials.length > 0) {
            for (const link of editForm.socials) {
                if (link.url) {
                    try {
                        new URL(link.url);
                    } catch {
                        errors.socials = `Please enter a valid URL for ${link.platform}`;
                        break;
                    }
                }
                if (isNaN(link.followers) || link.followers < 0) {
                    errors.socials = `Please enter a valid followers count for ${link.platform}`;
                    break;
                }
            }
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/influencer/profile/update/data`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(editForm)
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (errorData.errors) {
                    setFormErrors(errorData.errors);
                    return;
                }
                throw new Error(errorData.message || 'Failed to update profile');
            }

            const result = await response.json();
            if (result.success) {
                alert('Profile updated successfully!');
                setEditModalOpen(false);
                fetchProfile();
            } else {
                alert(result.message || 'Error updating profile');
            }
        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'An error occurred while updating the profile');
        } finally {
            setSubmitting(false);
        }
    };

    // Handle image upload
    const handleImageSubmit = async (e) => {
        e.preventDefault();

        const errors = {};
        if (!profilePic) {
            errors.profilePic = 'Profile picture is required';
        } else {
            const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
            if (!validTypes.includes(profilePic.type)) {
                errors.profilePic = 'Please select a valid image file (JPG, PNG, or GIF)';
            } else if (profilePic.size > 5 * 1024 * 1024) {
                errors.profilePic = 'Profile picture must be less than 5MB';
            }
        }

        if (bannerImage) {
            const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
            if (!validTypes.includes(bannerImage.type)) {
                errors.bannerImage = 'Please select a valid image file (JPG, PNG, or GIF)';
            } else if (bannerImage.size > 10 * 1024 * 1024) {
                errors.bannerImage = 'Banner image must be less than 10MB';
            }
        }

        if (Object.keys(errors).length > 0) {
            setImageErrors(errors);
            return;
        }

        setUploadingImages(true);
        const formData = new FormData();
        if (profilePic) formData.append('profilePic', profilePic);
        if (bannerImage) formData.append('bannerImage', bannerImage);

        try {
            const response = await fetch(`${API_BASE_URL}/influencer/profile/update-images`, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            const result = await response.json();
            if (result.success) {
                alert('Images updated successfully!');
                setImagesModalOpen(false);
                setProfilePic(null);
                setBannerImage(null);
                fetchProfile();
            } else {
                alert(result.message || 'Error updating images');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while updating images. Please try again later.');
        } finally {
            setUploadingImages(false);
        }
    };

    // Handle profile pic preview
    const handleProfilePicChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfilePic(file);
            const reader = new FileReader();
            reader.onload = (e) => setProfilePicPreview(e.target.result);
            reader.readAsDataURL(file);
            if (imageErrors.profilePic) {
                setImageErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.profilePic;
                    return newErrors;
                });
            }
        }
    };

    // Handle banner preview
    const handleBannerChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setBannerImage(file);
            const reader = new FileReader();
            reader.onload = (e) => setBannerPreview(e.target.result);
            reader.readAsDataURL(file);
            if (imageErrors.bannerImage) {
                setImageErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.bannerImage;
                    return newErrors;
                });
            }
        }
    };

    // Handle delete account
    const handleDeleteAccount = async () => {
        if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/influencer/profile/delete`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete account');
            }

            const result = await response.json();
            if (result.success) {
                alert('Account deleted successfully');
                navigate('/');
            } else {
                alert(result.message || 'Error deleting account');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while deleting the account. Please try again later.');
        }
    };

    // Get primary market emoji
    const getPrimaryMarketEmoji = (market) => {
        if (!market) return '';
        if (market.includes('Global')) return '🌎';
        if (market.includes('US')) return '🇺🇸';
        if (market.includes('UK')) return '🇬🇧';
        if (market.includes('Europe')) return '🇪🇺';
        if (market.includes('Asia')) return '🌏';
        return '';
    };

    if (loading) {
        return (
            <div className={styles['profile-page']}>
                <div style={{ padding: '20px', textAlign: 'center' }}>Loading profile...</div>
            </div>
        );
    }

    if (!influencer) {
        return (
            <div className={styles['profile-page']}>
                <div style={{ padding: '20px', textAlign: 'center' }}>Profile not found</div>
            </div>
        );
    }

    return (
        <div className={styles['profile-page']}>
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

            <div className={styles['container']}>
                {/* Profile Banner */}
                <section className={styles['profile-banner']}>
                    <div 
                        className={styles['banner-image']} 
                        style={{ backgroundImage: `url(${influencer.bannerUrl || '/images/default-banner.jpg'})` }}
                    >
                        <button className={styles['edit-banner-btn']} onClick={() => setImagesModalOpen(true)}>
                            <i className="fas fa-camera"></i>
                            <span>Edit Profile or Banner</span>
                        </button>
                    </div>
                    <div className={styles['profile-info']}>
                        <div className={styles['profile-pic']}>
                            <img 
                                src={influencer.profilePicUrl || '/images/default-avatar.jpg'}
                                alt={influencer.displayName}
                            />
                        </div>
                        <div className={styles['profile-name']}>
                            <h1>{influencer.displayName}</h1>
                            <p className={styles['username']}>@{influencer.username}</p>
                            <div className={styles['profile-status']}>
                                {influencer.verified ? (
                                    <span className={styles['premium-badge']}>
                                        <i className="fas fa-check-circle"></i> VERIFIED
                                    </span>
                                ) : (
                                    <span className={`${styles['premium-badge']} ${styles['pending-badge']}`}>
                                        <i className="fas fa-clock"></i> PENDING VERIFICATION
                                    </span>
                                )}
                                <span className={styles['influence-info']}>
                                    Primary market: {influencer.primaryMarket || 'Not specified'} {getPrimaryMarketEmoji(influencer.primaryMarket)}
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                <div className={styles['profile-content']}>
                    <div className={styles['profile-main']}>
                        {/* About Tab */}
                        <div id="about-tab" className={`${styles['tab-content']} ${styles['active']}`}>
                            <div className={styles['profile-bio']}>
                                <div className={styles['section-header']}>
                                    <h2>About</h2>
                                    <button className={styles['btn-edit']} onClick={() => setEditModalOpen(true)}>
                                        <i className="fas fa-edit"></i> Edit
                                    </button>
                                </div>
                                <p className={styles['bio-text']}>
                                    {influencer.bio || 'No description provided.'}
                                </p>

                                <div className={styles['info-section']}>
                                    <h3><i className="fas fa-users"></i> Audience Demographics</h3>
                                    <div className={styles['audience-details']}>
                                        <div className={styles['detail-item']}>
                                            <strong>Age Range:</strong>
                                            <span>{influencer.audienceAgeRange || 'Not specified'}</span>
                                        </div>
                                        <div className={styles['detail-item']}>
                                            <strong>Primary Gender:</strong>
                                            <span>{influencer.audienceGender || 'Not specified'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles['info-section']}>
                                    <h3><i className="fas fa-language"></i> Languages</h3>
                                    <div className={styles['languages-tags']}>
                                        {influencer.languages && influencer.languages.map((language, idx) => (
                                            <span key={idx} className={styles['language-tag']}>
                                                {language}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className={styles['info-section']}>
                                    <h3><i className="fas fa-tags"></i> Content Categories</h3>
                                    <div className={styles['categories-tags']}>
                                        {influencer.categories && influencer.categories.map((category, idx) => (
                                            <span key={idx} className={styles['category-tag']}>
                                                {category}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className={styles['metrics-section']}>
                                <h2>Performance Metrics</h2>
                                <div className={styles['metrics-grid']}>
                                    <div className={styles['metric-card']}>
                                        <div className={styles['metric-icon']}><i className="fas fa-users"></i></div>
                                        <div className={styles['metric-value']}>
                                            {influencer.totalFollowers?.toLocaleString()}
                                        </div>
                                        <div className={styles['metric-label']}>Total Followers</div>
                                    </div>
                                    <div className={styles['metric-card']}>
                                        <div className={styles['metric-icon']}><i className="fas fa-heart"></i></div>
                                        <div className={styles['metric-value']}>
                                            {influencer.avgEngagementRate}%
                                        </div>
                                        <div className={styles['metric-label']}>Avg. Engagement</div>
                                    </div>
                                    <div className={styles['metric-card']}>
                                        <div className={styles['metric-icon']}><i className="fas fa-star"></i></div>
                                        <div className={styles['metric-value']}>
                                            {influencer.avgRating}
                                        </div>
                                        <div className={styles['metric-label']}>Avg. Rating</div>
                                    </div>
                                    <div className={styles['metric-card']}>
                                        <div className={styles['metric-icon']}><i className="fas fa-handshake"></i></div>
                                        <div className={styles['metric-value']}>
                                            {influencer.completedCollabs}
                                        </div>
                                        <div className={styles['metric-label']}>Completed Campaigns</div>
                                    </div>
                                </div>
                            </div>

                            <div className={`${styles['profile-card']} ${styles['social-card']}`}>
                                <h3>Social Media</h3>
                                <div className={styles['social-stats']}>
                                    {influencer.socials && influencer.socials.map((platform, idx) => (
                                        <div key={idx} className={styles['social-item']}>
                                            <i className={`fab fa-${platform.platform}`}></i>
                                            <span className={styles['count']}>
                                                {platform.followers?.toLocaleString()}
                                            </span>
                                            <span className={styles['label']}>followers</span>
                                            <div className={styles['platform-stats']}>
                                                <span>Avg Likes: {platform.avgLikes?.toLocaleString()}</span>
                                                <span>Avg Comments: {platform.avgComments?.toLocaleString()}</span>
                                                <span>Avg Views: {platform.avgViews?.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles['profile-sidebar']}>
                        <div className={styles['content-section']}>
                            <h2>Top Performing Content</h2>
                            {influencer.bestPosts && influencer.bestPosts.length > 0 ? (
                                <div className={styles['content-grid']}>
                                    {influencer.bestPosts.map((post, idx) => (
                                        <div key={idx} className={styles['content-card']}>
                                            <div className={`${styles['content-platform']} ${styles[post.platform.toLowerCase()]}`}>
                                                <i className={`fab fa-${post.platform.toLowerCase()}`}></i>
                                                {post.platform}
                                            </div>
                                            <div className={styles['content-stats']}>
                                                <div className={styles['stat']}>
                                                    <i className="fas fa-heart"></i>
                                                    <span>{post.likes?.toLocaleString()}</span>
                                                </div>
                                                <div className={styles['stat']}>
                                                    <i className="fas fa-comment"></i>
                                                    <span>{post.comments?.toLocaleString()}</span>
                                                </div>
                                                <div className={styles['stat']}>
                                                    <i className="fas fa-eye"></i>
                                                    <span>{post.views?.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className={styles['no-data-message']}>No content available to display.</p>
                            )}
                        </div>

                        <div className={styles['profile-card']}>
                            <h3>Member Since</h3>
                            <div className={styles['member-since']}>
                                <i className="fas fa-calendar-alt"></i>
                                {new Date(influencer.createdAt).toLocaleDateString()}
                            </div>
                        </div>

                        <div className={`${styles['profile-card']} ${styles['actions-card']}`}>
                            <button className={styles['btn-danger']} onClick={() => setDeleteModalOpen(true)}>
                                <i className="fas fa-trash-alt"></i> Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal */}
            {editModalOpen && (
                <div 
                    className={styles['modal']} 
                    style={{ display: 'block' }}
                    onClick={(e) => {
                        if (e.target.className === styles['modal']) {
                            setEditModalOpen(false);
                        }
                    }}
                >
                    <div className={styles['modal-content']} onClick={(e) => e.stopPropagation()}>
                        <span className={styles['close-modal']} onClick={() => setEditModalOpen(false)}>&times;</span>
                        <h2>Edit Influencer Profile</h2>
                        <form id="profileForm" onSubmit={handleProfileSubmit}>
                            <div className={styles['form-row']}>
                                <div className={styles['form-group']}>
                                    <label htmlFor="displayName">Display Name</label>
                                    <input 
                                        type="text" 
                                        className={styles['form-control']} 
                                        id="displayName" 
                                        name="displayName"
                                        value={editForm.displayName}
                                        onChange={(e) => {
                                            setEditForm(prev => ({ ...prev, displayName: e.target.value }));
                                            if (formErrors.displayName) {
                                                setFormErrors(prev => {
                                                    const newErrors = { ...prev };
                                                    delete newErrors.displayName;
                                                    return newErrors;
                                                });
                                            }
                                        }}
                                        required
                                    />
                                    {formErrors.displayName && (
                                        <small className={styles['form-text']} style={{ color: '#b00020' }}>
                                            {formErrors.displayName}
                                        </small>
                                    )}
                                </div>
                                <div className={styles['form-group']}>
                                    <label htmlFor="username">Username</label>
                                    <input 
                                        type="text" 
                                        className={styles['form-control']} 
                                        id="username" 
                                        name="username"
                                        value={editForm.username}
                                        onChange={(e) => {
                                            setEditForm(prev => ({ ...prev, username: e.target.value }));
                                            if (formErrors.username) {
                                                setFormErrors(prev => {
                                                    const newErrors = { ...prev };
                                                    delete newErrors.username;
                                                    return newErrors;
                                                });
                                            }
                                        }}
                                        required
                                    />
                                    {formErrors.username && (
                                        <small className={styles['form-text']} style={{ color: '#b00020' }}>
                                            {formErrors.username}
                                        </small>
                                    )}
                                </div>
                            </div>

                            <div className={styles['form-group']}>
                                <label htmlFor="bio">Bio</label>
                                <textarea 
                                    className={styles['form-control']} 
                                    id="bio" 
                                    name="bio"
                                    value={editForm.bio}
                                    onChange={(e) => {
                                        setEditForm(prev => ({ ...prev, bio: e.target.value }));
                                        if (formErrors.bio) {
                                            setFormErrors(prev => {
                                                const newErrors = { ...prev };
                                                delete newErrors.bio;
                                                return newErrors;
                                            });
                                        }
                                    }}
                                    required
                                />
                                {formErrors.bio && (
                                    <small className={styles['form-text']} style={{ color: '#b00020' }}>
                                        {formErrors.bio}
                                    </small>
                                )}
                            </div>

                            <div className={styles['form-row']}>
                                <div className={styles['form-group']}>
                                    <label htmlFor="location">Location</label>
                                    <input 
                                        type="text" 
                                        className={styles['form-control']} 
                                        id="location" 
                                        name="location"
                                        value={editForm.location}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                                    />
                                </div>
                                <div className={styles['form-group']}>
                                    <label htmlFor="audienceGender">Primary Audience Gender</label>
                                    <select 
                                        className={styles['form-control']} 
                                        id="audienceGender" 
                                        name="audienceGender"
                                        value={editForm.audienceGender}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, audienceGender: e.target.value }))}
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Mixed">Mixed</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles['form-group']}>
                                <label htmlFor="audienceAge">Audience Age Range</label>
                                <input 
                                    type="text" 
                                    className={styles['form-control']} 
                                    id="audienceAge" 
                                    name="audienceAge"
                                    value={editForm.audienceAgeRange}
                                    onChange={(e) => {
                                        setEditForm(prev => ({ ...prev, audienceAgeRange: e.target.value }));
                                        if (formErrors.audienceAgeRange) {
                                            setFormErrors(prev => {
                                                const newErrors = { ...prev };
                                                delete newErrors.audienceAgeRange;
                                                return newErrors;
                                            });
                                        }
                                    }}
                                    placeholder="e.g. 18-35"
                                />
                                {formErrors.audienceAgeRange && (
                                    <small className={styles['form-text']} style={{ color: '#b00020' }}>
                                        {formErrors.audienceAgeRange}
                                    </small>
                                )}
                            </div>

                            <div className={styles['form-group']}>
                                <label htmlFor="categories">Content Categories</label>
                                <div id="categoriesContainer">
                                    {editForm.categories.map((category, idx) => (
                                        <span key={idx} className={styles['tag']}>
                                            {category}
                                            <span className={styles['tag-remove']} onClick={() => removeCategory(category)}>×</span>
                                        </span>
                                    ))}
                                </div>
                                <div className={styles['tag-input-container']}>
                                    <input 
                                        type="text" 
                                        id="categoryInput" 
                                        className={styles['form-control']} 
                                        placeholder="Add a category"
                                        value={categoryInput}
                                        onChange={(e) => setCategoryInput(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addCategory();
                                            }
                                        }}
                                    />
                                    <button type="button" className={styles['btn-secondary']} onClick={addCategory}>Add</button>
                                </div>
                                {formErrors.categories && (
                                    <small className={styles['form-text']} style={{ color: '#b00020' }}>
                                        {formErrors.categories}
                                    </small>
                                )}
                            </div>

                            <div className={styles['form-group']}>
                                <label htmlFor="languages">Languages</label>
                                <div id="languagesContainer">
                                    {editForm.languages.map((language, idx) => (
                                        <span key={idx} className={styles['tag']}>
                                            {language}
                                            <span className={styles['tag-remove']} onClick={() => removeLanguage(language)}>×</span>
                                        </span>
                                    ))}
                                </div>
                                <div className={styles['tag-input-container']}>
                                    <input 
                                        type="text" 
                                        id="languageInput" 
                                        className={styles['form-control']} 
                                        placeholder="Add a language"
                                        value={languageInput}
                                        onChange={(e) => setLanguageInput(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addLanguage();
                                            }
                                        }}
                                    />
                                    <button type="button" className={styles['btn-secondary']} onClick={addLanguage}>Add</button>
                                </div>
                                {formErrors.languages && (
                                    <small className={styles['form-text']} style={{ color: '#b00020' }}>
                                        {formErrors.languages}
                                    </small>
                                )}
                            </div>

                            <div className={styles['form-group']}>
                                <label>Social Media Links</label>
                                <div id="socialLinks">
                                    {editForm.socials.map((social, index) => (
                                        <div key={index} className={styles['social-platform-row']}>
                                            <div className={`${styles['form-group']} ${styles['social-platform-select']}`}>
                                                <label htmlFor={`socialPlatform${index}`}>Platform</label>
                                                <select 
                                                    className={styles['form-control']} 
                                                    id={`socialPlatform${index}`}
                                                    value={social.platform}
                                                    onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                                                >
                                                    <option value="instagram">Instagram</option>
                                                    <option value="youtube">YouTube</option>
                                                    <option value="tiktok">TikTok</option>
                                                    <option value="twitter">Twitter</option>
                                                    <option value="facebook">Facebook</option>
                                                    <option value="linkedin">LinkedIn</option>
                                                </select>
                                            </div>
                                            <div className={`${styles['form-group']} ${styles['social-platform-url']}`}>
                                                <label htmlFor={`socialUrl${index}`}>Profile URL</label>
                                                <input 
                                                    type="url" 
                                                    className={styles['form-control']} 
                                                    id={`socialUrl${index}`}
                                                    value={social.url || ''}
                                                    onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                                                    placeholder="Profile URL"
                                                />
                                            </div>
                                            <div className={`${styles['form-group']} ${styles['social-platform-followers']}`}>
                                                <label htmlFor={`socialFollowers${index}`}>Followers</label>
                                                <input 
                                                    type="number" 
                                                    className={styles['form-control']} 
                                                    id={`socialFollowers${index}`}
                                                    value={social.followers || 0}
                                                    onChange={(e) => updateSocialLink(index, 'followers', parseInt(e.target.value) || 0)}
                                                    placeholder="Followers"
                                                    min="0"
                                                />
                                            </div>
                                            <div className={`${styles['form-group']} ${styles['social-platform-remove']}`}>
                                                <button 
                                                    type="button" 
                                                    className={styles['btn-secondary']}
                                                    onClick={() => removeSocialLink(index)}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button 
                                    type="button" 
                                    className={`${styles['btn-secondary']} ${styles['btn-add-social']}`} 
                                    onClick={addSocialLink}
                                >
                                    <i className="fas fa-plus"></i> Add Social Link
                                </button>
                                {formErrors.socials && (
                                    <small className={styles['form-text']} style={{ color: '#b00020' }}>
                                        {formErrors.socials}
                                    </small>
                                )}
                            </div>

                            <div className={styles['form-actions']}>
                                <button 
                                    type="button" 
                                    className={styles['btn-secondary']} 
                                    onClick={() => setEditModalOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className={styles['btn-primary']} disabled={submitting}>
                                    {submitting ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Images Modal */}
            {imagesModalOpen && (
                <div 
                    className={styles['modal']} 
                    style={{ display: 'block' }}
                    onClick={(e) => {
                        if (e.target.className === styles['modal']) {
                            setImagesModalOpen(false);
                        }
                    }}
                >
                    <div className={styles['modal-content']} onClick={(e) => e.stopPropagation()}>
                        <span className={styles['close-modal']} onClick={() => setImagesModalOpen(false)}>&times;</span>
                        <h2>Edit Profile Images</h2>
                        <form id="imagesForm" onSubmit={handleImageSubmit} encType="multipart/form-data">
                            <div className={styles['form-group']}>
                                <label htmlFor="profilePic">Profile Picture</label>
                                <div className={styles['file-upload']}>
                                    <label className={styles['file-upload-label']} htmlFor="profilePic">
                                        <i className="fas fa-camera"></i>
                                        Click to upload new profile picture
                                        <input 
                                            type="file" 
                                            className={styles['file-upload-input']} 
                                            id="profilePic" 
                                            name="profilePic"
                                            accept="image/*"
                                            onChange={handleProfilePicChange}
                                        />
                                    </label>
                                    <img 
                                        id="profilePicPreview" 
                                        className={styles['preview-image']}
                                        src={profilePicPreview} 
                                        alt="Profile Preview"
                                    />
                                </div>
                                <small className={styles['form-text']} style={{ color: '#666' }}>
                                    Max size: 5MB. Allowed formats: JPG, PNG, GIF
                                </small>
                                {imageErrors.profilePic && (
                                    <small className={styles['form-text']} style={{ color: '#b00020' }}>
                                        {imageErrors.profilePic}
                                    </small>
                                )}
                            </div>

                            <div className={styles['form-group']}>
                                <label htmlFor="bannerImage">Banner Image</label>
                                <div className={styles['file-upload']}>
                                    <label className={styles['file-upload-label']} htmlFor="bannerImage">
                                        <i className="fas fa-image"></i>
                                        Click to upload new banner image
                                        <input 
                                            type="file" 
                                            className={styles['file-upload-input']} 
                                            id="bannerImage" 
                                            name="bannerImage"
                                            accept="image/*"
                                            onChange={handleBannerChange}
                                        />
                                    </label>
                                    <img 
                                        id="bannerPreview" 
                                        className={styles['preview-image']}
                                        src={bannerPreview} 
                                        alt="Banner Preview"
                                    />
                                </div>
                                <small className={styles['form-text']} style={{ color: '#666' }}>
                                    Max size: 10MB. Allowed formats: JPG, PNG, GIF
                                </small>
                                {imageErrors.bannerImage && (
                                    <small className={styles['form-text']} style={{ color: '#b00020' }}>
                                        {imageErrors.bannerImage}
                                    </small>
                                )}
                            </div>

                            <div className={styles['form-actions']}>
                                <button 
                                    type="button" 
                                    className={styles['btn-secondary']} 
                                    onClick={() => setImagesModalOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className={styles['btn-primary']} disabled={uploadingImages}>
                                    {uploadingImages ? 'Uploading...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Account Modal */}
            {deleteModalOpen && (
                <div 
                    className={styles['modal']} 
                    style={{ display: 'block' }}
                    onClick={(e) => {
                        if (e.target.className === styles['modal']) {
                            setDeleteModalOpen(false);
                        }
                    }}
                >
                    <div className={styles['modal-content']} onClick={(e) => e.stopPropagation()}>
                        <span className={styles['close-modal']} onClick={() => setDeleteModalOpen(false)}>&times;</span>
                        <h2>Delete Your Account</h2>
                        <div className={styles['margin-bottom-20']}>
                            <p>Are you sure you want to delete your influencer account? This action cannot be undone.</p>
                            <p>All your campaigns, collaborations, and data will be permanently removed.</p>
                        </div>
                        <div className={styles['form-group']}>
                            <label htmlFor="confirmDelete">Type "DELETE" to confirm:</label>
                            <input 
                                type="text" 
                                className={styles['form-control']} 
                                id="confirmDelete" 
                                placeholder="DELETE"
                                value={deleteConfirm}
                                onChange={(e) => setDeleteConfirm(e.target.value)}
                            />
                        </div>
                        <div className={styles['form-actions']}>
                            <button 
                                type="button" 
                                className={styles['btn-danger']} 
                                onClick={handleDeleteAccount}
                                disabled={deleteConfirm !== 'DELETE'}
                            >
                                Delete Account Permanently
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
