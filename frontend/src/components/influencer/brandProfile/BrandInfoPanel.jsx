import React from 'react';

const BrandInfoPanel = ({
  brand,
  audience,
  performanceMetrics,
  categories,
  languages,
  sanitizeWebsite,
  formatNumber,
  formatDecimal
}) => (
  <div className="detail-card">
    <h2 className="card-title">Brand Information</h2>
    <div className="brand-info-section">
      {brand.location && (
        <div className="info-item">
          <div className="info-icon">
            <i className="fas fa-map-marker-alt" aria-hidden="true"></i>
          </div>
          <div className="info-content">
            <div className="info-label">Location</div>
            <div className="info-value">{brand.location}</div>
          </div>
        </div>
      )}
      {brand.website && (
        <div className="info-item">
          <div className="info-icon">
            <i className="fas fa-globe" aria-hidden="true"></i>
          </div>
          <div className="info-content">
            <div className="info-label">Website</div>
            <div className="info-value">
              <a
                href={brand.website}
                target="_blank"
                rel="noopener noreferrer"
                className="website-link"
              >
                {sanitizeWebsite(brand.website)}
              </a>
            </div>
          </div>
        </div>
      )}
      {brand.mission && brand.mission !== brand.bio && (
        <div className="info-item">
          <div className="info-icon">
            <i className="fas fa-bullseye" aria-hidden="true"></i>
          </div>
          <div className="info-content">
            <div className="info-label">Mission</div>
            <div className="info-value">{brand.mission}</div>
          </div>
        </div>
      )}
    </div>

    <div className="audience-section">
      <h3>Target Audience</h3>
      <div className="audience-stats">
        <div className="audience-stat">
          <div className="audience-stat-value">{audience.gender || 'Mixed'}</div>
          <div className="audience-stat-label">Primary Gender</div>
        </div>
        <div className="audience-stat">
          <div className="audience-stat-value">{audience.ageRange || '18-45'}</div>
          <div className="audience-stat-label">Age Range</div>
        </div>
      </div>
    </div>

    <div className="performance-metrics">
      <h3>Performance Metrics</h3>
      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-value">{formatNumber(performanceMetrics.reach || 0)}</div>
          <div className="metric-label">Reach</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{formatNumber(performanceMetrics.impressions || 0)}</div>
          <div className="metric-label">Impressions</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{formatNumber(performanceMetrics.engagement || 0)}</div>
          <div className="metric-label">Engagement</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{formatDecimal(performanceMetrics.conversionRate, 1)}%</div>
          <div className="metric-label">Conversion Rate</div>
        </div>
      </div>
    </div>

    <div className="categories-section">
      <h3>Brand Categories</h3>
      {categories.length > 0 ? (
        <div className="category-tags">
          {categories.map((category) => (
            <span className="category-tag" key={category}>
              {category}
            </span>
          ))}
        </div>
      ) : (
        <p className="empty-state">No categories specified.</p>
      )}
    </div>

    <div className="languages-section">
      <h3>Languages</h3>
      {languages.length > 0 ? (
        <div className="language-tags">
          {languages.map((language) => (
            <span className="language-tag" key={language}>
              {language}
            </span>
          ))}
        </div>
      ) : (
        <p className="empty-state">No languages specified.</p>
      )}
    </div>
  </div>
);

export default BrandInfoPanel;

