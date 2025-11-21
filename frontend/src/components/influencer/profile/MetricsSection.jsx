import React from 'react';

const metricsConfig = [
  {
    icon: 'fas fa-users',
    label: 'Total Followers',
    accessor: (influencer) => influencer.totalFollowers?.toLocaleString() || 0
  },
  {
    icon: 'fas fa-heart',
    label: 'Avg. Engagement',
    accessor: (influencer) => `${influencer.avgEngagementRate || 0}%`
  },
  {
    icon: 'fas fa-star',
    label: 'Avg. Rating',
    accessor: (influencer) => influencer.avgRating || 0
  },
  {
    icon: 'fas fa-handshake',
    label: 'Completed Campaigns',
    accessor: (influencer) => influencer.completedCollabs || 0
  }
];

const MetricsSection = ({ influencer }) => (
  <div className="metrics-section">
    <h2>Performance Metrics</h2>
    <div className="metrics-grid">
      {metricsConfig.map((metric) => (
        <div key={metric.label} className="metric-card">
          <div className="metric-icon"><i className={metric.icon}></i></div>
          <div className="metric-value">{metric.accessor(influencer)}</div>
          <div className="metric-label">{metric.label}</div>
        </div>
      ))}
    </div>
  </div>
);

export default MetricsSection;


