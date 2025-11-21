import React from 'react';
import ProductFormItem from './ProductFormItem';

const ProductsSection = ({
  products,
  productErrors,
  onProductChange,
  onProductImageChange,
  onRemoveProductImage,
  onRemoveProduct,
  onAddProduct
}) => {
  return (
    <div className="products-section">
      <h3 className="section-title">
        <i className="fa-solid fa-box"></i> Campaign Products
      </h3>
      <p className="section-description">Add products that influencers will promote during this campaign</p>

      <div id="products-container">
        {products.map((product, index) => (
          <ProductFormItem
            key={product.id}
            product={product}
            index={index}
            productErrors={productErrors}
            onProductChange={onProductChange}
            onProductImageChange={onProductImageChange}
            onRemoveProductImage={onRemoveProductImage}
            onRemoveProduct={onRemoveProduct}
            canRemove={products.length > 1}
          />
        ))}
      </div>

      <div className="add-product-container">
        <button type="button" className="btn btn-secondary" onClick={onAddProduct}>
          <i className="fa-solid fa-plus"></i> Add Another Product
        </button>
      </div>
    </div>
  );
};

export default ProductsSection;
