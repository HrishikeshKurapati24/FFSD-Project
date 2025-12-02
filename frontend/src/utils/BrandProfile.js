// Brand Profile Utility Functions - ES Module
// Converted from DOM manipulation to React-compatible functions
import { API_BASE_URL } from '../services/api';

/**
 * Update brand profile data
 * @param {Object} profileData - The profile data to update
 * @returns {Promise<{success: boolean, message?: string, brand?: Object}>}
 */
export async function updateBrandProfile(profileData) {
    try {
        const response = await fetch(`${API_BASE_URL}/brand/profile/update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(profileData),
            credentials: 'include'
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to update profile');
        }

        const data = await response.json();
        return {
            success: data.success,
            message: data.message,
            brand: data.brand
        };
    } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
    }
}

/**
 * Update brand images (logo and banner)
 * @param {Object} imageData - Object containing logo and banner files
 * @returns {Promise<{success: boolean, message?: string, brand?: Object}>}
 */
export async function updateBrandImages(imageData) {
    try {
        const formData = new FormData();

        if (imageData.logo) {
            formData.append('logo', imageData.logo);
        }

        if (imageData.banner) {
            formData.append('banner', imageData.banner);
        }

        const response = await fetch(`${API_BASE_URL}/brand/profile/update-images`, {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to update images');
        }

        const data = await response.json();
        return {
            success: data.success,
            message: data.message,
            brand: data.brand
        };
    } catch (error) {
        console.error('Error updating images:', error);
        throw error;
    }
}

/**
 * Delete brand account
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export async function deleteBrandAccount() {
    try {
        const response = await fetch(`${API_BASE_URL}/brand/profile/delete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to delete account');
        }

        const data = await response.json();
        return {
            success: data.success,
            message: data.message
        };
    } catch (error) {
        console.error('Error deleting account:', error);
        throw error;
    }
}

/**
 * Add a tag/value to an array (React state compatible)
 * @param {Array} currentValues - Current values array
 * @param {string} inputValue - New value to add
 * @param {string} name - Name of the field (for validation)
 * @returns {Array} Updated values array
 */
export function addTag(currentValues, inputValue, name = 'value') {
    if (!inputValue || typeof inputValue !== 'string') return currentValues;

    const trimmedValue = inputValue.trim();
    if (trimmedValue && !currentValues.includes(trimmedValue)) {
        return [...currentValues, trimmedValue];
    }

    return currentValues;
}

/**
 * Add value (wrapper for addTag for consistency with original code)
 * @param {Array} currentValues - Current values array
 * @param {string} inputValue - New value to add
 * @returns {Array} Updated values array
 */
export function addValue(currentValues, inputValue) {
    return addTag(currentValues, inputValue, 'values');
}

/**
 * Remove a tag from values array (React state compatible)
 * @param {Array} currentValues - Current values array
 * @param {string} valueToRemove - Value to remove
 * @returns {Array} Updated values array
 */
export function removeTag(currentValues, valueToRemove) {
    return currentValues.filter(value => value !== valueToRemove);
}

/**
 * Add a social link to the social links array (React state compatible)
 * @param {Array} currentSocialLinks - Current social links array
 * @param {Object} newLink - New social link object {platform, url, followers}
 * @returns {Array} Updated social links array
 */
export function addSocialLink(currentSocialLinks, newLink = { platform: 'instagram', url: '', followers: 0 }) {
    return [...currentSocialLinks, newLink];
}

/**
 * Remove a social link from the array (React state compatible)
 * @param {Array} currentSocialLinks - Current social links array
 * @param {number} indexToRemove - Index of social link to remove
 * @returns {Array} Updated social links array
 */
export function removeSocialLink(currentSocialLinks, indexToRemove) {
    return currentSocialLinks.filter((_, index) => index !== indexToRemove);
}

/**
 * Validate profile form data (converted from original validation logic)
 * @param {Object} data - Form data to validate
 * @returns {Object} Validation result with errors object and isValid boolean
 */
