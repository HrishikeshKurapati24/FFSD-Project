import React from 'react';

const DEFAULT_PRODUCT_IMAGE = '/images/default-product.png';

const ProductsTab = ({
  filteredProducts,
  styles,
  formatCurrency,
  getPrimaryImageUrl,
  getAvailableStock,
  handleAddToCart
}) => {
  return (
    <div className="row" id="products-section">
      {filteredProducts.length ? (
        filteredProducts.map((product) => {
          const imageUrl = getPrimaryImageUrl(product) || DEFAULT_PRODUCT_IMAGE;
          const availableStock = getAvailableStock(product);
          return (
            <div className="col-md-6 col-lg-4 mb-4" key={product?._id}>
              <div className={`h-100 d-flex flex-column ${styles['product-card']}`}>
                <div className={styles['product-image-container']}>
                  <img
                    src={imageUrl}
                    alt={product?.name || 'Product image'}
                    className={styles['product-image']}
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                    }}
                  />
                  {product?.discount_percentage > 0 && (
                    <span className={styles['discount-badge']}>
                      {product.discount_percentage}% OFF
                    </span>
                  )}
                </div>
                <div className={`${styles['product-info']} d-flex flex-column flex-grow-1`}>
                  <h6 className={styles['product-name']}>
                    {product?.name || 'Unnamed Product'}
                  </h6>
                  <p className={styles['product-description']}>
                    {product?.description
                      ? product.description.length > 120
                        ? `${product.description.substring(0, 120)}...`
                        : product.description
                      : ''}
                  </p>
                  <div className={`${styles['product-pricing']} mb-2`}>
                    <span className={styles['current-price']}>
                      {formatCurrency(product?.campaign_price || 0)}
                    </span>
                    {product?.original_price != null &&
                      product.original_price > product.campaign_price && (
                        <span className={styles['original-price']}>
                          {formatCurrency(product.original_price)}
                        </span>
                      )}
                  </div>
                  <div className={`${styles['product-details']} mb-3`}>
                    <ul className="list-unstyled small mb-0">
                      {product?.category && (
                        <li>
                          <strong>Category:</strong> {product.category}
                        </li>
                      )}
                      {product?.is_digital && (
                        <li>
                          <strong>Type:</strong>{' '}
                          <span className="badge bg-info">Digital Product</span>
                        </li>
                      )}
                      <li>
                        <strong>Stock:</strong> {availableStock} available
                      </li>
                      {product?.delivery_info?.estimated_days && (
                        <li>
                          <strong>Delivery:</strong>{' '}
                          {product.delivery_info.estimated_days} days{' '}
                          {product.delivery_info.shipping_cost > 0
                            ? `(Shipping: ${formatCurrency(
                                product.delivery_info.shipping_cost
                              )})`
                            : product.delivery_info.free_shipping_threshold
                              ? `(Free shipping over ${formatCurrency(
                                  product.delivery_info.free_shipping_threshold
                                )})`
                              : '(Free shipping)'}
                        </li>
                      )}
                      {product?.tags?.length ? (
                        <li>
                          <strong>Tags:</strong> {product.tags.slice(0, 3).join(', ')}
                          {product.tags.length > 3 ? '...' : ''}
                        </li>
                      ) : null}
                      {product?.specifications &&
                        Object.keys(product.specifications).length > 0 && (
                          <>
                            {Object.entries(product.specifications)
                              .slice(0, 2)
                              .map(([key, value]) => (
                                <li key={key}>
                                  <strong>{key}:</strong> {value}
                                </li>
                              ))}
                            {Object.keys(product.specifications).length > 2 && (
                              <li>
                                <em>
                                  +{Object.keys(product.specifications).length - 2} more
                                  specifications
                                </em>
                              </li>
                            )}
                          </>
                        )}
                      {product?.special_instructions && (
                        <li>
                          <strong>Note:</strong> {product.special_instructions}
                        </li>
                      )}
                    </ul>
                  </div>
                  <div className={`${styles['product-actions']} mt-auto`}>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => handleAddToCart(product?._id, availableStock)}
                    >
                      <i className="fas fa-shopping-cart me-1" aria-hidden="true" />
                      Add to Cart
                    </button>
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
            No products available for this campaign.
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsTab;
