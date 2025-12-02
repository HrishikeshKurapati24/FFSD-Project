/**
 * Formatting utility functions for numbers, dates, currencies, and percentages
 */

/**
 * Format a number with K/M suffixes for large values
 * @param {number|string} value - The number to format
 * @returns {string} Formatted number (e.g., "1.5K", "2.3M", "1,234")
 */
export const formatNumber = (value) => {
  const numericValue = Number(value || 0);
  if (Number.isNaN(numericValue)) {
    return '0';
  }
  if (numericValue >= 1_000_000) {
    return `${(numericValue / 1_000_000).toFixed(1)}M`;
  }
  if (numericValue >= 1_000) {
    return `${(numericValue / 1_000).toFixed(1)}K`;
  }
  return numericValue.toLocaleString();
};

/**
 * Format a number as a percentage
 * @param {number|string} value - The number to format as percentage
 * @returns {string} Formatted percentage (e.g., "45.5%")
 */
export const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;

/**
 * Format a number as currency (USD)
 * @param {number|string} value - The number to format as currency
 * @returns {string} Formatted currency (e.g., "$1,234.56")
 */
export const formatCurrency = (value) => {
  const numericValue = Number(value || 0);
  if (Number.isNaN(numericValue)) {
    return '$0';
  }
  return `$${numericValue.toLocaleString()}`;
};

/**
 * Format a date value to a localized date string
 * @param {Date|string|number} value - The date to format
 * @returns {string} Formatted date string or 'N/A' if invalid
 */
export const formatDate = (value) => {
  if (!value) {
    return 'N/A';
  }
  try {
    return new Date(value).toLocaleDateString();
  } catch (error) {
    return 'N/A';
  }
};

/**
 * Format a decimal number with specified digits
 * @param {number|string} value - The number to format
 * @param {number} digits - Number of decimal places (default: 1)
 * @returns {string} Formatted decimal string
 */
export const formatDecimal = (value, digits = 1) => Number(value ?? 0).toFixed(digits);

/**
 * Sanitize a website URL by removing protocol and trailing slash
 * @param {string} url - The URL to sanitize
 * @returns {string} Sanitized URL
 */
export const sanitizeWebsite = (url = '') => url.replace(/^https?:\/\//i, '').replace(/\/$/, '');

