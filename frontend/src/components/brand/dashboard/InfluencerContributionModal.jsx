import React from 'react';
import styles from '../../../styles/brand/dashboard.module.css';

const InfluencerContributionModal = ({ isOpen, onClose, data, loading, modalRef, onBack }) => {
    if (!isOpen) return null;

    const { influencer, campaign, contribution } = data || {};

    return (
        <div
            className="modal fade show"
            style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
            tabIndex="-1"
            ref={modalRef}
        >
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <div className="d-flex align-items-center">
                            <button className="btn btn-link p-0 me-2 text-decoration-none" onClick={onBack}>
                                <i className="fas fa-arrow-left"></i>
                            </button>
                            <h5 className="modal-title">Contribution Details</h5>
                        </div>
                    </div>
                    <div className="modal-body">
                        {loading ? (
                            <div className="text-center py-4">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : data ? (
                            <div className={styles.contributionDetails}>
                                {/* Header Info */}
                                <div className={styles.contributionHeader}>
                                    <div className="d-flex align-items-center mb-3">
                                        <img
                                            src={influencer?.profilePicUrl}
                                            alt={influencer?.name}
                                            className={styles.contributionAvatar}
                                        />
                                        <div className="ms-3">
                                            <h4 className="mb-0">{influencer?.name}</h4>
                                            <div className="text-muted small">Campaign: {campaign?.title}</div>
                                        </div>
                                        <div className="ms-auto text-end">
                                            <div className={styles.totalPaid}>
                                                <div className="text-muted small">Total Paid</div>
                                                <div className="h4 text-success mb-0">${(contribution?.earnings || 0).toLocaleString()}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Overall Progress */}
                                    <div className="mb-4 p-3 bg-light rounded">
                                        <div className="d-flex justify-content-between mb-1">
                                            <strong>Contribution Progress</strong>
                                            <span>{contribution?.progress}%</span>
                                        </div>
                                        <div className="progress" style={{ height: '10px' }}>
                                            <div
                                                className="progress-bar bg-success"
                                                role="progressbar"
                                                style={{ width: `${contribution?.progress || 0}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Key Metrics Grid */}
                                <h6 className="section-title mb-3">Performance Metrics</h6>
                                <div className={styles.metricsGrid}>
                                    <div className={styles.metricCard}>
                                        <div className={styles.metricLabel}>Engagement Rate</div>
                                        <div className={styles.metricValue}>{contribution?.metrics?.engagement_rate}%</div>
                                    </div>
                                    <div className={styles.metricCard}>
                                        <div className={styles.metricLabel}>Reach</div>
                                        <div className={styles.metricValue}>{(contribution?.metrics?.reach || 0).toLocaleString()}</div>
                                    </div>
                                    <div className={styles.metricCard}>
                                        <div className={styles.metricLabel}>Clicks</div>
                                        <div className={styles.metricValue}>{(contribution?.metrics?.clicks || 0).toLocaleString()}</div>
                                    </div>
                                    <div className={styles.metricCard}>
                                        <div className={styles.metricLabel}>Conversions</div>
                                        <div className={styles.metricValue}>{(contribution?.metrics?.conversions || 0).toLocaleString()}</div>
                                    </div>
                                </div>

                                {/* Deliverables List */}
                                <h6 className="section-title mt-4 mb-3">Deliverables</h6>
                                <div className={styles.deliverablesList}>
                                    {contribution?.deliverables && contribution.deliverables.length > 0 ? (
                                        contribution.deliverables.map((item, index) => (
                                            <div key={index} className={styles.deliverableItem}>
                                                <div className="d-flex justify-content-between align-items-start">
                                                    <div>
                                                        <div className={styles.deliverableTitle}>{item.title}</div>
                                                        <div className={styles.deliverableDesc}>{item.description}</div>
                                                        <div className="text-muted x-small mt-1">Due: {new Date(item.due_date).toLocaleDateString()}</div>
                                                    </div>
                                                    <span className={`badge ${item.status === 'completed' ? 'bg-success' :
                                                        item.status === 'active' ? 'bg-primary' : 'bg-secondary'
                                                        }`}>
                                                        {item.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-muted">No deliverables assigned.</div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-4 text-danger">Failed to load data.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InfluencerContributionModal;
