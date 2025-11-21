import React from 'react';

const CampaignSearchFilters = ({
  styles,
  searchQuery,
  onSearchChange,
  onClearSearch,
  filters,
  onFilterChange,
  budgetRanges,
  durationOptions,
  channelOptions,
  categoryOptions,
  hasActiveFilters,
  filteredCount,
  onResetFilters
}) => (
  <div className={styles.searchContainer}>
    <div className={styles.searchInputGroup}>
      <input
        type="text"
        className={styles.searchBar}
        placeholder="Search campaigns by title, brand, products, category, or description..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      {searchQuery && (
        <button className={styles.clearSearchBtn} type="button" onClick={onClearSearch} aria-label="Clear">
          ✕
        </button>
      )}
    </div>

    <div className={styles.filterOptions}>
      <div className={styles.filterGroup}>
        <label htmlFor="statusFilter">Status</label>
        <select
          id="statusFilter"
          value={filters.status}
          onChange={(e) => onFilterChange('status', e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="request">Request</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      <div className={styles.filterGroup}>
        <label htmlFor="budgetFilter">Budget Range</label>
        <select
          id="budgetFilter"
          value={filters.budget}
          onChange={(e) => onFilterChange('budget', e.target.value)}
        >
          {budgetRanges.map((range) => (
            <option value={range.value} key={range.value}>
              {range.label}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.filterGroup}>
        <label htmlFor="channelFilter">Channel</label>
        <select
          id="channelFilter"
          value={filters.channel}
          onChange={(e) => onFilterChange('channel', e.target.value)}
        >
          <option value="">All Channels</option>
          {channelOptions.map((channel) => (
            <option value={channel} key={channel}>
              {channel}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.filterGroup}>
        <label htmlFor="durationFilter">Duration</label>
        <select
          id="durationFilter"
          value={filters.duration}
          onChange={(e) => onFilterChange('duration', e.target.value)}
        >
          {durationOptions.map((duration) => (
            <option value={duration.value} key={duration.value}>
              {duration.label}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.filterGroup}>
        <label htmlFor="categoryFilter">Category</label>
        <select
          id="categoryFilter"
          value={filters.category}
          onChange={(e) => onFilterChange('category', e.target.value)}
        >
          <option value="">All Categories</option>
          {categoryOptions.map((category) => (
            <option value={category} key={category}>
              {category}
            </option>
          ))}
        </select>
      </div>
    </div>

    {hasActiveFilters && (
      <div className={styles.searchResultsInfo}>
        <span>
          {filteredCount} campaign{filteredCount === 1 ? '' : 's'} found
        </span>
        <button className={styles.resetFiltersBtn} type="button" onClick={onResetFilters}>
          Reset Filters
        </button>
      </div>
    )}
  </div>
);

export default CampaignSearchFilters;


