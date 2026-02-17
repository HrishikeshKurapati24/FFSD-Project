import React from 'react';
import styles from '../../styles/admin/influencer_deliverables_modal.module.css';

const InfluencerDeliverablesModal = ({ isOpen, onClose, data }) => {
    if (!isOpen || !data) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContainer} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>Campaign Details</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className={styles.modalContent}>
                    <div className={styles.campaignInfo}>
                        <h3>{data.title || 'Untitled Campaign'}</h3>
                        <p><strong>Brand:</strong> {data.brand}</p>
                        <p><strong>Status:</strong> <span className={`${styles.statusBadge} ${styles[data.status]}`}>{data.status}</span></p>
                    </div>

                    {data.influencers && data.influencers.length > 0 ? (
                        data.influencers.map((influencer, index) => (
                            <div key={index} className={styles.influencerSection}>
                                <div className={styles.influencerHeader}>
                                    <div className={styles.influencerName}>
                                        <i className="fas fa-user-circle"></i>
                                        {influencer.influencer || 'Unknown Influencer'}
                                    </div>
                                    <div className={styles.metrics}>
                                        <span>Engagement: {influencer.engagementRate}%</span>
                                        <span>Reach: {influencer.reach}%</span>
                                    </div>
                                </div>

                                <table className={styles.deliverablesTable}>
                                    <thead>
                                        <tr>
                                            <th>Deliverable</th>
                                            <th>Platform</th>
                                            <th>Type</th>
                                            <th>Due Date</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {influencer.deliverables && influencer.deliverables.length > 0 ? (
                                            influencer.deliverables.map((item, i) => (
                                                <tr key={i}>
                                                    <td>{item.title}</td>
                                                    <td>{item.platform}</td>
                                                    <td>{item.deliverable_type}</td>
                                                    <td>{new Date(item.due_date).toLocaleDateString()}</td>
                                                    <td>
                                                        <span className={`${styles.statusBadge} ${styles[item.status]}`}>
                                                            {item.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className={styles.emptyState}>No deliverables found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ))
                    ) : (
                        <div className={styles.emptyState}>No influencers assigned to this campaign.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InfluencerDeliverablesModal;
