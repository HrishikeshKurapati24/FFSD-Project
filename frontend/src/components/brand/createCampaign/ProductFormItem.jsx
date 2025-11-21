import React from 'react';

const ProductFormItem = ({
  product,
  index,
  productErrors,
  onProductChange,
  onProductImageChange,
  onRemoveProductImage,
  onRemoveProduct,
  canRemove
}) => {
  return (
    <div key={product.id} className="product-item" data-index={index}>
      <div className="product-header">
        <h4>Product {index + 1}</h4>
        {canRemove && (
          <button
            type="button"
            className="btn-remove-product"
            onClick={() => onRemoveProduct(product.id)}
          >
            <i className="fa-solid fa-trash"></i>
          </button>
        )}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor={`product-name-${product.id}`}>Product Name</label>
          <input
            type="text"
            className={`form-control ${productErrors[product.id]?.name ? 'error-input' : ''}`}
            id={`product-name-${product.id}`}
            name={`products[${product.id}][name]`}
            value={product.name}
            onChange={(e) => onProductChange(product.id, 'name', e.target.value)}
            placeholder="Enter product name"
            required
            aria-invalid={productErrors[product.id]?.name ? 'true' : 'false'}
          />
          {productErrors[product.id]?.name && (
            <small className="error-inline">{productErrors[product.id].name}</small>
          )}
        </div>

        <div className="form-group">
          <label htmlFor={`product-category-${product.id}`}>Category</label>
          <select
            className={`form-control ${productErrors[product.id]?.category ? 'error-input' : ''}`}
            id={`product-category-${product.id}`}
            name={`products[${product.id}][category]`}
            value={product.category}
            onChange={(e) => onProductChange(product.id, 'category', e.target.value)}
            required
            aria-invalid={productErrors[product.id]?.category ? 'true' : 'false'}
          >
            <option value="">Select category</option>
            <option value="Beauty">Beauty</option>
            <option value="Fashion">Fashion</option>
            <option value="Electronics">Electronics</option>
            <option value="Food & Beverage">Food & Beverage</option>
            <option value="Health & Wellness">Health & Wellness</option>
            <option value="Home & Garden">Home & Garden</option>
            <option value="Sports & Fitness">Sports & Fitness</option>
            <option value="Travel">Travel</option>
            <option value="Other">Other</option>
          </select>
          {productErrors[product.id]?.category && (
            <small className="error-inline">{productErrors[product.id].category}</small>
          )}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor={`product-target-quantity-${product.id}`}>Target Quantity</label>
        <input
          type="number"
          className={`form-control ${productErrors[product.id]?.target_quantity ? 'error-input' : ''}`}
          id={`product-target-quantity-${product.id}`}
          name={`products[${product.id}][target_quantity]`}
          value={product.target_quantity}
          onChange={(e) => onProductChange(product.id, 'target_quantity', e.target.value)}
          min="0"
          placeholder="Enter target quantity"
          required
          aria-invalid={productErrors[product.id]?.target_quantity ? 'true' : 'false'}
        />
        {productErrors[product.id]?.target_quantity && (
          <small className="error-inline">{productErrors[product.id].target_quantity}</small>
        )}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor={`product-original-price-${product.id}`}>Original Price ($)</label>
          <input
            type="number"
            className={`form-control ${productErrors[product.id]?.original_price ? 'error-input' : ''}`}
            id={`product-original-price-${product.id}`}
            name={`products[${product.id}][original_price]`}
            value={product.original_price}
            onChange={(e) => onProductChange(product.id, 'original_price', e.target.value)}
            min="0"
            step="0.01"
            placeholder="0.00"
            required
            aria-invalid={productErrors[product.id]?.original_price ? 'true' : 'false'}
          />
          {productErrors[product.id]?.original_price && (
            <small className="error-inline">{productErrors[product.id].original_price}</small>
          )}
        </div>

        <div className="form-group">
          <label htmlFor={`product-campaign-price-${product.id}`}>Campaign Price ($)</label>
          <input
            type="number"
            className={`form-control ${productErrors[product.id]?.campaign_price ? 'error-input' : ''}`}
            id={`product-campaign-price-${product.id}`}
            name={`products[${product.id}][campaign_price]`}
            value={product.campaign_price}
            onChange={(e) => onProductChange(product.id, 'campaign_price', e.target.value)}
            min="0"
            step="0.01"
            placeholder="0.00"
            required
            aria-invalid={productErrors[product.id]?.campaign_price ? 'true' : 'false'}
          />
          {productErrors[product.id]?.campaign_price && (
            <small className="error-inline">{productErrors[product.id].campaign_price}</small>
          )}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor={`product-description-${product.id}`}>Product Description</label>
        <textarea
          className={`form-control ${productErrors[product.id]?.description ? 'error-input' : ''}`}
          id={`product-description-${product.id}`}
          name={`products[${product.id}][description]`}
          value={product.description}
          onChange={(e) => onProductChange(product.id, 'description', e.target.value)}
          placeholder="Describe the product features and benefits"
          required
          aria-invalid={productErrors[product.id]?.description ? 'true' : 'false'}
        />
        {productErrors[product.id]?.description && (
          <small className="error-inline">{productErrors[product.id].description}</small>
        )}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor={`product-image-${product.id}`}>Product Image</label>
          <input
            type="file"
            className={`form-control ${productErrors[product.id]?.image ? 'error-input' : ''}`}
            id={`product-image-${product.id}`}
            name={`products[${product.id}][image]`}
            accept="image/*"
            onChange={(e) => onProductImageChange(product.id, e)}
            required
            aria-invalid={productErrors[product.id]?.image ? 'true' : 'false'}
          />
          {product.imagePreview && (
            <div className="image-preview" style={{ display: 'block' }}>
              <img src={product.imagePreview} alt="Product preview" />
              <button
                type="button"
                onClick={() => onRemoveProductImage(product.id)}
                className="btn-remove-image"
              >
                Remove
              </button>
            </div>
          )}
          {productErrors[product.id]?.image && (
            <small className="error-inline">{productErrors[product.id].image}</small>
          )}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor={`product-special-instructions-${product.id}`}>Special Instructions for Influencers</label>
        <textarea
          className="form-control"
          id={`product-special-instructions-${product.id}`}
          name={`products[${product.id}][special_instructions]`}
          value={product.special_instructions}
          onChange={(e) => onProductChange(product.id, 'special_instructions', e.target.value)}
          placeholder="Any specific instructions for influencers promoting this product"
        />
      </div>
    </div>
  );
};

export default ProductFormItem;
