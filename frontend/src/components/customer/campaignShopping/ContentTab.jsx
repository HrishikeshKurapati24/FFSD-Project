import React from 'react';

const DEFAULT_PRODUCT_IMAGE = '/images/default-product.png';
const DEFAULT_AVATAR = '/images/default-avatar.jpg';

const ContentTab = ({
  filteredContent,
  styles,
  handleShopFromContent
}) => {
  return (
    <div className="row">
      {filteredContent.length ? (
        filteredContent.map((item) => {
          const influencer = item?.influencer_id || {};
          const influencerName =
            influencer.fullName || influencer.displayName || influencer.username || 'Influencer';
          const cover = Array.isArray(item?.media_urls) ? item.media_urls[0] : null;
          const coverUrl = cover?.url || null;
          return (
            <div className="col-md-6 col-lg-4 mb-4" key={item?._id}>
              <div className={`h-100 d-flex flex-column ${styles['content-card']}`}>
                <div className={styles['content-image-container']}>
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt={item?.caption ? `${item.caption.substring(0, 50)}...` : 'Content image'}
                      className={styles['content-image']}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                      }}
                    />
                  ) : (
                    <div className={styles['content-placeholder']}>
                      <i className="fas fa-image" aria-hidden="true" />
                    </div>
                  )}
                </div>
                <div className={`${styles['content-info']} d-flex flex-column flex-grow-1`}>
                  <div className="d-flex align-items-center mb-2">
                    <img
                      src={influencer?.profilePicUrl || DEFAULT_AVATAR}
                      alt={influencerName}
                      className={`${styles['influencer-avatar']} me-2`}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = DEFAULT_AVATAR;
                      }}
                    />
                    <span className={styles['influencer-name']}>{influencerName}</span>
                  </div>
                  <h6 className={styles['content-title']}>
                    {item?.caption
                      ? item.caption.length > 60
                        ? `${item.caption.substring(0, 60)}...`
                        : item.caption
                      : 'Influencer Post'}
                  </h6>
                  <p className={styles['content-caption']}>
                    {item?.caption
                      ? item.caption.length > 140
                        ? `${item.caption.substring(0, 140)}...`
                        : item.caption
                      : ''}
                  </p>
                  {item?.hashtags?.length ? (
                    <div className={`${styles['content-hashtags']} mb-2`}>
                      {item.hashtags.slice(0, 3).map((hashtag) => (
                        <span className="badge bg-light text-dark me-1" key={hashtag}>
                          #{hashtag}
                        </span>
                      ))}
                      {item.hashtags.length > 3 && (
                        <span className="text-muted small">
                          +{item.hashtags.length - 3} more
                        </span>
                      )}
                    </div>
                  ) : null}
                  <div className={`${styles['content-stats']} mt-auto mb-2`}>
                    <small className="text-muted">
                      {item?.published_at && (
                        <>
                          <i className="fas fa-calendar me-1" aria-hidden="true" />
                          {new Date(item.published_at).toLocaleDateString()}
                        </>
                      )}
                      {item?.media_urls?.length > 1 && (
                        <>
                          <i className="fas fa-images ms-2 me-1" aria-hidden="true" />
                          {item.media_urls.length} media
                        </>
                      )}
                    </small>
                  </div>
                  <div className={styles['content-actions']}>
                    {item?.attached_products?.length ? (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={handleShopFromContent}
                      >
                        <i className="fas fa-shopping-bag me-1" aria-hidden="true" />
                        Shop Products
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="col-12">
          <div className="alert alert-info text-center">
            <i className="fas fa-info-circle me-2" aria-hidden="true" />
            No content available for this campaign.
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentTab;
