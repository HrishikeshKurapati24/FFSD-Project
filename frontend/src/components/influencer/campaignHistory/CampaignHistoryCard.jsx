import React from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../../../services/api';

const CampaignHistoryCard = ({
  campaign,
  styles,
  formatNumber,
  formatPercent,
  formatCurrency,
  formatDate,
  getBrandLogo
}) => {
  const statusClass =
    campaign.status && campaign.status.toLowerCase() === 'cancelled'
      ? styles['status-cancelled']
      : styles['status-completed'];

  return (
    <div
      className={styles['campaign-card']}
      key={campaign._id || campaign.id || campaign.campaign_id}
    >
      <span className={`${styles['campaign-status']} ${statusClass}`}>
        {campaign.status || 'completed'}
      </span>

      <div className={styles['brand-info']}>
        {campaign.brand_id ? (
          <Link
            to={`/influencer/brand_profile/${campaign.brand_id}`}
            className={styles['brand-link']}
          >
            <img
              src={getBrandLogo(campaign.brand_logo)}
              alt={campaign.brand_name || 'Brand'}
              className={styles['brand-logo']}
            />
            <span className={styles['brand-name']}>{campaign.brand_name || 'Brand'}</span>
          </Link>
        ) : (
          <div className={styles['brand-link']}>
            <img
              src={getBrandLogo(campaign.brand_logo)}
              alt="Brand"
              className={styles['brand-logo']}
            />
            <span className={styles['brand-name']}>{campaign.brand_name || 'Brand'}</span>
          </div>
        )}
      </div>

      <h3>{campaign.title || 'Untitled Campaign'}</h3>
      {campaign.description && <p>{campaign.description}</p>}

      <div className={styles['campaign-metrics']}>
        <div className={styles.metric}>
          <span className={styles['metric-value']}>
            {Number(campaign.performance_score || 0).toFixed(1)}
          </span>
          <span className={styles['metric-label']}>Performance</span>
        </div>
        <div className={styles.metric}>
          <span className={styles['metric-value']}>{formatPercent(campaign.engagement_rate)}</span>
          <span className={styles['metric-label']}>Engagement</span>
        </div>
        <div className={styles.metric}>
          <span className={styles['metric-value']}>{formatNumber(campaign.reach)}</span>
          <span className={styles['metric-label']}>Reach</span>
        </div>
      </div>

      <div className={styles['campaign-details']}>
        <div className={styles['detail-item']}>
          <i className="far fa-calendar" aria-hidden="true"></i>
          <span>Ended {formatDate(campaign.end_date)}</span>
        </div>
        <div className={styles['detail-item']}>
          <i className="fas fa-users" aria-hidden="true"></i>
          <span>{campaign.influencers_count || 0} other influencers</span>
        </div>
        <div className={styles['detail-item']}>
          <i className="fas fa-tag" aria-hidden="true"></i>
          <span>{formatCurrency(campaign.budget)} budget</span>
        </div>
        <div className={styles['detail-item']}>
          <i className="fas fa-chart-line" aria-hidden="true"></i>
          <span>{formatPercent(campaign.conversion_rate)} conversion</span>
        </div>
      </div>

      {campaign.influencers && campaign.influencers.length > 0 && (
        <div className={styles['campaign-influencers']}>
          <h4>Other Influencers</h4>
          <div className={styles['influencer-list']}>
            {campaign.influencers.map((influencer) => {
              const avatar = influencer.profilePicUrl
                ? influencer.profilePicUrl.startsWith('http')
                  ? influencer.profilePicUrl
                  : `${API_BASE_URL}${influencer.profilePicUrl}`
                : '/images/default-avatar.jpg';
              return (
                <div className={styles['influencer-tag']} key={influencer.id || influencer._id}>
                  <img
                    src={avatar}
                    alt={influencer.name || influencer.displayName || 'Influencer'}
                    onError={(event) => {
                      event.currentTarget.src = '/images/default-avatar.jpg';
                    }}
                  />
                  <span>{influencer.name || influencer.displayName || 'Influencer'}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignHistoryCard;


