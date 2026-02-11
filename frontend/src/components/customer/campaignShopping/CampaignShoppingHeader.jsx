import React from 'react';
import CustomerNavbar from '../CustomerNavbar';

const DEFAULT_BRAND_LOGO = '/images/default-brand-logo.jpg';

const CampaignShoppingHeader = ({
  campaign,
  products,
  contentItems,
  activeTab,
  searchValue,
  alert,
  errorMessage,
  loading,
  onSearchChange,
  onTabChange,
  formatDateRange,
  styles,
  customerName = ''
}) => {
  const brandLogo = campaign?.brand?.logoUrl || DEFAULT_BRAND_LOGO;
  const brandName = campaign?.brand?.brandName || 'Brand';

  return (
    <>
      <CustomerNavbar
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        customerName={customerName}
      />

      <header className={styles['campaign-header']}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-8">
              <div className="d-flex align-items-center mb-3">
                <img
                  src={brandLogo}
                  alt={brandName}
                  className={`${styles['brand-logo']} me-3 ${styles['campaign-brand-image']}`}
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = DEFAULT_BRAND_LOGO;
                  }}
                />
                <div>
                  <h1 className={`${styles['campaign-title']} mb-1`}>{campaign?.title || 'Campaign'}</h1>
                  <p className={`${styles['brand-name']} mb-0`}>by {brandName}</p>
                </div>
              </div>
              <p className={styles['campaign-description']}>{campaign?.description || ''}</p>
              <div className={styles['campaign-dates']}>
                <small>
                  <i className="fas fa-calendar-alt me-1" aria-hidden="true" />
                  {formatDateRange()}
                </small>
              </div>
            </div>
            <div className="col-md-4 text-end">
              <div className={styles['campaign-stats']}>
                <div className={styles['stat-item']}>
                  <span className={styles['stat-number']}>{products.length}</span>
                  <span className={styles['stat-label']}>Products</span>
                </div>
                <div className={styles['stat-item']}>
                  <span className={styles['stat-number']}>{contentItems.length}</span>
                  <span className={styles['stat-label']}>Posts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container">
        {alert.message && (
          <div className={`alert alert-${alert.type === 'success' ? 'success' : 'danger'} mt-3 mb-3`} role="alert">
            {alert.message}
          </div>
        )}

        {errorMessage && (
          <div className="alert alert-danger mt-3 mb-3" role="alert">
            {errorMessage}
          </div>
        )}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" aria-label="Loading" />
          </div>
        ) : (
          <ul className="nav nav-tabs mt-3 mb-0" role="tablist">
            <li className="nav-item" role="presentation">
              <button
                type="button"
                className={`nav-link ${activeTab === 'products' ? 'active' : ''}`}
                role="tab"
                aria-selected={activeTab === 'products'}
                onClick={() => onTabChange('products')}
              >
                <i className="fas fa-box me-2" aria-hidden="true" />
                Products
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                type="button"
                className={`nav-link ${activeTab === 'content' ? 'active' : ''}`}
                role="tab"
                aria-selected={activeTab === 'content'}
                onClick={() => onTabChange('content')}
              >
                <i className="fas fa-images me-2" aria-hidden="true" />
                Influencer Content
              </button>
            </li>
          </ul>
        )}
      </div>
    </>
  );
};

export default CampaignShoppingHeader;
