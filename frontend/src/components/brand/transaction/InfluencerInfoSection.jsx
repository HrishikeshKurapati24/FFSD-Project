import React from 'react';
import { API_BASE_URL } from '../../../services/api';

const InfluencerInfoSection = ({ transactionData, styles }) => {
  const influencerImage = transactionData.influencerImage || '/images/default-avatar.jpg';
  const fullImageUrl = influencerImage.startsWith('http')
    ? influencerImage
    : `${API_BASE_URL}${influencerImage}`;

  return (
    <div className={styles.influencerSection}>
      <img
        src={fullImageUrl}
        alt="Influencer Profile"
        className={styles.influencerPic}
        style={{ width: '160px', height: '160px', borderRadius: '50%' }}
        onError={(e) => {
          e.target.src = '/images/default-avatar.jpg';
        }}
      />
      <div className={styles.influencerDetails}>
        <h2>{transactionData.influencerName}</h2>
        <p>
          Username: <span className={styles.username}>@{transactionData.influencerUsername}</span>
        </p>
        <p>
          {transactionData.socialPlatform}:{' '}
          <span className={styles.socialHandle}>@{transactionData.socialHandle}</span>
        </p>
        <p>
          Status:{' '}
          <span
            className={`${styles.status} ${transactionData.isVerified ? styles.verified : styles.unverified}`}
          >
            {transactionData.isVerified ? 'Verified' : 'Unverified'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default InfluencerInfoSection;
