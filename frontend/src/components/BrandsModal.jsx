import React, { useState, useEffect } from 'react';
import { useBrands } from '../hooks/useBrands';
import styles from '../styles/modal.module.css';

const BrandsModal = ({ isOpen, onClose }) => {
    const { brands, loading, error, fetchBrands } = useBrands();
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchBrands();
        }
    }, [isOpen]);

    const filteredBrands = brands.filter(brand =>
        brand.brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        brand.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
        brand.categories.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (!isOpen) {
        return null;
    }

    return (
        <div className={styles.modal} onClick={onClose}>
            <div className={styles['modal-content']} onClick={(e) => e.stopPropagation()}>
                <div className={styles['modal-header']}>
                    <h2>All Registered Brands</h2>
                    <span className={styles.close} onClick={onClose}>&times;</span>
                </div>
                <div className={styles['modal-body']}>
                    <div className={styles['search-container']}>
                        <input
                            type="text"
                            placeholder="Search brands..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={styles['search-input']}
                        />
                    </div>
                    <div className={styles['grid-container']}>
                        {loading && (
                            <div className={styles.loading}>
                                <span>Loading brands...</span>
                            </div>
                        )}
                        {error && (
                            <div className={`${styles['text-center']} ${styles['py-4']}`}>
                                <p>Error loading brands. Please try again.</p>
                            </div>
                        )}
                        {!loading && !error && filteredBrands.length === 0 && (
                            <div className={`${styles['text-center']} ${styles['py-4']}`}>
                                <p>No brands found.</p>
                            </div>
                        )}
                        {filteredBrands.map(brand => (
                            <BrandCard key={brand._id} brand={brand} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const BrandCard = ({ brand }) => {
    return (
        <div className={styles['brand-card']}>
            <div className={styles['brand-header']}>
                <img
                    src={brand.logoUrl || '/images/default-brand-logo.jpg'}
                    alt={brand.brandName}
                    className={styles['brand-logo']}
                    onError={(e) => {
                        e.currentTarget.src = '/images/default-brand-logo.jpg';
                    }}
                />
                <div className={styles['brand-info']}>
                    <h3 className={styles['brand-name']}>{brand.brandName}</h3>
                    <p className={styles['brand-industry']}>{brand.industry || 'General'}</p>
                </div>
            </div>

            <div className={styles['stats-grid']}>
                <div className={styles['stat-item']}>
                    <span className={styles['stat-number']}>{brand.completedCampaigns}</span>
                    <div className={styles['stat-label']}>Campaigns</div>
                </div>
                <div className={styles['stat-item']}>
                    <span className={styles['stat-number']}>{brand.influencerPartnerships}</span>
                    <div className={styles['stat-label']}>Completed Partnerships</div>
                </div>
                <div className={styles['stat-item']}>
                    <span className={styles['stat-number']}>{brand.avgCampaignRating.toFixed(1)}</span>
                    <div className={styles['stat-label']}>Rating</div>
                </div>
            </div>

            <div className={styles.categories}>
                <strong>Categories:</strong>
                <div style={{ marginTop: '0.5rem' }}>
                    {brand.categories.map(cat => (
                        <span key={cat} className={styles['category-tag']}>{cat}</span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BrandsModal;
