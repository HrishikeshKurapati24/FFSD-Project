import React from 'react';
import styles from '../../../styles/influencer/dashboard.module.css';

const BrandRankingsSection = ({ brandRankings = [] }) => {
  if (!brandRankings || brandRankings.length === 0) {
    return (
      <div className={styles['brand-rankings-section']}>
        <div className={styles['section-header']}>
          <h5 className={styles['section-title']}>
            <i className="fas fa-building me-2"></i>
            Previous Brand Collaborations
          </h5>
        </div>
        <div className={styles['section-content']}>
          <p className={styles['no-data-message']}>No previous brand collaborations found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles['brand-rankings-section']}>
      <div className={styles['section-header']}>
        <h5 className={styles['section-title']}>
          <i className="fas fa-building me-2"></i>
          Previous Brand Collaborations (Ranked by Payment)
        </h5>
      </div>
      <div className={styles['section-content']}>
        <p className={styles['section-description']}>Brands you've worked with, ranked by payment received (FFSD).</p>
        <div className={styles['table-container']}>
          <table className={styles['rankings-table']}>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Brand</th>
                <th>Total Payment (FFSD)</th>
                <th>Campaigns</th>
              </tr>
            </thead>
            <tbody>
              {brandRankings.map((brand, index) => (
                <tr key={brand._id}>
                  <td>
                    {index === 0 && <i className="fas fa-medal text-warning me-1"></i>}
                    {index + 1}
                  </td>
                  <td>
                    <div className={styles['brand-cell']}>
                      {brand.logoUrl && (
                        <img
                          src={brand.logoUrl}
                          alt={brand.brandName}
                          className={styles['brand-logo']}
                          onError={(e) => {
                            e.target.src = '/images/default-brand.png';
                          }}
                        />
                      )}
                      <span className={styles['brand-name']}>{brand.brandName}</span>
                    </div>
                  </td>
                  <td className={styles['payment-cell']}>
                    ${brand.totalPayment?.toFixed(2) || '0.00'}
                  </td>
                  <td className={styles['campaigns-cell']}>{brand.campaignCount || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BrandRankingsSection;
