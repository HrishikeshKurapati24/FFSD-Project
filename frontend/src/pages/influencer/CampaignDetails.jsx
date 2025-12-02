import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import styles from '../../styles/influencer/campaign_details.module.css';
import { API_BASE_URL } from '../../services/api';
import { useExternalAssets } from '../../hooks/useExternalAssets';
import InfluencerNavigation from '../../components/influencer/InfluencerNavigation';
import CampaignHeader from '../../components/influencer/campaignDetails/CampaignHeader';
import CampaignOverviewSection from '../../components/influencer/campaignDetails/CampaignOverviewSection';
import CampaignDetailsSection from '../../components/influencer/campaignDetails/CampaignDetailsSection';
import CampaignRequirementsSection from '../../components/influencer/campaignDetails/CampaignRequirementsSection';
import CampaignProductsSection from '../../components/influencer/campaignDetails/CampaignProductsSection';
import CampaignActionBar from '../../components/influencer/campaignDetails/CampaignActionBar';

const EXTERNAL_ASSETS = {
    styles: ['https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'],
    scripts: []
};

const CampaignDetails = () => {
    useExternalAssets(EXTERNAL_ASSETS);
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [collab, setCollab] = useState(null);
    const [applicationStatus, setApplicationStatus] = useState(null);
    const [isEligible, setIsEligible] = useState(true);
    const [unmetRequirements, setUnmetRequirements] = useState([]);
    const [specialMessage, setSpecialMessage] = useState('');
    const [applying, setApplying] = useState(false);

    const fetchCollaborationDetails = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`${API_BASE_URL}/influencer/collab/${id}`, {
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
                throw new Error('Failed to load collaboration details');
            }

            const data = await response.json();
            if (data.success) {
                setCollab(data.collab);
                setApplicationStatus(data.applicationStatus || null);
                setIsEligible(typeof data.isEligible === 'boolean' ? data.isEligible : true);
                setUnmetRequirements(Array.isArray(data.unmetRequirements) ? data.unmetRequirements : []);
            } else {
                throw new Error(data.message || 'Failed to load collaboration details');
            }
        } catch (err) {
            console.error('Error fetching collaboration details:', err);
            setError(err.message || 'Failed to load collaboration details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchCollaborationDetails();
        }
    }, [id]);

    const handleSignOut = async (event) => {
        event?.preventDefault();
        try {
            await fetch(`${API_BASE_URL}/influencer/signout`, {
                method: 'GET',
                headers: { Accept: 'application/json' },
                credentials: 'include'
            });
        } catch (err) {
            console.error('Error during signout:', err);
        } finally {
            window.location.href = '/signin';
        }
    };

    const getStatusClass = (status) => {
        if (!status) return '';
        const normalized = status.toLowerCase();
        if (normalized.includes('request')) return styles.statusRequest;
        if (normalized.includes('active')) return styles.statusActive;
        if (normalized.includes('pending')) return styles.statusPending;
        if (normalized.includes('completed')) return styles.statusCompleted;
        return styles.statusDefault;
    };

    const getCurrencyValue = (value) => {
        if (typeof value !== 'number') return 'Not specified';
        return value.toLocaleString();
    };

    const getDurationLabel = () => {
        if (!collab) return 'Not specified';
        if (collab.duration) {
            return `${collab.duration} days`;
        }
        if (collab.start_date && collab.end_date) {
            const start = new Date(collab.start_date);
            const end = new Date(collab.end_date);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return `${diffDays} days`;
        }
        return 'Not specified';
    };

    const formatDate = (value) => {
        if (!value) return 'Not specified';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return 'Not specified';
        return date.toLocaleDateString();
    };

    const handleApply = async () => {
        if (!collab) return;

        try {
            setApplying(true);
            const response = await fetch(`${API_BASE_URL}/influencer/apply/${collab._id || collab.id}`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ message: specialMessage })
            });

            const data = await response.json();
            if (data.success) {
                alert('Application submitted successfully!');
                setApplicationStatus('request');
            } else if (data.expired && data.redirectUrl) {
                const goToManage = window.confirm(`${data.message}\n\nWould you like to renew your subscription now?`);
                if (goToManage) {
                    window.location.href = data.redirectUrl;
                }
            } else {
                alert(data.message || 'Failed to submit application');
            }
        } catch (err) {
            console.error('Error submitting application:', err);
            alert('An error occurred while submitting the application');
        } finally {
            setApplying(false);
        }
    };

    const shouldShowResults = !loading && !error && collab;

    if (loading) {
        return (
            <div className={styles.campaignDetailsPage}>
                <div className={styles.loadingState}>Loading campaign details...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.campaignDetailsPage}>
                <div className={styles.errorState}>{error}</div>
            </div>
        );
    }

    if (!collab) {
        return (
            <div className={styles.campaignDetailsPage}>
                <div className={styles.errorState}>Campaign not found.</div>
            </div>
        );
    }

    const statusClass = getStatusClass(collab.status);
    const requiredChannels = Array.isArray(collab.required_channels)
        ? collab.required_channels
        : collab.required_channels
            ? `${collab.required_channels}`.split(',')
            : [];

    return (
        <div className={styles.campaignDetailsPage}>
            <InfluencerNavigation onSignOut={handleSignOut} />

            <div className={styles.container}>
                {shouldShowResults && (
                    <div className={styles.campaignDetails}>
                        <CampaignHeader collab={collab} statusClass={statusClass} styles={styles} />

                        <div className={styles.campaignGrid}>
                            <CampaignOverviewSection collab={collab} styles={styles} />
                            <CampaignDetailsSection
                                styles={styles}
                                durationLabel={getDurationLabel()}
                                budget={getCurrencyValue(collab.budget)}
                                startDate={formatDate(collab.start_date)}
                                endDate={formatDate(collab.end_date)}
                            />
                            <CampaignRequirementsSection
                                styles={styles}
                                minFollowers={collab.min_followers}
                                requiredChannels={requiredChannels}
                                unmetRequirements={unmetRequirements}
                            />
                            <CampaignProductsSection products={collab.products} styles={styles} />
                        </div>

                        <CampaignActionBar
                            styles={styles}
                            applicationStatus={applicationStatus}
                            isEligible={isEligible}
                            applying={applying}
                            specialMessage={specialMessage}
                            setSpecialMessage={setSpecialMessage}
                            onApply={handleApply}
                        />
                    </div>
                )}
            </div>

            <footer className={styles.footer}>
                <div className={styles.footerContent}>
                    <div className={styles.footerSection}>
                        <h3>CollabSync</h3>
                        <p>Connecting brands with influencers for successful collaborations.</p>
                    </div>
                    <div className={styles.footerSection}>
                        <h3>Quick Links</h3>
                        <ul>
                            <li>
                                <Link to="/influencer/home">Home</Link>
                            </li>
                            <li>
                                <Link to="/influencer/explore">Explore Brands</Link>
                            </li>
                            <li>
                                <Link to="/influencer/profile">My Profile</Link>
                            </li>
                        </ul>
                    </div>
                    <div className={styles.footerSection}>
                        <h3>Support</h3>
                        <ul>
                            <li>
                                <a href="#">Help Center</a>
                            </li>
                            <li>
                                <a href="#">Contact Us</a>
                            </li>
                            <li>
                                <a href="#">Privacy Policy</a>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className={styles.footerBottom}>
                    <p>&copy; {new Date().getFullYear()} CollabSync. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default CampaignDetails;