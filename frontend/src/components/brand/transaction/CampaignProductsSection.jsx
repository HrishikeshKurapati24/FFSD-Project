import React from 'react';
import { API_BASE_URL } from '../../../services/api';

const CampaignProductsSection = ({ transactionData, styles }) => {
  if (!transactionData.campaignProducts || transactionData.campaignProducts.length === 0) {
    return null;
  }

  return (
    <div className={styles.productsSection}>
      <h2>
        <i className="fas fa-shopping-bag"></i> Campaign Products
      </h2>
      <div className={styles.productsGrid}>
        {transactionData.campaignProducts.map((product) => (
          <div key={product.id} className={styles.productItem}>
            <div className={styles.productImage}>
              {product.image_url ? (
                <img
                  src={
                    product.image_url.startsWith('http')
                      ? product.image_url
                      : `${API_BASE_URL}${product.image_url}`
                  }
                  alt={product.name}
                  className={styles.productImg}
                />
              ) : (
                <div className={styles.productPlaceholder}>
                  <i className="fas fa-image"></i>
                </div>
              )}
            </div>
            <div className={styles.productDetails}>
              <h3 className={styles.productName}>{product.name}</h3>
              <div className={styles.productPricing}>
                <span className={styles.campaignPrice}>
                  ${product.campaign_price?.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CampaignProductsSection;
