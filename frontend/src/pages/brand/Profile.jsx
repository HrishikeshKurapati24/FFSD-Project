import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../styles/brand/profile.module.css';
import { API_BASE_URL } from '../../services/api';
import { useExternalAssets } from '../../hooks/useExternalAssets';
import { useBrand } from '../../contexts/BrandContext';
import BrandNavigation from '../../components/brand/BrandNavigation';
import NotificationModal from '../../components/brand/NotificationModal';
import {
    addValue,
    removeTag,
    addSocialLink,
    removeSocialLink,
    handleProfileFormSubmit,
    handleImagesFormSubmit,
    handleDeleteAccountSubmit,
    createImagePreview
} from '../../utils/BrandProfile';
import ProfileBanner from '../../components/brand/profile/ProfileBanner';
import AboutSection from '../../components/brand/profile/AboutSection';
import MetricsSection from '../../components/brand/profile/MetricsSection';
import TopCampaignsSection from '../../components/brand/profile/TopCampaignsSection';
import SocialMediaSection from '../../components/brand/profile/SocialMediaSection';
import WebsiteSection from '../../components/brand/profile/WebsiteSection';
import TargetAudienceSection from '../../components/brand/profile/TargetAudienceSection';
import SidebarActions from '../../components/brand/profile/SidebarActions';
import EditProfileModal from '../../components/brand/profile/EditProfileModal';
import EditImagesModal from '../../components/brand/profile/EditImagesModal';
import DeleteAccountModal from '../../components/brand/profile/DeleteAccountModal';

const EXTERNAL_ASSETS = {
    styles: [
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
        'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css'
    ],
    scripts: [
        'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js'
    ]
};

