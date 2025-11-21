import React from 'react';

const CampaignHistoryHeader = ({ styles, onRefresh }) => (
  <div className={styles['campaigns-header']}>
    <div>
      <h1>Campaign History</h1>
      <p>Review insights from your completed collaborations.</p>
    </div>
    <div className={styles['header-actions']}>
      <button type="button" className={styles['refresh-btn']} onClick={onRefresh}>
        <i className="fas fa-sync" aria-hidden="true"></i> Refresh
      </button>
    </div>
  </div>
);

export default CampaignHistoryHeader;


