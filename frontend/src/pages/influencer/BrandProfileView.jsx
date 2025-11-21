import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from '../../styles/influencer/brand_profile.module.css';
import { API_BASE_URL } from '../../services/api';
import { useExternalAssets } from '../../hooks/useExternalAssets';
import InfluencerNavigation from '../../components/influencer/InfluencerNavigation';
import BrandProfileHeader from '../../components/influencer/brandProfile/BrandProfileHeader';
import SocialPlatforms from '../../components/influencer/brandProfile/SocialPlatforms';
import TopCampaigns from '../../components/influencer/brandProfile/TopCampaigns';
import BrandInfoPanel from '../../components/influencer/brandProfile/BrandInfoPanel';

const EXTERNAL_ASSETS = {
    styles: ['https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'],
    scripts: []
};

const formatNumber = (value) => {
    if (value === null || value === undefined) {
        return '0';
    }
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
    }
    return Number(value).toLocaleString();
};

const sanitizeWebsite = (url = '') => url.replace(/^https?:\/\//i, '').replace(/\/$/, '');

const formatDecimal = (value, digits = 1) => Number(value ?? 0).toFixed(digits);

const getPlatformBackground = (platform = '') => {
    const normalized = platform.toLowerCase();
    return normalized ? `${normalized}-bg` : 'default-bg';
};

const BrandProfileView = () => {
    useExternalAssets(EXTERNAL_ASSETS);
    const { id } = useParams();
    const navigate = useNavigate();
    const [brand, setBrand] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchBrandProfile = useCallback(async () => {
        if (!id) {
            setError('Brand ID is missing.');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`${API_BASE_URL}/influencer/brand_profile/${id}`, {
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (response.status === 401) {
                navigate('/signin');
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to load brand profile.');
            }

            const data = await response.json();
            if (data.success) {
                setBrand(data.brand || null);
            } else {
                setError(data.message || 'Unable to load brand profile.');
            }
        } catch (err) {
            console.error('Error fetching brand profile:', err);
            setError('Something went wrong while loading the brand profile.');
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => {
        fetchBrandProfile();
    }, [fetchBrandProfile]);

    const handleSignOut = async (event) => {
        event?.preventDefault();
        try {
            const response = await fetch(`${API_BASE_URL}/influencer/signout`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (response.ok) {
                const contentType = response.headers.get('content-type');
                if (contentType?.includes('application/json')) {
                    const data = await response.json();
                    if (data.success) {
                        window.location.href = '/signin';
                        return;
                    }
                }
            }
        } catch (signOutError) {
            console.error('Error signing out:', signOutError);
        }
        window.location.href = '/signin';
    };

    const handleBack = useCallback(
        (event) => {
            event?.preventDefault();
            navigate('/influencer/explore', { replace: true });
        },
        [navigate]
    );

    const rootClassName = `${styles['brand-profile-page']} brand-profile-page`;

    if (loading) {
        return (
            <div className={rootClassName}>
                <div className="loading-state">Loading brand profile...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={rootClassName}>
                <div className="error-state">{error}</div>
            </div>
        );
    }

    if (!brand) {
        return (
            <div className={rootClassName}>
                <div className="error-state">Brand profile not found.</div>
            </div>
        );
    }

    const socials = Array.isArray(brand.socials) ? brand.socials : [];
    const bestPosts = Array.isArray(brand.bestPosts) ? brand.bestPosts : [];
    const categories = Array.isArray(brand.categories) ? brand.categories : [];
    const languages = Array.isArray(brand.languages) ? brand.languages : [];
    const performanceMetrics = brand.performanceMetrics || {};
    const audience = brand.audienceDemographics || {};

    return (
        <div className={rootClassName}>
            <InfluencerNavigation onSignOut={handleSignOut} />

            <BrandProfileHeader
                brand={brand}
                formatNumber={formatNumber}
                formatDecimal={formatDecimal}
                onBack={handleBack}
            />

            <section className="profile-content">
                <div className="profile-details">
                    <div className="main-content">
                        <SocialPlatforms
                            socials={socials}
                            formatNumber={formatNumber}
                            getPlatformBackground={getPlatformBackground}
                        />
                        <TopCampaigns posts={bestPosts} formatNumber={formatNumber} />
                    </div>

                    <div className="side-content">
                        <BrandInfoPanel
                            brand={brand}
                            audience={audience}
                            performanceMetrics={performanceMetrics}
                            categories={categories}
                            languages={languages}
                            sanitizeWebsite={sanitizeWebsite}
                            formatNumber={formatNumber}
                            formatDecimal={formatDecimal}
                        />
                    </div>
                </div>
            </section>
        </div>
    );
};

export default BrandProfileView;