export function validateProfileData(data) {
    const errors = {};
            let hasErrors = false;

    // Brand name: required, no numbers, >3 and <50 (from original validation)
            if (!data.name) {
        errors.name = 'Brand name is required';
        hasErrors = true;
            } else if (data.name.length <= 3 || data.name.length >= 50) {
        errors.name = 'Brand name must be > 3 and < 50 characters';
        hasErrors = true;
            } else if (/\d/.test(data.name)) {
        errors.name = 'Brand name must not contain numbers';
        hasErrors = true;
            }

    // Brand description: required, >10 and < 500 characters (from original validation)
            if (!data.description) {
        errors.description = 'Brand description is required';
        hasErrors = true;
            } else if (data.description.length <= 10) {
        errors.description = 'Description must be more than 10 characters';
        hasErrors = true;
            } else if (data.description.length > 500) {
        errors.description = 'Description must be less than 500 characters';
        hasErrors = true;
            }

    // Primary market: required (from original validation)
            if (!data.primaryMarket) {
        errors.primaryMarket = 'Please select a primary market';
        hasErrors = true;
            }

    // Website: required with regex validation (from original validation)
            const websiteRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/i;
            if (!data.website) {
        errors.website = 'Website is required';
        hasErrors = true;
            } else if (!websiteRegex.test(data.website)) {
        errors.website = 'Enter a valid website URL';
        hasErrors = true;
            }

    // Target age range: optional but if present must be min-max with min<max (from original validation)
            if (data.targetAgeRange) {
                const ageMatch = data.targetAgeRange.match(/^(\d+)-(\d+)$/);
                if (!ageMatch) {
            errors.targetAgeRange = 'Age range must be in format min-max, e.g., 18-35';
            hasErrors = true;
                } else {
                    const min = parseInt(ageMatch[1], 10);
                    const max = parseInt(ageMatch[2], 10);
                    if (min >= max) {
                errors.targetAgeRange = 'Minimum age must be less than maximum age';
                hasErrors = true;
                    }
                }
            }

    // Brand categories: at least 1 (from original validation)
            if (!Array.isArray(data.values) || data.values.length < 1) {
        errors.values = 'Add at least one brand category';
        hasErrors = true;
            }

    // Social media links: at least 1 (from original validation)
            if (!Array.isArray(data.socialLinks) || data.socialLinks.length < 1) {
        errors.socialLinks = 'Add at least one social media link';
        hasErrors = true;
    } else {
        // Validate each social link (from original validation)
        for (const link of data.socialLinks) {
                // Only validate URL if it's not empty
                if (link.url) {
                    try {
                        new URL(link.url);
                    } catch {
                    errors.socialLinks = `Please enter a valid URL for ${link.platform}`;
                    hasErrors = true;
                    break;
                }
            }

            if (isNaN(link.followers) || link.followers < 0) {
                errors.socialLinks = `Please enter a valid followers count for ${link.platform}`;
                hasErrors = true;
                break;
            }
        }
    }

    return {
        isValid: !hasErrors,
        errors
    };
}

/**
 * Validate image files (converted from original validation)
 * @param {Object} imageData - Object containing logo and banner files
 * @returns {Object} Validation result with errors object and isValid boolean
 */
export function validateImageData(imageData) {
    const errors = {};
    let hasErrors = false;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];

    // Logo validation (from original validation)
    if (imageData.logo) {
        // Validate file type
        if (!validTypes.includes(imageData.logo.type)) {
            errors.logo = 'Please select a valid image file (JPG, PNG, or GIF)';
            hasErrors = true;
        }
        // Validate file size (5MB) (from original validation)
        else if (imageData.logo.size > 5 * 1024 * 1024) {
            errors.logo = 'Logo must be less than 5MB';
            hasErrors = true;
        }
    }

    // Banner: optional, but if provided, validate (from original validation)
    if (imageData.banner) {
        if (!validTypes.includes(imageData.banner.type)) {
            errors.banner = 'Please select a valid image file (JPG, PNG, or GIF)';
            hasErrors = true;
        } else if (imageData.banner.size > 10 * 1024 * 1024) {
            errors.banner = 'Banner image must be less than 10MB';
            hasErrors = true;
        }
    }

    return {
        isValid: !hasErrors,
        errors
    };
}

/**
 * Process form data for profile update (converted from original form processing)
 * @param {FormData} formData - Form data from the form
 * @param {Array} values - Values array from React state
 * @param {Array} socialLinks - Social links array from React state
 * @returns {Object} Processed data object ready for API submission
 */
export function processProfileFormData(formData, values, socialLinks) {
    return {
        name: formData.get('name')?.trim(),
        username: formData.get('username')?.trim(),
        description: formData.get('description')?.trim(),
        mission: formData.get('mission')?.trim(),
        currentCampaign: formData.get('currentCampaign')?.trim(),
        primaryMarket: formData.get('primaryMarket')?.trim(),
        website: formData.get('website')?.trim(),
        targetAgeRange: formData.get('targetAgeRange')?.trim(),
        targetGender: formData.get('targetGender')?.trim(),
        values: values,
        socialLinks: socialLinks
    };
}

/**
 * Handle profile form submission with validation (converted from original form handler)
 * @param {Event} e - Form submit event
 * @param {Object} formData - Form data object
 * @param {Function} onSuccess - Success callback
 * @param {Function} onError - Error callback
 */
