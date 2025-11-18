let selectedBrandId = null;
let selectedBrandName = null;

function openMenu() {
    document.getElementById("navMenu").style.width = "250px";
}

function closeMenu() {
    document.getElementById("navMenu").style.width = "0";
}

function openInviteModal(brandId, brandName) {
    selectedBrandId = brandId;
    selectedBrandName = brandName;
    document.getElementById('inviteBrandName').textContent = `Inviting: ${brandName}`;
    document.getElementById('inviteModal').style.display = 'flex';
    document.getElementById('inviteForm').reset();
}

function closeInviteModal() {
    document.getElementById('inviteModal').style.display = 'none';
    selectedBrandId = null;
    selectedBrandName = null;
}

// Close modal when clicking outside
window.onclick = function (event) {
    const modal = document.getElementById('inviteModal');
    if (event.target === modal) {
    closeInviteModal();
    }
}

// Add real-time validation for form fields
document.addEventListener('DOMContentLoaded', function () {

    // Add real-time validation and character filtering for text fields
    const textFields = ['campaignTitle', 'campaignDescription', 'productName'];

    // Define character patterns for each field
    const characterPatterns = {
    campaignTitle: /^[a-zA-Z0-9\s\-_.,!?&():;'"]*$/,
    campaignDescription: /^[a-zA-Z0-9\s\-_.,!?&():;'"@#$%*+/=<>[\]{}|\\~`]*$/,
    productName: /^[a-zA-Z0-9\s\-_.,!?&():;'"]*$/
    };

    textFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
        field.addEventListener('input', function (e) {
        clearFieldError(fieldId);

        // Filter invalid characters as user types
        const pattern = characterPatterns[fieldId];
        const currentValue = e.target.value;

        // Check if the current value contains invalid characters
        if (!pattern.test(currentValue)) {
            // Remove invalid characters
            const filteredValue = currentValue.replace(/[^a-zA-Z0-9\s\-_.,!?&():;'"@#$%*+/=<>[\]{}|\\~`]/g, '');
            e.target.value = filteredValue;

            // Show brief warning for invalid characters
            showFieldError(fieldId, 'Some characters were removed as they are not allowed');

            // Clear the warning after 2 seconds
            setTimeout(() => {
            clearFieldError(fieldId);
            }, 2000);
        }
        });
    }
    });

    // Add real-time validation and filtering for budget
    const budgetField = document.getElementById('budget');
    if (budgetField) {
    budgetField.addEventListener('input', function (e) {
        clearFieldError('budget');

        // Allow only numbers and one decimal point
        let value = e.target.value;
        value = value.replace(/[^0-9.]/g, ''); // Remove non-numeric characters except decimal

        // Ensure only one decimal point
        const parts = value.split('.');
        if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
        }

        // Limit to 2 decimal places
        if (parts[1] && parts[1].length > 2) {
        value = parts[0] + '.' + parts[1].substring(0, 2);
        }

        // Update the field value
        e.target.value = value;

        // Show warning if invalid characters were removed
        if (e.target.value !== e.target.value) {
        showFieldError('budget', 'Only numbers and decimal point are allowed');
        setTimeout(() => {
            clearFieldError('budget');
        }, 2000);
        }
    });
    }

    // Add real-time validation for channels
    const channelCheckboxes = document.querySelectorAll('input[name="channels"]');
    channelCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function () {
        // Clear channel errors when selection changes
        const channelSection = document.querySelector('.channel-checkboxes').parentNode;
        const errorDiv = channelSection.querySelector('.field-error');
        if (errorDiv) {
        errorDiv.remove();
        }
    });
    });
});