const Profile = () => {
    useExternalAssets(EXTERNAL_ASSETS);
    const navigate = useNavigate();
    const { brand, loading, error, refreshBrand, updateBrand, signOut } = useBrand();

    // Modal states
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editImagesModalOpen, setEditImagesModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [notificationModalOpen, setNotificationModalOpen] = useState(false);

    // Handlers
    const handleSignOut = async () => {
        await signOut();
        navigate('/signin');
    };

    const handleOpenEditModal = () => setEditModalOpen(true);
    const handleCloseEditModal = () => setEditModalOpen(false);

    const handleOpenEditImagesModal = () => setEditImagesModalOpen(true);
    const handleCloseEditImagesModal = () => setEditImagesModalOpen(false);

    const handleOpenDeleteModal = () => setDeleteModalOpen(true);
    const handleCloseDeleteModal = () => setDeleteModalOpen(false);

    // Form data state
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        description: '',
        mission: '',
        currentCampaign: '',
        primaryMarket: '',
        website: '',
        targetAgeRange: '',
        targetGender: '',
        values: [],
        socialLinks: []
    });

    // Image form data
    const [imageFormData, setImageFormData] = useState({
        logo: null,
        banner: null
    });

    // Image previews
    const [logoPreview, setLogoPreview] = useState('');
    const [bannerPreview, setBannerPreview] = useState('');

    // Value input state
    const [valueInput, setValueInput] = useState('');
    const [interestInput, setInterestInput] = useState(''); // Added interest input state

    // Loading state for form submission
    const [isSubmitting, setIsSubmitting] = useState(false); // Added submit state

    // Delete confirmation state
    const [deleteConfirmation, setDeleteConfirmation] = useState('');

    // Form validation errors
    const [formErrors, setFormErrors] = useState({});
    const [imageErrors, setImageErrors] = useState({});

    // Initialize form data from context brand data
    useEffect(() => {
        if (brand) {
            setFormData({
                name: brand.name || '',
                username: brand.username || '',
                description: brand.description || '',
                mission: brand.mission || '',
                currentCampaign: brand.currentCampaign || '',
                location: brand.location || '', // Added location
                primaryMarket: brand.primaryMarket || '',
                phone: brand.phone || '', // Added phone
                industry: brand.industry || '', // Added industry
                tagline: brand.tagline || '', // Added tagline
                targetInterests: brand.targetInterests || [], // Added targetInterests
                website: brand.website || '',
                targetAgeRange: brand.targetAgeRange || '',
                targetGender: brand.targetGender || '',
                values: brand.values || [],
                socialLinks: brand.socialLinks || []
            });
            setLogoPreview(brand.logoUrl || '');
            setBannerPreview(brand.bannerUrl || '');
        }
    }, [brand]);

    // ... (keep handleSignOut and Modal handlers as is)

    // Add value tag handler using utility function
    const handleAddValue = () => {
        const updatedValues = addValue(formData.values, valueInput);
        if (updatedValues.length !== formData.values.length) {
            setFormData(prev => ({
                ...prev,
                values: updatedValues
            }));
            setValueInput('');
        }
    };

    // Remove value tag handler using utility function
    const handleRemoveValue = (valueToRemove) => {
        const updatedValues = removeTag(formData.values, valueToRemove);
        setFormData(prev => ({
            ...prev,
            values: updatedValues
        }));
    };

    // Add interest tag handler
    const handleAddInterest = () => {
        const updatedInterests = addValue(formData.targetInterests, interestInput);
        if (updatedInterests.length !== formData.targetInterests.length) {
            setFormData(prev => ({
                ...prev,
                targetInterests: updatedInterests
            }));
            setInterestInput('');
        }
    };

    // Remove interest tag handler
    const handleRemoveInterest = (interestToRemove) => {
        const updatedInterests = removeTag(formData.targetInterests, interestToRemove);
        setFormData(prev => ({
            ...prev,
            targetInterests: updatedInterests
        }));
    };

    // Social Link Handlers
    const handleAddSocialLink = () => {
        setFormData(prev => ({
            ...prev,
            socialLinks: addSocialLink(prev.socialLinks)
        }));
    };

    const handleRemoveSocialLink = (index) => {
        setFormData(prev => ({
            ...prev,
            socialLinks: removeSocialLink(prev.socialLinks, index)
        }));
    };

    const handleSocialLinkChange = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            socialLinks: prev.socialLinks.map((link, i) =>
                i === index ? { ...link, [field]: value } : link
            )
        }));
    };

    // Submit profile form using helper
    const handleSubmitProfile = async (e) => {
        console.log('handleSubmitProfile called');
        e.preventDefault(); // Explicitly prevent default here too just in case
        setIsSubmitting(true); // Start loading

        console.log('Submitting form data:', formData);

        await handleProfileFormSubmit(
            e,
            formData,
            async (result) => {
                console.log('Submission successful:', result);
                alert(result.message || 'Profile updated successfully!');
                setEditModalOpen(false);
                setFormErrors({});
                setIsSubmitting(false); // Stop loading on success
                // Refresh brand data via context
                try {
                    await refreshBrand();
                } catch (refreshError) {
                    console.error('Failed to refresh context, but data is saved in database:', refreshError);
                }
            },
            (errors = {}) => {
                console.error('Submission failed with errors:', errors);
                setFormErrors(errors);
                setIsSubmitting(false); // Stop loading on error
                if (errors?.general) {
                    alert(errors.general);
                } else {
                    // Alert first validation error if generic error not present
                    const firstError = Object.values(errors)[0];
                    if (firstError) alert(`Validation Error: ${firstError}`);
                }
            }
        );
    };

    // Submit images form using helper
    // IMPORTANT: Same persistence guarantee as profile update - database saves first
    const handleSubmitImages = async (e) => {
        await handleImagesFormSubmit(
            e,
            imageFormData,
            async (result) => {
                alert(result.message || 'Images updated successfully!');
                setEditImagesModalOpen(false);
                setImageErrors({});
                setImageFormData({ logo: null, banner: null });
                // Refresh brand data from database via context after image upload
                // Database already has updated images, so this ensures context matches database
                try {
                    await refreshBrand();
                } catch (refreshError) {
                    console.error('Failed to refresh context, but images are saved in database:', refreshError);
                    // Images are safe in database, context will load them on next page load
                }
            },
            (errors = {}) => {
                setImageErrors(errors);
                if (errors?.general) {
                    alert(errors.general);
                }
            }
        );
    };

    // Handle delete account using helper
    const handleDeleteAccount = async (e) => {
        await handleDeleteAccountSubmit(
            e,
            deleteConfirmation,
            () => {
                alert('Account deleted successfully');
                setDeleteModalOpen(false);
                setDeleteConfirmation('');
                navigate('/');
            },
            (errors = {}) => {
                if (errors?.confirmation) {
                    alert(errors.confirmation);
                } else if (errors?.general) {
                    alert(errors.general);
                }
            }
        );
    };

    // Handle image file changes using utility function
    const handleImageChange = async (e) => {
        const { name, files } = e.target;
        if (files[0]) {
            setImageFormData(prev => ({
                ...prev,
                [name]: files[0]
            }));

            // Preview image using utility function
            try {
                const previewUrl = await createImagePreview(files[0]);
                if (name === 'logo') {
                    setLogoPreview(previewUrl);
                } else if (name === 'banner') {
                    setBannerPreview(previewUrl);
                }
            } catch (error) {
                console.error('Error creating image preview:', error);
            }
        }
    };

    // Get market emoji
    const getMarketEmoji = (market) => {
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
            <div className={styles.profilePageWrapper}>
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <p>Loading profile...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.profilePageWrapper}>
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <p style={{ color: 'red' }}>Error: {error}</p>
                </div>
            </div>
        );
    }

    if (!brand) {
        return (
            <div className={styles.profilePageWrapper}>
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <p>No profile data available</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.profilePageWrapper}>
            <BrandNavigation
                onSignOut={handleSignOut}
                showNotification={true}
                onNotificationClick={() => setNotificationModalOpen(true)}
            />

            <NotificationModal
                isOpen={notificationModalOpen}
                onClose={() => setNotificationModalOpen(false)}
            />

            <div className="container">
                <ProfileBanner
                    brand={brand}
                    getMarketEmoji={getMarketEmoji}
                    onOpenEditImages={handleOpenEditImagesModal}
                />

                <div className="profile-content">
                    <div className="profile-main">
                        <AboutSection brand={brand} onOpenEditModal={handleOpenEditModal} />
                        <MetricsSection brand={brand} />
                        <TopCampaignsSection brand={brand} />
                    </div>

                    <div className="profile-sidebar">
                        <SocialMediaSection brand={brand} />
                        <WebsiteSection brand={brand} />
                        <TargetAudienceSection brand={brand} />
                        <SidebarActions onOpenDeleteModal={handleOpenDeleteModal} />
                    </div>
                </div>
            </div>

            <EditProfileModal
                isOpen={editModalOpen}
                onClose={handleCloseEditModal}
                formData={formData}
                setFormData={setFormData}
                valueInput={valueInput}
                setValueInput={setValueInput}
                interestInput={interestInput} // Added
                setInterestInput={setInterestInput} // Added
                formErrors={formErrors}
                onAddValue={handleAddValue}
                onRemoveValue={handleRemoveValue}
                onAddInterest={handleAddInterest} // Added
                onRemoveInterest={handleRemoveInterest} // Added
                onAddSocialLink={handleAddSocialLink}
                onRemoveSocialLink={handleRemoveSocialLink}
                onSocialLinkChange={handleSocialLinkChange}
                onSubmit={handleSubmitProfile}
                isSubmitting={isSubmitting} // Added
            />

            <EditImagesModal
                isOpen={editImagesModalOpen}
                onClose={handleCloseEditImagesModal}
                logoPreview={logoPreview}
                bannerPreview={bannerPreview}
                imageErrors={imageErrors}
                onImageChange={handleImageChange}
                onSubmit={handleSubmitImages}
            />

            <DeleteAccountModal
                isOpen={deleteModalOpen}
                onClose={handleCloseDeleteModal}
                deleteConfirmation={deleteConfirmation}
                setDeleteConfirmation={setDeleteConfirmation}
                onSubmit={handleDeleteAccount}
            />
        </div>
    );
};

export default Profile;