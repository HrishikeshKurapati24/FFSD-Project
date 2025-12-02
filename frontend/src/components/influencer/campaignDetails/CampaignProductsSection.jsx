import React from 'react';

const getProductImage = (product) => {
  if (!product) return null;
  if (Array.isArray(product.images) && product.images.length > 0) {
    const primary = product.images.find((img) => img.is_primary);
    return (primary || product.images[0]).url;
  }
  return product.imageUrl || null;
};

const CampaignProductsSection = ({ products = [], styles }) => {
  if (products.length === 0) {
    return null;
  }

  return (
    <div className={`${styles.detailSection} ${styles.productsSection}`}>
      <h3>Campaign Products</h3>
      <div className={styles.productsIntro}>
        <p>
          <i className="fas fa-info-circle" />{' '}
          <strong>These are the products you will be promoting in this campaign.</strong> A sample will be sent after
          approval.
        </p>
      </div>
      <div className={styles.productsGrid}>
        {products.map((product) => {
          const imageUrl = getProductImage(product);
          return (
            <div className={styles.productCard} key={product._id || product.id}>
              <div className={styles.productImage}>
                {imageUrl ? (
                  <img src={imageUrl} alt={product.name} className={styles.productImg} loading="lazy" />
                ) : (
                  <div className={styles.productPlaceholder}>
                    <i className="fas fa-box" />
                    <span>No Image</span>
                  </div>
                )}
              </div>
              <div className={styles.productDetails}>
                <h4 className={styles.productName}>{product.name}</h4>
                {product.category && (
                  <div className={styles.productCategory}>
                    <span className={styles.categoryBadge}>{product.category}</span>
                  </div>
                )}
                <div className={styles.productPricing}>
                  <div className={styles.priceRow}>
                    <span className={styles.priceLabel}>Original Price:</span>
                    <span className={styles.originalPrice}>
                      {product.original_price ? `$${product.original_price}` : 'N/A'}
                    </span>
                  </div>
                  <div className={styles.priceRow}>
                    <span className={styles.priceLabel}>Campaign Price:</span>
                    <span className={styles.campaignPrice}>
                      {product.campaign_price ? `$${product.campaign_price}` : 'N/A'}
                    </span>
                  </div>
                  {product.discount_percentage ? (
                    <div className={styles.discountBadge}>{product.discount_percentage}% OFF</div>
                  ) : null}
                </div>
                {product.description && (
                  <div className={styles.productDescription}>
                    <p>{product.description}</p>
                  </div>
                )}
                {product.special_instructions && (
                  <div className={styles.specialInstructions}>
                    <h5>Special Instructions:</h5>
                    <p>{product.special_instructions}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CampaignProductsSection;


