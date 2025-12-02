import React from 'react';
import BrandCard from './BrandCard';

const BrandList = ({
  brands,
  viewMode,
  getBrandLogo,
  onLogoError,
  onInvite
}) => (
  <div className={`brand-list ${viewMode === 'grid' ? 'grid' : 'list-view'}`} id="brandList">
    {brands && brands.length > 0 ? (
      brands.map((brand) => (
        <BrandCard
          key={brand._id}
          brand={brand}
          viewMode={viewMode}
          getBrandLogo={getBrandLogo}
          onLogoError={onLogoError}
          onInvite={onInvite}
        />
      ))
    ) : (
      <div className="no-brands-message">
        <h2>No brands found</h2>
        <p>There are currently no brands available for collaboration.</p>
      </div>
    )}
  </div>
);

export default BrandList;


