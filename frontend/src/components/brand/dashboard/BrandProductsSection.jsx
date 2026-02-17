import React from 'react';
import styles from '../../../styles/brand/dashboard.module.css';

const BrandProductsSection = ({ products = [] }) => {
  if (!products || products.length === 0) {
    return (
      <div className="mt-5">
        <h3>Products List</h3>
        <p className="text-muted mb-0">No products found.</p>
      </div>
    );
  }

  return (
    <div className="mt-5">
      <h3>Products List ({products.length})</h3>
      <div className="row">
        {products.map((product) => (
          <div key={product._id} className="col-md-6 col-lg-4 mb-3">
            <div className={`card h-100 ${styles.productCard}`}>
              <div className="card-body">
                <div className="d-flex align-items-start">
                  {product.images && product.images.length > 0 && (
                    <img
                      src={product.images[0].url}
                      alt={product.name}
                      className={`me-3 ${styles.productImage}`}
                      style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
                      onError={(e) => {
                        e.target.src = '/images/default-product.jpg';
                      }}
                    />
                  )}
                  <div className="flex-grow-1">
                    <h6 className="card-title mb-1">{product.name}</h6>
                    <p className="card-text small text-muted mb-2">{product.description}</p>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <span className="badge bg-primary me-2">${product.campaign_price}</span>
                        {product.original_price > product.campaign_price && (
                          <span className="text-decoration-line-through text-muted small">
                            ${product.original_price}
                          </span>
                        )}
                      </div>
                      <small className="text-muted">
                        {product.category}
                      </small>
                    </div>
                    {product.target_quantity && (
                      <div className="mt-2">
                        <small className="text-muted">
                          Target: {product.target_quantity} units
                        </small>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BrandProductsSection;
