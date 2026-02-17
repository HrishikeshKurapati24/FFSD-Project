import React from 'react';

const DEFAULT_PRODUCT_IMAGE = '/images/default-product.png';
const DEFAULT_AVATAR = '/images/default-avatar.jpg';

const ContentTab = ({
  filteredContent,
  styles,
  handleShopFromContent
}) => {
  const getPlatformIcon = (platform) => {
    switch (platform?.toLowerCase()) {
      case 'instagram': return 'fab fa-instagram';
      case 'youtube': return 'fab fa-youtube';
      case 'tiktok': return 'fab fa-tiktok';
      case 'facebook': return 'fab fa-facebook';
      case 'twitter': return 'fab fa-twitter';
      case 'linkedin': return 'fab fa-linkedin';
      default: return 'fas fa-external-link-alt';
    }
  };

  const getPlatformColor = (platform) => {
    switch (platform?.toLowerCase()) {
      case 'instagram': return '#E1306C';
      case 'youtube': return '#FF0000';
      case 'tiktok': return '#000000';
      case 'facebook': return '#1877F2';
      case 'twitter': return '#1DA1F2';
      case 'linkedin': return '#0A66C2';
      default: return '#4285f4';
    }
  };

  return (
    <div className="row">
      {filteredContent.length ? (
        filteredContent.map((item) => {
          const influencer = item?.influencer_id || {};
          const influencerName =
            influencer.displayName || influencer.fullName || 'Influencer';

          return (
            <div className="col-md-6 col-lg-4 mb-4" key={item?._id}>
              <div className={`h-100 d-flex flex-column ${styles['content-card']}`}>
                <div
                  className={styles['content-image-container']}
                  style={{
                    backgroundColor: `${getPlatformColor(item.platform)}10`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '200px',
                    borderBottom: `2px solid ${getPlatformColor(item.platform)}20`
                  }}
                >
                  <i
                    className={getPlatformIcon(item.platform)}
                    style={{
                      fontSize: '4rem',
                      color: getPlatformColor(item.platform),
                      marginBottom: '1rem'
                    }}
                    aria-hidden="true"
                  />
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    color: getPlatformColor(item.platform),
                    letterSpacing: '1px'
                  }}>
                    {item.platform || 'Social Post'}
                  </span>
                </div>
                <div className={`${styles['content-info']} d-flex flex-column flex-grow-1`}>
                  <div className="d-flex align-items-center mb-3">
                    <img
                      src={influencer?.profilePicUrl || DEFAULT_AVATAR}
                      alt={influencerName}
                      className={`${styles['influencer-avatar']} me-2`}
                      style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = DEFAULT_AVATAR;
                      }}
                    />
                    <span className={styles['influencer-name']} style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                      {influencerName}
                    </span>
                  </div>
                  <h6 className={styles['content-title']} style={{ fontWeight: '700', marginBottom: '0.5rem' }}>
                    {item?.title || 'Influencer Post'}
                  </h6>
                  <p className={styles['content-caption']} style={{ fontSize: '0.85rem', color: '#666' }}>
                    {item?.description
                      ? item.description.length > 140
                        ? `${item.description.substring(0, 140)}...`
                        : item.description
                      : 'No description available.'}
                  </p>

                  <div className={`${styles['content-stats']} mt-auto mb-3`}>
                    <span className="badge bg-light text-dark border me-2">
                      {item.deliverable_type || 'Content'}
                    </span>
                    {item?.submitted_at && (
                      <small className="text-muted">
                        <i className="fas fa-calendar-alt me-1" aria-hidden="true" />
                        {new Date(item.submitted_at).toLocaleDateString()}
                      </small>
                    )}
                  </div>

                  <div className={styles['content-actions']} style={{ display: 'flex', gap: '10px' }}>
                    {item?.content_url && (
                      <a
                        href={item.content_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline-secondary btn-sm flex-grow-1"
                        style={{ fontWeight: '600' }}
                      >
                        <i className="fas fa-external-link-alt me-1" aria-hidden="true" />
                        View Live Post
                      </a>
                    )}
                    <button
                      type="button"
                      className="btn btn-primary btn-sm flex-grow-1"
                      style={{ fontWeight: '600' }}
                      onClick={handleShopFromContent}
                    >
                      <i className="fas fa-shopping-bag me-1" aria-hidden="true" />
                      Shop Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="col-12">
          <div className="alert alert-info text-center py-4">
            <i className="fas fa-info-circle me-2" aria-hidden="true" />
            No content available for this campaign yet.
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentTab;
