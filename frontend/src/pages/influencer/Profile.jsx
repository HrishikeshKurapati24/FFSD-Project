import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../styles/influencer/profile.module.css';
import { API_BASE_URL } from '../../services/api';
import { useExternalAssets } from '../../hooks/useExternalAssets';
import { useInfluencer } from '../../contexts/InfluencerContext';
import InfluencerNavigation from '../../components/influencer/InfluencerNavigation';
import ProfileBanner from '../../components/influencer/profile/ProfileBanner';
import AboutSection from '../../components/influencer/profile/AboutSection';
import MetricsSection from '../../components/influencer/profile/MetricsSection';
import SocialMediaSection from '../../components/influencer/profile/SocialMediaSection';
import TopContentSection from '../../components/influencer/profile/TopContentSection';
import SidebarActions from '../../components/influencer/profile/SidebarActions';
import EditProfileModal from '../../components/influencer/profile/EditProfileModal';
import EditImagesModal from '../../components/influencer/profile/EditImagesModal';
import DeleteAccountModal from '../../components/influencer/profile/DeleteAccountModal';

const EXTERNAL_ASSETS = {
    styles: [
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
    ],
    scripts: []
};

const Profile = () => {
    useExternalAssets(EXTERNAL_ASSETS);
    const navigate = useNavigate();
    const { influencer, loading, error, refreshInfluencer, updateInfluencer } = useInfluencer();

    // Modal states
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editImagesModalOpen, setEditImagesModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    // Form states
    const [profileFormData, setProfileFormData] = useState({
        displayName: '',
        username: '',
        bio: '',
        location: '',
        phone: '', // Added
        niche: '', // Added
        audienceGender: '',
        audienceAgeRange: '',
        categories: [],
        languages: [],
        socials: []
    });
    const [imagesFormData, setImagesFormData] = useState({
        profilePic: null,
        bannerImage: null
    });
    const [deleteConfirm, setDeleteConfirm] = useState('');

    // Loading state
    const [isSubmitting, setIsSubmitting] = useState(false); // Added
    const [formErrors, setFormErrors] = useState({}); // Added

    // Tag input states
    const [newCategory, setNewCategory] = useState('');
    const [newLanguage, setNewLanguage] = useState('');

    // Image previews
    const [profilePicPreview, setProfilePicPreview] = useState('');
    const [bannerPreview, setBannerPreview] = useState('');

    const profilePicInputRef = useRef(null);
    const bannerInputRef = useRef(null);

    // Initialize form data from context influencer data
    useEffect(() => {
        if (influencer) {
            setProfileFormData({
                displayName: influencer.displayName || influencer.name || '',
                username: influencer.username || '',
                bio: influencer.bio || '',
                location: influencer.location || '',
                phone: influencer.phone || '',
                niche: influencer.niche || '',
                audienceGender: influencer.audienceGender || influencer.audience_gender || '',
                audienceAgeRange: influencer.audienceAgeRange || influencer.audience_age_range || '',
                categories: influencer.categories || [],
                languages: influencer.languages || [],
                socials: influencer.socials || influencer.social_media_links || []
            });
            setProfilePicPreview(influencer.profilePicUrl || '');
            setBannerPreview(influencer.bannerUrl || '');
        }
    }, [influencer]);

    // Validation function
    const validateForm = (data) => {
        const errors = {};
        if (!data.displayName) errors.displayName = 'Display Name is required';
        if (!data.username) errors.username = 'Username is required';
        if (!data.niche) errors.niche = 'Niche is required'; // Added validation

        // Phone validation
        if (data.phone && !/^\+?[1-9]\d{1,14}$/.test(data.phone)) {
            errors.phone = 'Please enter a valid phone number';
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    };

    // Handle 401 errors - redirect to signin
    // Handle 401 errors - redirect to signin
    // useEffect(() => {
    //     if (error === 'Authentication required') {
    //         navigate('/signin');
    //     }
    // }, [error, navigate]);

    // Handle sign out
    const handleSignOut = async (e) => {
        e?.preventDefault();

        try {
            const response = await fetch(`${API_BASE_URL}/influencer/signout`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (response.ok) {
                window.location.href = '/signin';
            } else {
                window.location.href = '/signin';
            }
        } catch (error) {
            console.error('Error during signout:', error);
            window.location.href = '/signin';
        }
    };

    // Modal handlers
    const handleOpenEditModal = () => {
        setEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setEditModalOpen(false);
    };

    const handleOpenEditImagesModal = () => {
        setEditImagesModalOpen(true);
    };

    const handleCloseEditImagesModal = () => {
        setEditImagesModalOpen(false);
    };

    const handleOpenDeleteModal = () => {
        setDeleteModalOpen(true);
        setDeleteConfirm('');
    };

    const handleCloseDeleteModal = () => {
        setDeleteModalOpen(false);
        setDeleteConfirm('');
    };

    // Tag management
    const handleAddCategory = () => {
        if (newCategory.trim() && !profileFormData.categories.includes(newCategory.trim())) {
            setProfileFormData(prev => ({
                ...prev,
                categories: [...prev.categories, newCategory.trim()]
            }));
            setNewCategory('');
        }
    };

    const handleRemoveCategory = (category) => {
        setProfileFormData(prev => ({
            ...prev,
            categories: prev.categories.filter(cat => cat !== category)
        }));
    };

    const handleAddLanguage = () => {
        if (newLanguage.trim() && !profileFormData.languages.includes(newLanguage.trim())) {
            setProfileFormData(prev => ({
                ...prev,
                languages: [...prev.languages, newLanguage.trim()]
            }));
            setNewLanguage('');
        }
    };

    const handleRemoveLanguage = (language) => {
        setProfileFormData(prev => ({
            ...prev,
            languages: prev.languages.filter(lang => lang !== language)
        }));
    };

    // Social links management
    const handleAddSocialLink = () => {
        setProfileFormData(prev => ({
            ...prev,
            socials: [...prev.socials, { platform: 'instagram', url: '', followers: 0 }]
        }));
    };

    const handleRemoveSocialLink = (index) => {
        setProfileFormData(prev => ({
            ...prev,
            socials: prev.socials.filter((_, i) => i !== index)
        }));
    };

    const handleSocialChange = (index, field, value) => {
        setProfileFormData(prev => ({
            ...prev,
            socials: prev.socials.map((social, i) =>
                i === index ? { ...social, [field]: value } : social
            )
        }));
    };

    // Image preview handlers
    const handleProfilePicChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImagesFormData(prev => ({ ...prev, profilePic: file }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePicPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleBannerChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImagesFormData(prev => ({ ...prev, bannerImage: file }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setBannerPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle profile form submission
    // IMPORTANT: This flow ensures data persistence:
    // 1. Backend API saves to database first
    // 2. Only after backend confirms success, we refresh context from database
    // 3. If user logs out before context refresh, database still has updated data
    // 4. On next login, context will load the updated data from database
    const handleProfileSubmit = async (e) => {
        e.preventDefault();

        // Validate form
        const validation = validateForm(profileFormData);
        if (!validation.isValid) {
            setFormErrors(validation.errors);
            // Scroll to top or first error could be nice, but for now just showing errors
            return;
        }

        setIsSubmitting(true);
        setFormErrors({});

        try {
            const response = await fetch(`${API_BASE_URL}/influencer/profile/update`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(profileFormData)
            });

            const data = await response.json();

            if (data.success) {
                alert('Profile updated successfully!');
                handleCloseEditModal();
                // Refresh influencer data from database via context
                // Database already has updated data, so this ensures context matches database
                try {
                    await refreshInfluencer();
                } catch (refreshError) {
                    console.error('Failed to refresh context, but data is saved in database:', refreshError);
                    // Data is safe in database, context will load it on next page load
                }
            } else {
                alert('Failed to update profile: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('An error occurred while updating the profile. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle images form submission
    const handleImagesSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        if (imagesFormData.profilePic) {
            formData.append('profilePic', imagesFormData.profilePic);
        }
        if (imagesFormData.bannerImage) {
            formData.append('bannerImage', imagesFormData.bannerImage);
        }

        try {
            const response = await fetch(`${API_BASE_URL}/influencer/profile/update`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                alert('Images updated successfully!');
                handleCloseEditImagesModal();
                setImagesFormData({ profilePic: null, bannerImage: null });
                // Refresh influencer data from database via context after image upload
                // Database already has updated images, so this ensures context matches database
                try {
                    await refreshInfluencer();
                } catch (refreshError) {
                    console.error('Failed to refresh context, but images are saved in database:', refreshError);
                    // Images are safe in database, context will load them on next page load
                }
            } else {
                alert('Failed to update images: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error updating images:', error);
            alert('An error occurred while updating the images. Please try again.');
        }
    };

    // Handle delete account
    const handleDeleteAccount = async () => {
        if (deleteConfirm !== 'DELETE') {
            alert('Please type "DELETE" to confirm');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/influencer/profile/delete`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ confirm: deleteConfirm })
            });

            const data = await response.json();

            if (data.success) {
                alert('Account deleted successfully');
                window.location.href = '/signin';
            } else {
                alert('Failed to delete account: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            alert('An error occurred while deleting the account. Please try again.');
        }
    };

    // Get primary market emoji
    const getPrimaryMarketEmoji = (primaryMarket) => {
        if (!primaryMarket) return '';
        if (primaryMarket.includes('Global')) return '🌎';
        if (primaryMarket.includes('US')) return '🇺🇸';
        if (primaryMarket.includes('UK')) return '🇬🇧';
        if (primaryMarket.includes('Europe')) return '🇪🇺';
        if (primaryMarket.includes('Asia')) return '🌏';
        return '';
    };

    if (loading) {
        return (
            <div className={styles['profile-page']}>
                <div className="loading-message">Loading profile...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles['profile-page']}>
                <div className="error-alert">{error}</div>
            </div>
        );
    }

    if (!influencer) {
        return (
            <div className={styles['profile-page']}>
                <div className="error-alert">Profile not found</div>
            </div>
        );
    }

    return (
        <div className={styles['profile-page']}>
            <InfluencerNavigation onSignOut={handleSignOut} />

            <div className="container">
                <ProfileBanner
                    influencer={influencer}
                    onEditImages={handleOpenEditImagesModal}
                    getPrimaryMarketEmoji={getPrimaryMarketEmoji}
                />

                <div className="profile-content">
                    <div className="profile-main">
                        <div id="about-tab" className="tab-content active">
                            <AboutSection influencer={influencer} onEditProfile={handleOpenEditModal} />
                            <MetricsSection influencer={influencer} />
                            <SocialMediaSection socials={influencer.socials} />
                        </div>
                    </div>

                    <div className="profile-sidebar">
                        <TopContentSection bestPosts={influencer.bestPosts} />
                        <SidebarActions influencer={influencer} onDeleteAccount={handleOpenDeleteModal} />
                    </div>
                </div>
            </div>

            <EditProfileModal
                isOpen={editModalOpen}
                formData={profileFormData}
                setFormData={setProfileFormData}
                newCategory={newCategory}
                setNewCategory={setNewCategory}
                newLanguage={newLanguage}
                setNewLanguage={setNewLanguage}
                onAddCategory={handleAddCategory}
                onRemoveCategory={handleRemoveCategory}
                onAddLanguage={handleAddLanguage}
                onRemoveLanguage={handleRemoveLanguage}
                onAddSocialLink={handleAddSocialLink}
                onRemoveSocialLink={handleRemoveSocialLink}
                onSocialChange={handleSocialChange}
                onClose={handleCloseEditModal}
                onSubmit={handleProfileSubmit}
                formErrors={formErrors} // Added
                isSubmitting={isSubmitting} // Added
            />

            <EditImagesModal
                isOpen={editImagesModalOpen}
                onClose={handleCloseEditImagesModal}
                onSubmit={handleImagesSubmit}
                profilePicPreview={profilePicPreview}
                bannerPreview={bannerPreview}
                onProfilePicChange={handleProfilePicChange}
                onBannerChange={handleBannerChange}
                profilePicInputRef={profilePicInputRef}
                bannerInputRef={bannerInputRef}
            />

            <DeleteAccountModal
                isOpen={deleteModalOpen}
                deleteConfirm={deleteConfirm}
                setDeleteConfirm={setDeleteConfirm}
                onClose={handleCloseDeleteModal}
                onDelete={handleDeleteAccount}
            />
        </div>
    );
};

export default Profile;