// Validation functions
function validateTitle(title) {
    if (!title || title.trim().length === 0) {
    return 'Campaign title is required';
    }
    if (title.trim().length < 5) {
    return 'Campaign title must be at least 5 characters long';
    }
    if (title.trim().length > 100) {
    return 'Campaign title must not exceed 100 characters';
    }

    // Check for vague/invalid patterns
    const vaguePatterns = [
    /^(test|testing|demo|sample|example|asdf|qwerty|123|abc|xyz)$/i,
    /^(campaign|title|project|collab|collaboration)$/i,
    /^(stuff|things|random|whatever|something)$/i,
    /^(my|the|a|an)\s+(campaign|project|collab)$/i,
    /^[a-z]{1,4}$/i, // Very short strings
    /^[0-9]+$/, // Only numbers
    /^(.)\1{4,}$/, // Repeated characters like "aaaaa", "bbbbb"
    /^[^a-zA-Z0-9\s]*$/, // Only special characters
    /^(lorem|ipsum|dolor|sit|amet)/i // Lorem ipsum text
    ];

    if (vaguePatterns.some(pattern => pattern.test(title.trim()))) {
    return 'Please enter a meaningful campaign title';
    }

    return null;
}

function validateDescription(description) {
    if (!description || description.trim().length === 0) {
    return 'Campaign description is required';
    }
    if (description.trim().length < 20) {
    return 'Campaign description must be at least 20 characters long';
    }
    if (description.trim().length > 1000) {
    return 'Campaign description must not exceed 1000 characters';
    }

    // Check for vague/invalid patterns
    const vaguePatterns = [
    /^(test|testing|demo|sample|example|asdf|qwerty|123|abc|xyz)/i,
    /^(description|desc|details|info|information)$/i,
    /^(stuff|things|random|whatever|something|anything)$/i,
    /^(my|the|a|an)\s+(description|details|info)$/i,
    /^(lorem|ipsum|dolor|sit|amet)/i, // Lorem ipsum text
    /^(.)\1{10,}/i, // Repeated characters like "aaaaaaaaaa"
    /^[^a-zA-Z0-9\s]{10,}/i, // Only special characters
    /^(blah|blah blah|random text|test text|sample text)/i,
    /^(just|simply|basically|basically just)/i, // Vague starting words
    /^(i want to|i need to|i would like to|i hope to)/i // Vague starting phrases
    ];

    if (vaguePatterns.some(pattern => pattern.test(description.trim()))) {
    return 'Please provide a detailed and meaningful campaign description';
    }

    return null;
}

function validateObjectives(objectives) {
    if (!objectives || objectives.trim().length === 0) {
    return 'Campaign objectives are required';
    }
    if (objectives.trim().length < 10) {
    return 'Campaign objectives must be at least 10 characters long';
    }
    if (objectives.trim().length > 500) {
    return 'Campaign objectives must not exceed 500 characters';
    }

    // Check for vague/invalid patterns
    const vaguePatterns = [
    /^(test|testing|demo|sample|example|asdf|qwerty|123|abc|xyz)/i,
    /^(objectives|goals|targets|aims|purposes)$/i,
    /^(stuff|things|random|whatever|something|anything)$/i,
    /^(my|the|a|an)\s+(objectives|goals|targets)$/i,
    /^(lorem|ipsum|dolor|sit|amet)/i, // Lorem ipsum text
    /^(.)\1{8,}/i, // Repeated characters like "aaaaaaaa"
    /^[^a-zA-Z0-9\s]{8,}/i, // Only special characters
    /^(blah|blah blah|random text|test text|sample text)/i
    ];

    if (vaguePatterns.some(pattern => pattern.test(objectives.trim()))) {
    return 'Please provide specific and meaningful campaign objectives';
    }

    return null;
}

function validateBudget(budget) {
    if (!budget || isNaN(budget)) {
    return 'Valid budget amount is required';
    }
    if (budget <= 0) {
    return 'Budget must be greater than $0';
    }
    if (budget > 1000000000) {
    return 'Budget must not exceed $1,000,000,000';
    }
    return null;
}

