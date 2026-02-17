import React from 'react';
import styles from '../../../styles/brand/dashboard.module.css';

const InfluencerContributionModal = ({ isOpen, onClose, data, loading, modalRef, onBack }) => {
    if (!isOpen) return null;

    const { influencer, campaign, contribution } = data || {};

    // Get deliverables from contribution data
    const deliverables = contribution?.deliverables || [];
    const totalDeliverables = deliverables.length;
    const completedDeliverables = deliverables.filter(d => d.status === 'approved').length;

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'pending': return 'bg-secondary';
            case 'submitted': return 'bg-info';
            case 'approved': return 'bg-success';
            case 'rejected': return 'bg-danger';
            default: return 'bg-secondary';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending': return 'fa-clock';
            case 'submitted': return 'fa-paper-plane';
            case 'approved': return 'fa-check-circle';
            case 'rejected': return 'fa-times-circle';
            default: return 'fa-clock';
        }
    };

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
                                        <div className="text-muted small mt-2">
                                            {completedDeliverables} of {totalDeliverables} deliverables completed
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
                                <h6 className="section-title mt-4 mb-3">
                                    <i className="fas fa-tasks me-2"></i>Deliverables
                                </h6>
                                <div className={styles.deliverablesList}>
                                    {deliverables && deliverables.length > 0 ? (
                                        deliverables.map((item, index) => (
                                            <div key={index} className={`${styles.deliverableItem} border rounded p-3 mb-3`}>
                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <div className="flex-grow-1">
                                                        <div className="d-flex align-items-center mb-2">
                                                            <h6 className="mb-0">{item.title || 'Untitled Deliverable'}</h6>
                                                            <span className={`badge ${getStatusBadgeClass(item.status)} ms-2`}>
                                                                <i className={`fas ${getStatusIcon(item.status)} me-1`}></i>
                                                                {item.status}
                                                            </span>
                                                        </div>

                                                        <div className="text-muted small mb-2 white-space-pre-line">
                                                            {item.description || 'No description provided'}
                                                        </div>

                                                        <div className="d-flex gap-3 text-muted small mb-2 flex-wrap">
                                                            {item.due_date && (
                                                                <span>
                                                                    <i className="fas fa-calendar-alt me-1"></i>
                                                                    Due: {new Date(item.due_date).toLocaleDateString()}
                                                                </span>
                                                            )}
                                                            {item.deliverable_type && (
                                                                <span>
                                                                    <i className="fas fa-tag me-1"></i>
                                                                    {item.deliverable_type}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {item.submitted_at && (
                                                            <div className="text-muted small">
                                                                <i className="fas fa-calendar me-1"></i>
                                                                Submitted: {new Date(item.submitted_at).toLocaleDateString()}
                                                            </div>
                                                        )}

                                                        {item.reviewed_at && (
                                                            <div className="text-muted small">
                                                                <i className="fas fa-check me-1"></i>
                                                                Reviewed: {new Date(item.reviewed_at).toLocaleDateString()}
                                                            </div>
                                                        )}

                                                        {item.content_url && item.status === 'approved' && (
                                                            <div className="mt-2">
                                                                <a
                                                                    href={item.content_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="btn btn-sm btn-outline-primary"
                                                                >
                                                                    <i className="fas fa-external-link-alt me-1"></i>
                                                                    View Published Content
                                                                </a>
                                                            </div>
                                                        )}

                                                        {item.review_feedback && (
                                                            <div className="alert alert-warning py-2 px-3 mt-2 mb-0">
                                                                <strong><i className="fas fa-comment me-1"></i>Feedback:</strong>
                                                                <div className="small mt-1">{item.review_feedback}</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="alert alert-info">
                                            <i className="fas fa-info-circle me-2"></i>
                                            No deliverables assigned for this collaboration.
                                        </div>
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
