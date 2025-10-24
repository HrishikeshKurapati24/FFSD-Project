import React, { useState, useEffect } from 'react';
import { useBrands } from '../hooks/useBrands';
import '../styles/modal.css';

const BrandsModal = ({ isOpen, onClose }) => {
    const { brands, loading, error, fetchBrands } = useBrands();
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        console.log('BrandsModal useEffect - isOpen:', isOpen);
        if (isOpen) {
            console.log('Fetching brands...');
            fetchBrands();
        }
    }, [isOpen]);

    console.log('BrandsModal render - isOpen:', isOpen, 'brands:', brands, 'loading:', loading, 'error:', error);

    const filteredBrands = brands.filter(brand =>
        brand.brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        brand.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
        brand.categories.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (!isOpen) {
        console.log('Modal not open, returning null');
        return null;
    }

    console.log('Rendering modal with filteredBrands:', filteredBrands.length);

    return (
        <div className="modal" onClick={onClose} style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                maxWidth: '800px',
                width: '90%',
                maxHeight: '80vh',
                overflow: 'auto'
            }}>
                <div className="modal-header">
                    <h2>All Registered Brands</h2>
                    <span className="close" onClick={onClose}>&times;</span>
                </div>
                <div className="modal-body">
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="Search brands..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    <div className="grid-container">
                        {loading && (
                            <div className="loading">
                                <span>Loading brands...</span>
                            </div>
                        )}
                        {error && (
                            <div className="text-center py-4">
                                <p>Error loading brands. Please try again.</p>
                            </div>
                        )}
                        {!loading && !error && filteredBrands.length === 0 && (
                            <div className="text-center py-4">
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
        <div className="brand-card">
            <div className="brand-header">
                <img
                    src={brand.logoUrl || '/images/default-brand-logo.jpg'}
                    alt={brand.brandName}
                    className="brand-logo"
                    onError={(e) => {
                        e.currentTarget.src = '/images/default-brand-logo.jpg';
                    }}
                />
                <div className="brand-info">
                    <h3 className="brand-name">{brand.brandName}</h3>
                    <p className="brand-industry">{brand.industry || 'General'}</p>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-item">
                    <span className="stat-number">{brand.completedCampaigns}</span>
                    <div className="stat-label">Campaigns</div>
                </div>
                <div className="stat-item">
                    <span className="stat-number">{brand.influencerPartnerships}</span>
                    <div className="stat-label">Completed Partnerships</div>
                </div>
                <div className="stat-item">
                    <span className="stat-number">{brand.avgCampaignRating.toFixed(1)}</span>
                    <div className="stat-label">Rating</div>
                </div>
            </div>

            <div className="categories">
                <strong>Categories:</strong>
                <div style={{ marginTop: '0.5rem' }}>
                    {brand.categories.map(cat => (
                        <span key={cat} className="category-tag">{cat}</span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BrandsModal;