function validateTargetAudience(audience) {
    if (!audience || audience.trim().length === 0) {
    return 'Target audience is required';
    }
    if (audience.trim().length < 5) {
    return 'Target audience must be at least 5 characters long';
    }
    if (audience.trim().length > 200) {
    return 'Target audience must not exceed 200 characters';
    }

    // Check for vague/invalid patterns
    const vaguePatterns = [
    /^(test|testing|demo|sample|example|asdf|qwerty|123|abc|xyz)$/i,
    /^(audience|target|people|users|customers|clients)$/i,
    /^(stuff|things|random|whatever|something|anything)$/i,
    /^(my|the|a|an)\s+(audience|target|people)$/i,
    /^[a-z]{1,4}$/i, // Very short strings
    /^[0-9]+$/, // Only numbers
    /^(.)\1{4,}$/, // Repeated characters like "aaaaa", "bbbbb"
    /^[^a-zA-Z0-9\s]*$/, // Only special characters
    /^(everyone|all people|anyone|nobody|no one)$/i, // Too generic
    /^(young|old|adult|teen|kid)/i, // Too vague without specifics
    /^(male|female|man|woman|boy|girl)$/i // Too generic without age/interest
    ];

    if (vaguePatterns.some(pattern => pattern.test(audience.trim()))) {
    return 'Please specify a detailed target audience (e.g., "Young Adults, 18-35, interested in fashion")';
    }

    return null;
}

function validateDates(startDate, endDate) {
    if (!startDate) {
    return 'Start date is required';
    }
    if (!endDate) {
    return 'End date is required';
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
    return 'Start date cannot be in the past';
    }
    if (end <= start) {
    return 'End date must be after start date';
    }

    const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    if (duration > 365) {
    return 'Campaign duration cannot exceed 365 days';
    }
    if (duration < 1) {
    return 'Campaign must run for at least 1 day';
    }

    return null;
}

function validateChannels(channels) {
    if (!channels || channels.length === 0) {
    return 'Please select at least one social media channel';
    }
    if (channels.length > 6) {
    return 'Please select no more than 6 channels';
    }
    return null;
}

function validateProductName(productName) {
    if (!productName || productName.trim().length === 0) {
    return 'Product name is required';
    }
    if (productName.trim().length < 3) {
    return 'Product name must be at least 3 characters long';
    }
    if (productName.trim().length > 200) {
    return 'Product name must not exceed 200 characters';
    }

    // Check for vague/invalid patterns
    const vaguePatterns = [
    /^(test|testing|demo|sample|example|asdf|qwerty|123|abc|xyz)$/i,
    /^(product|item|thing|stuff|object|goods)$/i,
    /^(my|the|a|an)\s+(product|item|thing)$/i,
    /^[a-z]{1,3}$/i, // Very short strings
    /^[0-9]+$/, // Only numbers
    /^(.)\1{4,}$/, // Repeated characters like "aaaaa", "bbbbb"
    /^[^a-zA-Z0-9\s]*$/, // Only special characters
    /^(lorem|ipsum|dolor|sit|amet)/i // Lorem ipsum text
    ];

    if (vaguePatterns.some(pattern => pattern.test(productName.trim()))) {
    return 'Please enter a meaningful product name';
    }

    return null;
}

function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorDiv = field.parentNode.querySelector('.field-error');

    if (errorDiv) {
    errorDiv.remove();
    }

    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.textContent = message;

    field.parentNode.appendChild(errorElement);
    field.classList.add('error');
}

function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    const errorDiv = field.parentNode.querySelector('.field-error');

    if (errorDiv) {
    errorDiv.remove();
    }

    field.classList.remove('error');
}

