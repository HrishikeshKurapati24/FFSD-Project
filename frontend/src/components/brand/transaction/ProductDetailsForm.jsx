import React from 'react';

const ProductDetailsForm = ({
  formData,
  formErrors,
  productImagePreview,
  handleInputChange,
  handleFileChange,
  styles
}) => {
  return (
    <div className={styles.campaignSection} style={{ marginBottom: '30px' }}>
      <h3>Add Product Details</h3>
      <p className={styles.sectionDescription}>Provide at least one product to launch this campaign.</p>

      <div className={styles.formGroup}>
        <label htmlFor="prodName">Product Name *</label>
        <input
          type="text"
          id="prodName"
          name="prodName"
          value={formData.prodName}
          onChange={handleInputChange}
          placeholder="e.g., Eco-Friendly Tote Bag"
          className={formErrors.prodName ? styles.errorInput : ''}
        />
        {formErrors.prodName && <small className={styles.errorInline}>{formErrors.prodName}</small>}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="prodDescription">Product Description *</label>
        <textarea
          id="prodDescription"
          name="prodDescription"
          rows="3"
          value={formData.prodDescription}
          onChange={handleInputChange}
          placeholder="Brief description of the product"
          className={formErrors.prodDescription ? styles.errorInput : ''}
        />
        {formErrors.prodDescription && (
          <small className={styles.errorInline}>{formErrors.prodDescription}</small>
        )}
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="originalPrice">Original Price ($) *</label>
          <input
            type="number"
            id="originalPrice"
            name="originalPrice"
            step="0.01"
            min="0"
            value={formData.originalPrice}
            onChange={handleInputChange}
            className={formErrors.originalPrice ? styles.errorInput : ''}
          />
          {formErrors.originalPrice && (
            <small className={styles.errorInline}>{formErrors.originalPrice}</small>
          )}
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="campaignPrice">Campaign Price ($) *</label>
          <input
            type="number"
            id="campaignPrice"
            name="campaignPrice"
            step="0.01"
            min="0"
            value={formData.campaignPrice}
            onChange={handleInputChange}
            className={formErrors.campaignPrice ? styles.errorInput : ''}
          />
          {formErrors.campaignPrice && (
            <small className={styles.errorInline}>{formErrors.campaignPrice}</small>
          )}
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="category">Category *</label>
          <input
            type="text"
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            placeholder="e.g., Accessories"
            className={formErrors.category ? styles.errorInput : ''}
          />
          {formErrors.category && <small className={styles.errorInline}>{formErrors.category}</small>}
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="targetQty">Target Quantity *</label>
          <input
            type="number"
            id="targetQty"
            name="targetQty"
            min="0"
            step="1"
            value={formData.targetQty}
            onChange={handleInputChange}
            className={formErrors.targetQty ? styles.errorInput : ''}
          />
          {formErrors.targetQty && <small className={styles.errorInline}>{formErrors.targetQty}</small>}
        </div>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="productImage">Product Image *</label>
        <input
          type="file"
          id="productImage"
          name="productImage"
          accept="image/*"
          onChange={handleFileChange}
          className={formErrors.productImage ? styles.errorInput : ''}
        />
        {productImagePreview && (
          <div style={{ marginTop: '10px' }}>
            <img
              src={productImagePreview}
              alt="Product preview"
              style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '8px' }}
            />
          </div>
        )}
        {formErrors.productImage && (
          <small className={styles.errorInline}>{formErrors.productImage}</small>
        )}
        <small className={styles.formText}>Upload a high-quality image of your product</small>
      </div>
    </div>
  );
};

export default ProductDetailsForm;
