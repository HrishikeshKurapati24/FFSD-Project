import React from 'react';
import styles from '../../../styles/brand/dashboard.module.css';

const InfluencersListModal = ({ isOpen, onClose, campaignName, influencers, loading, onSelectInfluencer, modalRef }) => {
    if (!isOpen) return null;

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
                        <h5 className="modal-title">Influencers: {campaignName}</h5>
                    </div>
                    <div className="modal-body">
                        {loading ? (
                            <div className="text-center py-4">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : influencers && influencers.length > 0 ? (
                            <div className={styles.influencersList}>
                                {influencers.map(influencer => (
                                    <div
                                        key={influencer.influencer_id}
                                        className={styles.influencerListItem}
                                        onClick={() => onSelectInfluencer(influencer.influencer_id)}
                                        role="button"
                                    >
                                        <img
                                            src={influencer.profilePicUrl}
                                            alt={influencer.name}
                                            className={styles.influencerListAvatar}
                                        />
                                        <div className={styles.influencerListInfo}>
                                            <div className={styles.influencerName}>{influencer.name}</div>
                                            <div className={styles.influencerUsername}>@{influencer.username}</div>
                                        </div>
                                        <div className={styles.influencerListStatus}>
                                            <span className={`badge ${influencer.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                                                {influencer.status}
                                            </span>
                                        </div>
                                        <div className={styles.influencerListProgress}>
                                            <small>Progress: {influencer.progress}%</small>
                                            <div className="progress" style={{ height: '6px', width: '100px' }}>
                                                <div
                                                    className="progress-bar bg-info"
                                                    role="progressbar"
                                                    style={{ width: `${influencer.progress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className={styles.influencerListAction}>
                                            <i className="fas fa-chevron-right text-muted"></i>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-4 text-muted">
                                No influencers found for this campaign.
                            </div>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InfluencersListModal;