async function sendInvite(event) {
    event.preventDefault();

    if (!selectedBrandId) {
    alert('Brand not selected.');
    return;
    }

    // Clear previous errors
    const errorElements = document.querySelectorAll('.field-error');
    errorElements.forEach(el => el.remove());

    const fields = ['campaignTitle', 'campaignDescription', 'budget', 'productName'];
    fields.forEach(fieldId => {
    clearFieldError(fieldId);
    });

    // Get form values
    const title = document.getElementById('campaignTitle').value.trim();
    const description = document.getElementById('campaignDescription').value.trim();
    const budget = parseFloat(document.getElementById('budget').value);
    const productName = document.getElementById('productName').value.trim();

    // Get selected channels
    const channelCheckboxes = document.querySelectorAll('input[name="channels"]:checked');
    const channels = Array.from(channelCheckboxes).map(cb => cb.value);

    // Validate all fields
    let hasErrors = false;

    const titleError = validateTitle(title);
    if (titleError) {
    showFieldError('campaignTitle', titleError);
    hasErrors = true;
    }

    const descriptionError = validateDescription(description);
    if (descriptionError) {
    showFieldError('campaignDescription', descriptionError);
    hasErrors = true;
    }

    const budgetError = validateBudget(budget);
    if (budgetError) {
    showFieldError('budget', budgetError);
    hasErrors = true;
    }

    const productNameError = validateProductName(productName);
    if (productNameError) {
    showFieldError('productName', productNameError);
    hasErrors = true;
    }

    const channelsError = validateChannels(channels);
    if (channelsError) {
    // Show channel error in a different way since it's not a single field
    const channelSection = document.querySelector('.channel-checkboxes').parentNode;
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.style.color = '#dc3545';
    errorElement.style.fontSize = '0.875rem';
    errorElement.style.marginTop = '10px';
    errorElement.textContent = channelsError;
    channelSection.appendChild(errorElement);
    hasErrors = true;
    }

    if (hasErrors) {
    // Scroll to first error
    const firstError = document.querySelector('.field-error');
    if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
    }

    const formData = {
    brandId: selectedBrandId,
    title: title,
    description: description,
    budget: budget,
    product_name: productName,
    required_channels: channels
    };

    try {
    const response = await fetch('/influencer/invite-brand', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (data.success) {
        alert(`Invitation sent successfully to ${selectedBrandName}!`);
        closeInviteModal();
    } else {
        const errorMessage = data.message || 'Unknown error';
        if (data.showUpgradeLink) {
        if (confirm(errorMessage + '\n\nWould you like to upgrade your plan now?')) {
            window.location.href = '/subscription/manage';
        }
        } else {
        alert('Failed to send invite: ' + errorMessage);
        }
    }
    } catch (error) {
    console.error('Error sending invite:', error);
    alert('An error occurred while sending the invite. Please try again.');
    }
}

(function setupViewToggle({ containerId, buttonId, param = 'view' }) {
    const listEl = document.getElementById(containerId);
    const btn = document.getElementById(buttonId);
    const announce = document.getElementById('viewAnnouncer');
    if (!listEl || !btn) return;

    const url = new URL(window.location.href);
    const saved = localStorage.getItem(`${containerId}:view`);
    const fromUrl = url.searchParams.get(param);
    const initial = (fromUrl || saved || 'list');

    apply(initial);

    btn.addEventListener('click', function handleToggleClick() {
    const next = listEl.classList.contains('grid') ? 'list' : 'grid';
    apply(next);
    });

    function apply(mode) {
    listEl.classList.toggle('grid', mode === 'grid');
    listEl.classList.toggle('list', mode === 'list');
    const isGrid = mode === 'grid';
    btn.setAttribute('aria-pressed', String(isGrid));
    btn.textContent = isGrid ? 'List view' : 'Grid view';
    btn.setAttribute('aria-label', isGrid ? 'Switch to list view' : 'Switch to grid view');
    try { localStorage.setItem(`${containerId}:view`, mode); } catch (e) { }
    url.searchParams.set(param, mode);
    history.replaceState(null, '', url);
    if (announce) announce.textContent = isGrid ? 'Grid view' : 'List view';
    }
})({ containerId: 'brandList', buttonId: 'viewToggle' });

// Filter functionality
function applyFilters() {
    const search = document.getElementById('searchInput').value;
    const category = document.getElementById('categoryFilter').value;
    
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category && category !== 'all') params.append('category', category);
    
    const url = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
    window.location.href = url;
}

function clearFilters() {
    window.location.href = window.location.pathname;
}

// Allow Enter key to trigger search
document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
    applyFilters();
    }
});