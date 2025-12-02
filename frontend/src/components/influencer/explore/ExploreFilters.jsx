import React from 'react';

const ExploreFilters = ({
  searchQuery,
  selectedCategory,
  categories,
  onSearchChange,
  onCategoryChange,
  onSearch,
  onClear
}) => (
  <div className="filter-section">
    <div className="filter-controls">
      <div className="search-box">
        <input
          type="text"
          id="searchInput"
          placeholder="Search brands..."
          value={searchQuery}
          onChange={onSearchChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onSearch();
            }
          }}
        />
        <button type="button" onClick={onSearch} className="search-btn">
          <i className="fas fa-search"></i>
        </button>
      </div>
      <div className="category-filter">
        <select
          id="categoryFilter"
          value={selectedCategory}
          onChange={onCategoryChange}
        >
          <option value="all">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>
      <div className="filter-actions">
        <button type="button" onClick={onClear} className="clear-btn">
          <i className="fas fa-times"></i> Clear Filters
        </button>
      </div>
    </div>
  </div>
);

export default ExploreFilters;