export async function handleProfileFormSubmit(e, formData, onSuccess, onError) {
        e.preventDefault();

    try {
        // Validate the data (using converted validation logic)
        const validation = validateProfileData(formData);

        if (!validation.isValid) {
            if (onError) onError(validation.errors);
            return;
        }

        // Validate website URL (strict URL object if scheme included) (from original validation)
        try {
            if (/^https?:\/\//i.test(formData.website)) {
                new URL(formData.website);
            }
        } catch {
            if (onError) onError({ website: 'Enter a valid website URL' });
            return;
        }

        // Submit the form data
        const result = await updateBrandProfile(formData);

        if (result.success) {
            if (onSuccess) onSuccess(result);
        } else {
            if (onError) onError({ general: result.message || 'Error updating profile' });
        }
    } catch (error) {
        console.error('Error in form submission:', error);
        if (onError) onError({ general: error.message || 'An error occurred while updating the profile' });
    }
}

/**
 * Handle image form submission with validation (converted from original image form handler)
 * @param {Event} e - Form submit event
 * @param {Object} imageData - Image data object {logo: File, banner: File}
 * @param {Function} onSuccess - Success callback
 * @param {Function} onError - Error callback
 */
export async function handleImagesFormSubmit(e, imageData, onSuccess, onError) {
    e.preventDefault();

    try {
        // Validate the images (using converted validation logic)
        const validation = validateImageData(imageData);

        if (!validation.isValid) {
            if (onError) onError(validation.errors);
            return;
        }

        // Submit the image data
        const result = await updateBrandImages(imageData);

        if (result.success) {
            if (onSuccess) onSuccess(result);
        } else {
            if (onError) onError({ general: result.message || 'Error updating images' });
        }
    } catch (error) {
        console.error('Error in image form submission:', error);
        if (onError) onError({ general: error.message || 'An error occurred while updating images' });
    }
}

/**
 * Handle delete account form submission (converted from original delete handler)
 * @param {Event} e - Form submit event
 * @param {string} confirmationText - The confirmation text entered
 * @param {Function} onSuccess - Success callback
 * @param {Function} onError - Error callback
 */
export async function handleDeleteAccountSubmit(e, confirmationText, onSuccess, onError) {
    e.preventDefault();

    if (confirmationText !== 'DELETE') {
        if (onError) onError({ confirmation: 'Please type "DELETE" to confirm account deletion' });
            return;
        }

    if (!window.confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.')) {
        return;
    }

    try {
        const result = await deleteBrandAccount();

            if (result.success) {
            if (onSuccess) onSuccess(result);
            } else {
            if (onError) onError({ general: result.message || 'Error deleting account' });
            }
        } catch (error) {
        console.error('Error deleting account:', error);
        if (onError) onError({ general: error.message || 'An error occurred while deleting the account' });
    }
}

/**
 * Create image preview URL from file (helper function)
 * @param {File} file - Image file
 * @returns {Promise<string>} Promise that resolves to data URL
 */
export function createImagePreview(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error('No file provided'));
            return;
        }

            const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
    });
}

/**
 * Get social platform icon class (helper function)
 * @param {string} platform - Social platform name
 * @returns {string} Font Awesome icon class
 */
export function getSocialPlatformIcon(platform) {
    const iconMap = {
        instagram: 'fa-instagram',
        facebook: 'fa-facebook',
        twitter: 'fa-twitter',
        youtube: 'fa-youtube',
        tiktok: 'fa-tiktok',
        linkedin: 'fa-linkedin'
    };

    return iconMap[platform.toLowerCase()] || 'fa-link';
}

/**
 * Format social platform name (helper function)
 * @param {string} platform - Social platform name
 * @returns {string} Formatted platform name
 */
export function formatSocialPlatformName(platform) {
    return platform.charAt(0).toUpperCase() + platform.slice(1);
}

/**
 * Validate single social link (helper function)
 * @param {Object} link - Social link object {platform, url, followers}
 * @returns {Object} Validation result
 */
export function validateSocialLink(link) {
    const errors = {};
    let hasErrors = false;

    if (!link.platform) {
        errors.platform = 'Platform is required';
        hasErrors = true;
    }

    // Only validate URL if it's provided
    if (link.url && link.url.trim()) {
        try {
            new URL(link.url);
        } catch {
            errors.url = 'Please enter a valid URL';
            hasErrors = true;
        }
    }

    if (!link.followers || isNaN(link.followers) || link.followers < 0) {
        errors.followers = 'Please enter a valid followers count';
        hasErrors = true;
    }

    return {
        isValid: !hasErrors,
        errors
    };
}

/**
 * Process social links data for form submission
 * @param {Array} socialLinksData - Array of social link objects from React state
 * @returns {Array} Processed social links array
 */
export function processSocialLinksData(socialLinksData) {
    return socialLinksData
        .filter(link => link.platform && link.followers) // Only include valid entries
        .map(link => ({
            platform: link.platform.toLowerCase(),
            url: link.url?.trim() || '',
            followers: parseInt(link.followers) || 0
        }));
}