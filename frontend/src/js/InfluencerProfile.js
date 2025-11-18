// Initialize all event listeners when the DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Modal functions
    const editModal = document.getElementById('editProfileModal');
    const deleteModal = document.getElementById('deleteAccountModal');
    const editImagesModal = document.getElementById('editImagesModal');

    if (editModal) {
        window.openEditModal = function () {
            editModal.style.display = 'block';
        };
        window.closeEditModal = function () {
            editModal.style.display = 'none';
        };
    }

    if (deleteModal) {
        window.openDeleteModal = function () {
            deleteModal.style.display = 'block';
        };
        window.closeDeleteModal = function () {
            deleteModal.style.display = 'none';
        };
    }

    if (editImagesModal) {
        window.openEditImagesModal = function () {
            editImagesModal.style.display = 'block';
        };
        window.closeEditImagesModal = function () {
            editImagesModal.style.display = 'none';
        };
    }

    // Close modals when clicking outside
    window.addEventListener('click', function (event) {
        if (event.target === editModal) {
            closeEditModal();
        }
        if (event.target === deleteModal) {
            closeDeleteModal();
        }
        if (event.target === editImagesModal) {
            closeEditImagesModal();
        }
    });

    // Form submission handling
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            // --- Validation helpers ---
            const displayNameInput = document.getElementById('displayName');
            const usernameInput = document.getElementById('username');
            const bioInput = document.getElementById('bio');
            const categoriesContainer = document.getElementById('categoriesContainer');
            const languagesContainer = document.getElementById('languagesContainer');
            const socialLinksContainer = document.getElementById('socialLinks');

            function getOrCreateErrorEl(targetEl, idSuffix) {
                const id = targetEl.id ? `${targetEl.id}-${idSuffix}` : `${idSuffix}`;
                let el = document.getElementById(id);
                if (!el) {
                    el = document.createElement('small');
                    el.id = id;
                    el.className = 'form-text error-inline';
                    el.setAttribute('aria-live', 'polite');
                    // Insert after the element or at end of container
                    if (targetEl.parentElement) {
                        targetEl.parentElement.appendChild(el);
                    } else if (targetEl.appendChild) {
                        targetEl.appendChild(el);
                    }
                }
                return el;
            }

            function setError(targetEl, message, idSuffix = 'error') {
                const el = getOrCreateErrorEl(targetEl, idSuffix);
                el.textContent = message || '';
                if (message) {
                    targetEl.setAttribute('aria-invalid', 'true');
                    // Make error visible and contrasted
                    el.style.display = 'block';
                    el.style.marginTop = '6px';
                    el.style.padding = '6px 8px';
                    el.style.borderRadius = '4px';
                    el.style.background = 'rgba(255, 77, 79, 0.12)';
                    el.style.border = '1px solid #ff4d4f';
                    el.style.color = '#b00020';
                    // Emphasize the related field/container
                    if (targetEl.tagName === 'INPUT' || targetEl.tagName === 'TEXTAREA' || targetEl.tagName === 'SELECT') {
                        targetEl.style.outline = '2px solid #ff4d4f';
                        targetEl.style.outlineOffset = '1px';
                    }
                } else {
                    targetEl.removeAttribute('aria-invalid');
                    el.style.display = '';
                    el.style.padding = '';
                    el.style.border = '';
                    el.style.background = '';
                    el.style.color = '';
                    el.style.borderRadius = '';
                    if (targetEl.tagName === 'INPUT' || targetEl.tagName === 'TEXTAREA' || targetEl.tagName === 'SELECT') {
                        targetEl.style.outline = '';
                        targetEl.style.outlineOffset = '';
                    }
                }
                return Boolean(message);
            }

            function clearAllErrors() {
                [displayNameInput, usernameInput, bioInput, categoriesContainer, languagesContainer, socialLinksContainer]
                    .filter(Boolean)
                    .forEach(el => setError(el, ''));
            }

            clearAllErrors();
            let hasErrors = false;

            // Get all form data
            const formData = new FormData(this);

            // Collect categories
            const categories = [];
            const categoryInputs = document.querySelectorAll('input[name="categories[]"]');
            console.log('Found category inputs:', categoryInputs.length);
            categoryInputs.forEach(input => {
                console.log('Category input:', input.value);
                if (input.value.trim()) {
                    categories.push(input.value.trim());
                }
            });

            // Collect languages
            const languages = [];
            const languageInputs = document.querySelectorAll('input[name="languages[]"]');
            console.log('Found language inputs:', languageInputs.length);
            languageInputs.forEach(input => {
                console.log('Language input:', input.value);
                if (input.value.trim()) {
                    languages.push(input.value.trim());
                }
            });

            // Collect social links
            const socialLinks = [];
            const socialLinkRows = document.querySelectorAll('.social-platform-row');
            console.log('Found social link rows:', socialLinkRows.length);

            socialLinkRows.forEach(row => {
                const platform = row.querySelector('select[name$="[platform]"]')?.value?.trim();
                const url = row.querySelector('input[name$="[url]"]')?.value?.trim();
                const followers = row.querySelector('input[name$="[followers]"]')?.value?.trim();

                console.log('Social link:', { platform, url, followers });

                // Only require platform and followers, URL can be empty for new links
                if (platform && followers) {
                    socialLinks.push({
                        platform,
                        url: url || '', // Allow empty URL
                        followers: parseInt(followers) || 0
                    });
                }
            });

            // Get target audience fields directly from the form
            const audienceAgeRange = document.getElementById('audienceAge')?.value?.trim();
            const audienceGender = document.getElementById('audienceGender')?.value?.trim();

            console.log('Target Audience:', { audienceAgeRange, audienceGender });

            // Get all form fields
            const data = {
                displayName: formData.get('displayName')?.trim(),
                username: formData.get('username')?.trim(),
                bio: formData.get('bio')?.trim(),
                location: formData.get('location')?.trim(),
                audienceAgeRange: audienceAgeRange,
                audienceGender: audienceGender,
                categories: categories,
                languages: languages,
                socials: socialLinks
            };

            // Debug logging
            console.log('Form fields:', {
                displayName: formData.get('displayName'),
                username: formData.get('username'),
                bio: formData.get('bio'),
                location: formData.get('location'),
                audienceAgeRange: audienceAgeRange,
                audienceGender: audienceGender
            });
            console.log('Categories array:', categories);
            console.log('Languages array:', languages);
            console.log('Social links:', socialLinks);
            console.log('Complete data object:', data);

            // --- Field validations ---
            // Display name: required, no numbers, >3 and <50 characters
            if (!data.displayName) {
                hasErrors = setError(displayNameInput, 'Display name is required') || hasErrors;
            } else if (data.displayName.length <= 3 || data.displayName.length >= 50) {
                hasErrors = setError(displayNameInput, 'Display name must be > 3 and < 50 characters') || hasErrors;
            } else if (/\d/.test(data.displayName)) {
                hasErrors = setError(displayNameInput, 'Display name must not contain numbers') || hasErrors;
            } else {
                setError(displayNameInput, '');
            }

            // Username: required, at least one number, >3 and <80 characters
            if (!data.username) {
                hasErrors = setError(usernameInput, 'Username is required') || hasErrors;
            } else if (data.username.length <= 3 || data.username.length >= 80) {
                hasErrors = setError(usernameInput, 'Username must be > 3 and < 80 characters') || hasErrors;
            } else if (!/\d/.test(data.username)) {
                hasErrors = setError(usernameInput, 'Username must include at least one number') || hasErrors;
            } else {
                setError(usernameInput, '');
            }

            // Bio: required
            if (!data.bio) {
                hasErrors = setError(bioInput, 'Bio is required') || hasErrors;
            } else {
                setError(bioInput, '');
            }

            // Audience Age Range: optional, but if present must be like 18-35 and min<=max
            if (audienceAgeRange) {
                const ageMatch = audienceAgeRange.match(/^(\d+)-(\d+)$/);
                if (!ageMatch) {
                    hasErrors = setError(document.getElementById('audienceAge'), 'Age range must be in format min-max, e.g., 18-35') || hasErrors;
                } else {
                    const min = parseInt(ageMatch[1], 10);
                    const max = parseInt(ageMatch[2], 10);
                    if (min >= max) {
                        hasErrors = setError(document.getElementById('audienceAge'), 'Minimum age must be less than maximum age') || hasErrors;
                    } else {
                        setError(document.getElementById('audienceAge'), '');
                    }
                }
            }

            // Categories: at least 1
            if (!Array.isArray(data.categories) || data.categories.length < 1) {
                hasErrors = setError(categoriesContainer, 'Add at least one content category', 'categories-error') || hasErrors;
            } else {
                setError(categoriesContainer, '');
            }

            // Languages: at least 1
            if (!Array.isArray(data.languages) || data.languages.length < 1) {
                hasErrors = setError(languagesContainer, 'Add at least one language', 'languages-error') || hasErrors;
            } else {
                setError(languagesContainer, '');
            }

            // Social links: at least 1
            if (!Array.isArray(data.socials) || data.socials.length < 1) {
                hasErrors = setError(socialLinksContainer, 'Add at least one social media link', 'socials-error') || hasErrors;
            } else {
                setError(socialLinksContainer, '');
            }

            if (hasErrors) {
                // Focus first field with error
                const firstInvalid = document.querySelector('[aria-invalid="true"]');
                if (firstInvalid && typeof firstInvalid.focus === 'function') {
                    firstInvalid.focus();
                }
                return;
            }

            // Validate social links (URLs optional, but if present must be valid; followers must be non-negative number)
            for (const link of socialLinks) {
                // Only validate URL if it's not empty
                if (link.url) {
                    try {
                        new URL(link.url);
                    } catch {
                        setError(socialLinksContainer, `Please enter a valid URL for ${link.platform}`, 'socials-error');
                        return;
                    }
                }

                if (isNaN(link.followers) || link.followers < 0) {
                    setError(socialLinksContainer, `Please enter a valid followers count for ${link.platform}`, 'socials-error');
                    return;
                }
            }

            try {
                const response = await fetch('/influencer/profile/update/data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                if (!response.ok) {
                    const errorData = await response.json();

                    // Handle validation errors
                    if (errorData.errors) {
                        let errorMessage = 'Validation errors:\n';
                        Object.keys(errorData.errors).forEach(field => {
                            errorMessage += `• ${field}: ${errorData.errors[field]}\n`;
                        });
                        throw new Error(errorMessage);
                    }

                    throw new Error(errorData.message || 'Failed to update profile');
                }

                const result = await response.json();

                if (result.success) {
                    alert('Profile updated successfully!');
                    window.location.reload();
                } else {
                    alert(result.message || 'Error updating profile');
                }
            } catch (error) {
                console.error('Error:', error);
                alert(error.message || 'An error occurred while updating the profile');
            }
        });
    }

    // Delete account confirmation
    const confirmDeleteInput = document.getElementById('confirmDelete');
    const deleteBtn = document.getElementById('deleteBtn');

    if (confirmDeleteInput && deleteBtn) {
        confirmDeleteInput.addEventListener('input', function (e) {
            deleteBtn.disabled = this.value !== 'DELETE';
        });
    }

    // Sidebar toggle functions
    const navMenu = document.getElementById('navMenu');
    if (navMenu) {
        window.openMenu = function () {
            navMenu.style.width = "250px";
        };
        window.closeMenu = function () {
            navMenu.style.width = "0";
        };
    }

    // Tag management functions
    window.addTag = function (containerId, inputId, name) {
        const input = document.getElementById(inputId);
        const container = document.getElementById(containerId);

        if (input && container && input.value.trim() !== '') {
            const tag = document.createElement('span');
            tag.className = 'tag';
            tag.innerHTML = `
            ${input.value.trim()}
            <span class="tag-remove" onclick="removeTag(this)">×</span>
                <input type="hidden" name="${name}[]" value="${input.value.trim()}">
        `;
            container.appendChild(tag);
            input.value = '';
        }
    };

    window.addCategory = function () {
        addTag('categoriesContainer', 'categoryInput', 'categories');
    };

    window.addLanguage = function () {
        addTag('languagesContainer', 'languageInput', 'languages');
    };

    window.removeTag = function (element) {
        if (element && element.parentElement) {
            element.parentElement.remove();
        }
    };

    // Social links management
    window.addSocialLink = function () {
        const container = document.getElementById('socialLinks');
        if (!container) return;

        const newLink = document.createElement('div');
        newLink.className = 'social-platform-row';
        newLink.innerHTML = `
            <div class="form-group social-platform-select">
                <select class="form-control" name="socials[${container.children.length}][platform]">
                <option value="instagram">Instagram</option>
                <option value="youtube">YouTube</option>
                <option value="tiktok">TikTok</option>
                <option value="twitter">Twitter</option>
                <option value="facebook">Facebook</option>
                <option value="linkedin">LinkedIn</option>
            </select>
        </div>
            <div class="form-group social-platform-url">
                <input type="url" class="form-control" name="socials[${container.children.length}][url]" placeholder="Profile URL">
            </div>
            <div class="form-group social-platform-followers">
                <input type="text" class="form-control" name="socials[${container.children.length}][followers]" placeholder="Followers">
        </div>
            <div class="form-group social-platform-remove">
                <button type="button" class="btn-secondary" onclick="removeSocialLink(this)">×</button>
        </div>
    `;
        container.appendChild(newLink);
    };

    window.removeSocialLink = function (button) {
        if (button && button.closest('.social-platform-row')) {
            button.closest('.social-platform-row').remove();
        }
    };

    // Images form handling with validation
    const imagesForm = document.getElementById('imagesForm');
    if (imagesForm) {
        imagesForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            // --- Validation helpers (same styling as profile modal) ---
            const profilePicInput = document.getElementById('profilePic');
            const bannerImageInput = document.getElementById('bannerImage');

            function getOrCreateErrorEl(targetEl, idSuffix) {
                const id = targetEl.id ? `${targetEl.id}-${idSuffix}` : `${idSuffix}`;
                let el = document.getElementById(id);
                if (!el) {
                    el = document.createElement('small');
                    el.id = id;
                    el.className = 'form-text error-inline';
                    el.setAttribute('aria-live', 'polite');
                    if (targetEl.parentElement) {
                        targetEl.parentElement.appendChild(el);
                    } else if (targetEl.appendChild) {
                        targetEl.appendChild(el);
                    }
                }
                return el;
            }

            function setError(targetEl, message, idSuffix = 'error') {
                const el = getOrCreateErrorEl(targetEl, idSuffix);
                el.textContent = message || '';
                if (message) {
                    targetEl.setAttribute('aria-invalid', 'true');
                    el.style.display = 'block';
                    el.style.marginTop = '6px';
                    el.style.padding = '6px 8px';
                    el.style.borderRadius = '4px';
                    el.style.background = 'rgba(255, 77, 79, 0.12)';
                    el.style.border = '1px solid #ff4d4f';
                    el.style.color = '#b00020';
                    if (targetEl.tagName === 'INPUT') {
                        targetEl.style.outline = '2px solid #ff4d4f';
                        targetEl.style.outlineOffset = '1px';
                    }
                } else {
                    targetEl.removeAttribute('aria-invalid');
                    el.style.display = '';
                    el.style.padding = '';
                    el.style.border = '';
                    el.style.background = '';
                    el.style.color = '';
                    el.style.borderRadius = '';
                    if (targetEl.tagName === 'INPUT') {
                        targetEl.style.outline = '';
                        targetEl.style.outlineOffset = '';
                    }
                }
                return Boolean(message);
            }

            function clearAllErrors() {
                [profilePicInput, bannerImageInput].filter(Boolean).forEach(el => setError(el, ''));
            }

            clearAllErrors();
            let hasErrors = false;

            // Get files
            const profilePic = profilePicInput.files[0];
            const bannerImage = bannerImageInput.files[0];

            // --- Validation rules ---
            // Profile picture: required
            if (!profilePic) {
                hasErrors = setError(profilePicInput, 'Profile picture is required') || hasErrors;
            } else {
                // Validate file type
                const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
                if (!validTypes.includes(profilePic.type)) {
                    hasErrors = setError(profilePicInput, 'Please select a valid image file (JPG, PNG, or GIF)') || hasErrors;
                }
                // Validate file size (5MB)
                else if (profilePic.size > 5 * 1024 * 1024) {
                    hasErrors = setError(profilePicInput, 'Profile picture must be less than 5MB') || hasErrors;
                } else {
                    setError(profilePicInput, '');
                }
            }

            // Banner image: optional, but if provided, validate
            if (bannerImage) {
                const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
                if (!validTypes.includes(bannerImage.type)) {
                    hasErrors = setError(bannerImageInput, 'Please select a valid image file (JPG, PNG, or GIF)') || hasErrors;
                } else if (bannerImage.size > 10 * 1024 * 1024) {
                    hasErrors = setError(bannerImageInput, 'Banner image must be less than 10MB') || hasErrors;
                } else {
                    setError(bannerImageInput, '');
                }
            } else {
                setError(bannerImageInput, '');
            }

            if (hasErrors) {
                const firstInvalid = document.querySelector('[aria-invalid="true"]');
                if (firstInvalid && typeof firstInvalid.focus === 'function') firstInvalid.focus();
                return;
            }

            const submitButton = this.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

            const formData = new FormData();

            // Add files
            if (profilePic) {
                formData.append('profilePic', profilePic);
            }
            if (bannerImage) {
                formData.append('bannerImage', bannerImage);
            }

            try {
                const response = await fetch('/influencer/profile/update-images', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (result.success) {
                    alert('Images updated successfully!');
                    window.location.reload();
                } else {
                    alert(result.message || 'Error updating images');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred while updating images. Please try again later.');
            } finally {
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
            }
        });
    }

    // Delete account function
    window.confirmDelete = async function () {
        if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch('/influencer/profile/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include' // This ensures cookies are sent with the request
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete account');
            }

            const result = await response.json();

            if (result.success) {
                alert('Account deleted successfully');
                window.location.href = '/';
            } else {
                alert(result.message || 'Error deleting account');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while deleting the account. Please try again later.');
        }
    };

    // Image preview functionality (no validation, just preview)
    document.getElementById('profilePic').addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                document.getElementById('profilePicPreview').src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    document.getElementById('bannerImage').addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                document.getElementById('bannerPreview').src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
});