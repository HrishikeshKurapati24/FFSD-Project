// Sidebar toggle functions
function openMenu() {
    document.getElementById("navMenu").style.width = "250px";
}

function closeMenu() {
    document.getElementById("navMenu").style.width = "0";
}

// Content Creation Functions
function openContentCreationModal(campaignId, campaignTitle) {
    document.getElementById('campaignId').value = campaignId;
    document.querySelector('#contentCreationModal h2').innerHTML =
    '<i class="fas fa-video"></i> Create Content';
    document.getElementById('contentCreationModal').style.display = 'block';

    // Load campaign products
    loadCampaignProducts(campaignId);
}

function closeContentCreationModal() {
    document.getElementById('contentCreationModal').style.display = 'none';
    document.getElementById('contentCreationForm').reset();
}

function viewCampaignProducts(campaignId) {
    // Redirect to campaign products page
    window.location.href = `/influencer/campaigns/${campaignId}/products`;
}

function loadCampaignProducts(campaignId) {
    fetch(`/influencer/campaigns/${campaignId}/products`)
    .then(response => response.json())
    .then(data => {
        const productSelect = document.getElementById('campaignProduct');
        productSelect.innerHTML = '<option value="">Select a product to promote</option>';

        if (data.success && data.products) {
        data.products.forEach(product => {
            const option = document.createElement('option');
            option.value = product._id;
            option.textContent = `${product.name} - $${product.campaign_price}`;
            productSelect.appendChild(option);
        });
        }
    })
    .catch(error => {
        console.error('Error loading products:', error);
    });
}

// Function to check for approved content and alert influencer
async function checkApprovedContent() {
    try {
    const response = await fetch('/influencer/content/approved');
    const data = await response.json();

    if (data.success && data.content && data.content.length > 0) {
        // Show alert for each approved content
        for (const content of data.content) {
        const campaignTitle = content.campaignTitle || 'Campaign';
        const brandName = content.brandName || 'the brand';
        const message = `Your content for "${campaignTitle}" has been approved by ${brandName}! You can now post it on social media.`;

        alert(message);

        // Update content status to published
        await updateContentStatus(content._id);
        }
    }
    } catch (error) {
    console.error('Error checking approved content:', error);
    // Don't show error to user as this is a background check
    }
}

// Function to update content status to published
async function updateContentStatus(contentId) {
    try {
    const response = await fetch(`/influencer/content/${contentId}/publish`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify({
        status: 'published'
        })
    });

    const data = await response.json();
    if (!data.success) {
        console.error('Failed to update content status:', data.message);
    }
    } catch (error) {
    console.error('Error updating content status:', error);
    }
}

// Handle content creation form submission - wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function () {
    // Check for approved content when dashboard loads
    checkApprovedContent();

    const contentForm = document.getElementById('contentCreationForm');
    if (contentForm) {
    contentForm.addEventListener('submit', function (e) {
        e.preventDefault();
        console.log('Form submission started');

        const form = document.getElementById('contentCreationForm');
        const formData = new FormData(form);

        // Add action type
        formData.append('action', 'submit_for_review');

        // Validate form before submission
        const requiredFields = ['campaignId', 'content_type', 'description', 'campaign_product'];
        const missingFields = [];

        for (const field of requiredFields) {
        if (!formData.get(field)) {
            missingFields.push(field);
        }
        }

        // Check if media files are selected
        const mediaFiles = form.querySelector('#contentMedia').files;
        console.log('Media files selected:', mediaFiles);
        console.log('Media files length:', mediaFiles ? mediaFiles.length : 0);
        if (!mediaFiles || mediaFiles.length === 0) {
        missingFields.push('media_files');
        }

        // Check if platforms are selected
        const platformCheckboxes = form.querySelectorAll('input[name="platforms"]:checked');
        if (platformCheckboxes.length === 0) {
        missingFields.push('platforms');
        }

        if (missingFields.length > 0) {
        alert('Please fill in all required fields: ' + missingFields.join(', '));
        return;
        }

        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        submitBtn.disabled = true;

        console.log('Submitting form data...');
        console.log('FormData contents:');
        for (let [key, value] of formData.entries()) {
        console.log(key, value);
        }

        fetch('/influencer/content/create', {
        method: 'POST',
        body: formData
        })
        .then(response => {
            console.log('Response received:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('Response data:', data);
            if (data.success) {
            alert('Content submitted for review successfully!');
            closeContentCreationModal();
            location.reload();
            } else {
            alert('Error: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while submitting content: ' + error.message);
        })
        .finally(() => {
            // Restore button state
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        });
    });
    } else {
    console.warn('Content creation form not found');
    }
});

// Update the toggleRequests function
function toggleRequests() {
    const requestsSection = document.getElementById('collaborationRequests');
    const viewRequestsBtn = document.querySelector('.view-requests-btn');

    if (requestsSection.style.display === 'none') {
    requestsSection.style.display = 'block';
    viewRequestsBtn.textContent = 'Hide Requests';
    } else {
    requestsSection.style.display = 'none';
    viewRequestsBtn.textContent = 'View Requests';
    }
}

// ========================================
// FUNCTIONALITY 3: COLLABORATION REQUEST HANDLING
// ========================================
// Asynchronous collaboration request acceptance
// - Sends acceptance request to server via POST
// - Handles success/error responses with Promise chains
// - Refreshes page on successful acceptance
// - Provides user feedback for all scenarios
// - Manages UI state updates after request processing
function acceptRequest(requestId) {
    // Implement accept request functionality
    fetch(`/influencer/requests/${requestId}/accept`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
        // Refresh the page or update the UI
        location.reload();
        } else {
        alert('Failed to accept request: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while accepting the request');
    });
}

let currentCollabId = null;
const viewDetailsModal = document.getElementById('viewDetailsModal');
const updateProgressModal = document.getElementById('updateProgressModal');
const updateMetricsForm = document.getElementById('updateMetricsForm');
const closeButtons = document.getElementsByClassName('close');
const progressSlider = document.getElementById('progressSlider');
const progressValue = document.getElementById('progressValue');
const saveProgressBtn = document.getElementById('saveProgress');

// Input elements for metrics
const reachInput = document.getElementById('reachInput');
const clicksInput = document.getElementById('clicksInput');
const performanceScoreInput = document.getElementById('performanceScoreInput');
const conversionsInput = document.getElementById('conversionsInput');
const engagementRateInput = document.getElementById('engagementRateInput');
const impressionsInput = document.getElementById('impressionsInput');
const revenueInput = document.getElementById('revenueInput');
const roiInput = document.getElementById('roiInput');

// Close modals when clicking X
Array.from(closeButtons).forEach(button => {
    button.onclick = function () {
    viewDetailsModal.style.display = 'none';
    updateProgressModal.style.display = 'none';
    }
});

// Close modals when clicking outside
window.onclick = function (event) {
    if (event.target == viewDetailsModal) {
    viewDetailsModal.style.display = 'none';
    }
    if (event.target == updateProgressModal) {
    updateProgressModal.style.display = 'none';
    }
}

// Function to close update progress modal
window.closeUpdateProgressModal = function () {
    updateProgressModal.style.display = 'none';
}

// Update progress value display when slider changes
if (progressSlider) {
    progressSlider.addEventListener('input', function () {
    progressValue.textContent = this.value + '%';
    });
}

// ========================================
// FUNCTIONALITY 3: COLLABORATION DETAILS RETRIEVAL
// ========================================
// Asynchronous collaboration details retrieval with dynamic modal population
// - Fetches collaboration details from server via GET request
// - Handles network errors and response validation
// - Dynamically builds HTML content using template literals
// - Populates modal with fetched collaboration data
// - Manages modal state and content updates
function viewCollabDetails(collabId) {
    currentCollabId = collabId;
    fetch(`/influencer/collab/${collabId}`)
    .then(response => {
        if (!response.ok) {
        throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
        const details = data.collab;
        const detailsHtml = `
            <div class="campaign-info">
            <div class="campaign-header">
                <img src="${details.brand_logo}" alt="${details.brand_name}" class="brand-logo">
                <h3>${details.campaign_name}</h3>
                <p class="brand-name">${details.brand_name}</p>
            </div>
            <div class="campaign-metrics">
                <div class="metric">
                <span class="label">Progress:</span>
                <span class="value">${details.progress}%</span>
                </div>
                <div class="metric">
                <span class="label">Duration:</span>
                <span class="value">${details.duration} days</span>
                </div>
                <div class="metric">
                <span class="label">Budget:</span>
                <span class="value">$${details.budget.toLocaleString()}</span>
                </div>
                <div class="metric">
                <span class="label">Engagement Rate:</span>
                <span class="value">${details.engagement_rate}%</span>
                </div>
            </div>
            <div class="campaign-description">
                <h4>Description</h4>
                <p>${details.description}</p>
            </div>
            <div class="campaign-dates">
                <div class="date">
                <span class="label">Start Date:</span>
                <span class="value">${new Date(details.start_date).toLocaleDateString()}</span>
                </div>
                <div class="date">
                <span class="label">End Date:</span>
                <span class="value">${new Date(details.end_date).toLocaleDateString()}</span>
                </div>
            </div>
            ${details.status === 'active' ? `
            <div class="campaign-purchase-link" style="margin: 12px 0;">
                <a href="/customer/campaign/${details.campaign_id || details._id}/shop" target="_blank" rel="noopener noreferrer"
                    style="display:inline-block;background:#0d6efd;color:#fff;padding:8px 14px;border-radius:8px;text-decoration:none;">
                <i class="fas fa-link" style="margin-right:6px;"></i>Open Purchase Page
                </a>
                <div style="font-size:12px;color:#6c757d;margin-top:6px;">This link is available only while the campaign is active.</div>
            </div>
            ` : ''}
            <div class="campaign-performance">
                <h4>Performance Metrics</h4>
                <div class="metrics-grid">
                <div class="metric">
                    <span class="label">Performance Score:</span>
                    <span class="value">${details.performance_score || 0}%</span>
                </div>
                <div class="metric">
                    <span class="label">Reach:</span>
                    <span class="value">${details.reach.toLocaleString()}</span>
                </div>
                <div class="metric">
                    <span class="label">Clicks:</span>
                    <span class="value">${details.clicks.toLocaleString()}</span>
                </div>
                <div class="metric">
                    <span class="label">Conversions:</span>
                    <span class="value">${details.conversions.toLocaleString()}</span>
                </div>
                </div>
            </div>
            ${details.deliverables && details.deliverables.length > 0 ? `
                <div class="campaign-deliverables">
                <h4>Deliverables</h4>
                <div class="deliverables-list">
                    ${details.deliverables.map(deliverable => `
                    <div class="deliverable-item">
                        <h5>${deliverable.title || 'Untitled Deliverable'}</h5>
                        <p>${deliverable.description || 'No description available'}</p>
                        <div class="deliverable-status">
                        <span class="status-badge ${deliverable.status || 'pending'}">${deliverable.status || 'pending'}</span>
                        <span class="due-date">Due: ${new Date(deliverable.due_date).toLocaleDateString()}</span>
                        </div>
                    </div>
                    `).join('')}
                </div>
                </div>
            ` : ''}
            </div>
        `;
        document.getElementById('campaignDetails').innerHTML = detailsHtml;
        viewDetailsModal.style.display = 'block';
        } else {
        throw new Error(data.message || 'Failed to load campaign details');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error loading campaign details: ' + error.message);
    });
}

// ========================================
// FUNCTIONALITY 4: PROGRESS & METRICS UPDATE SYSTEM
// ========================================

// Update Progress & Prefill Metrics
function updateCollabProgress(collabId) {
    currentCollabId = collabId;
    const collabCard = document.querySelector(`[data-collab-id="${collabId}"]`);
    if (!collabCard) {
    console.error('Collaboration card not found');
    return;
    }

    const progressText = collabCard.querySelector('.progress-info span:last-child');
    const currentProgress = parseInt(progressText.textContent) || 0;

    // Set minimum value to prevent decrementing below current progress
    progressSlider.min = currentProgress;
    progressSlider.value = currentProgress;
    progressValue.textContent = `${currentProgress}%`;

    // Fetch current metrics and pre-fill inputs
    fetch(`/influencer/collab/${collabId}/details`)
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    })
    .then(data => {
        if (data.success) {
        const details = data.collab;
        reachInput.value = details.reach || 0;
        clicksInput.value = details.clicks || 0;
        performanceScoreInput.value = details.performance_score || 0;
        conversionsInput.value = details.conversions || 0;
        engagementRateInput.value = details.engagement_rate || 0;
        impressionsInput.value = details.impressions || 0;
        revenueInput.value = details.revenue || 0;
        roiInput.value = details.roi || 0;
        } else {
        reachInput.value = 0;
        clicksInput.value = 0;
        performanceScoreInput.value = 0;
        conversionsInput.value = 0;
        engagementRateInput.value = 0;
        impressionsInput.value = 0;
        revenueInput.value = 0;
        roiInput.value = 0;
        }
        updateProgressModal.style.display = 'block';
    })
    .catch(error => {
        console.error('Error fetching collab details:', error);
        reachInput.value = 0;
        clicksInput.value = 0;
        performanceScoreInput.value = 0;
        conversionsInput.value = 0;
        engagementRateInput.value = 0;
        impressionsInput.value = 0;
        revenueInput.value = 0;
        roiInput.value = 0;
        updateProgressModal.style.display = 'block';
    });
}

// Save Progress & Metrics
updateMetricsForm.onsubmit = async function (event) {
    event.preventDefault();

    // Validate percentage fields (0–100)
    const percentageFields = [
    { name: 'Performance Score', value: parseFloat(performanceScoreInput.value) },
    { name: 'Engagement Rate', value: parseFloat(engagementRateInput.value) }
    ];
    for (const field of percentageFields) {
    if (field.value < 0 || field.value > 100) {
        alert(`${field.name} must be between 0 and 100.`);
        return;
    }
    }

    // Validate ROI
    if (parseFloat(roiInput.value) < 0) {
    alert('ROI must be 0 or greater.');
    return;
    }

    if (!currentCollabId) {
    console.error('No collaboration ID selected');
    return;
    }

    try {
    const response = await fetch(`/influencer/collab/${currentCollabId}/update-progress`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify({
        progress: parseInt(progressSlider.value),
        reach: parseInt(reachInput.value),
        clicks: parseInt(clicksInput.value),
        performance_score: parseFloat(performanceScoreInput.value),
        conversions: parseInt(conversionsInput.value),
        engagement_rate: parseFloat(engagementRateInput.value),
        impressions: parseInt(impressionsInput.value),
        revenue: parseFloat(revenueInput.value),
        roi: parseFloat(roiInput.value)
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
        alert('Failed to update progress: ' + errorData.message);
        return;
    }

    const data = await response.json();

    if (data.success) {
        // Fetch updated details and refresh UI
        fetch(`/influencer/collab/${currentCollabId}/details`)
        .then(response => response.json())
        .then(updateData => {
            if (updateData.success) {
            const details = updateData.collab;
            const collabCard = document.querySelector(`[data-collab-id="${currentCollabId}"]`);
            if (collabCard) {
                const progressBar = collabCard.querySelector('.progress');
                const progressText = collabCard.querySelector('.progress-info span:last-child');
                const reachValue = collabCard.querySelector('.analytics-row:nth-child(1) .analytics-item:nth-child(1) .value');
                const clicksValue = collabCard.querySelector('.analytics-row:nth-child(1) .analytics-item:nth-child(2) .value');
                const conversionsValue = collabCard.querySelector('.analytics-row:nth-child(1) .analytics-item:nth-child(3) .value');
                const performanceScoreValue = collabCard.querySelector('.analytics-row:nth-child(2) .analytics-item:nth-child(1) .value');
                const engagementRateValue = collabCard.querySelector('.analytics-row:nth-child(2) .analytics-item:nth-child(2) .value');
                const impressionsValue = collabCard.querySelector('.analytics-row:nth-child(3) .analytics-item:nth-child(1) .value');
                const revenueValue = collabCard.querySelector('.analytics-row:nth-child(3) .analytics-item:nth-child(2) .value');
                const roiValue = collabCard.querySelector('.analytics-row:nth-child(3) .analytics-item:nth-child(3) .value');

                if (progressBar && progressText) {
                progressBar.style.width = `${details.progress || 0}%`;
                progressText.textContent = `${details.progress || 0}%`;
                }
                if (reachValue) reachValue.textContent = (details.reach || 0).toLocaleString();
                if (clicksValue) clicksValue.textContent = (details.clicks || 0).toLocaleString();
                if (conversionsValue) conversionsValue.textContent = (details.conversions || 0).toLocaleString();
                if (performanceScoreValue) performanceScoreValue.textContent = (details.performance_score || 0) + '%';
                if (engagementRateValue) engagementRateValue.textContent = (details.engagement_rate || 0) + '%';
                if (impressionsValue) impressionsValue.textContent = (details.impressions || 0).toLocaleString();
                if (revenueValue) revenueValue.textContent = '$' + (details.revenue || 0).toLocaleString();
                if (roiValue) roiValue.textContent = (details.roi || 0) + '%';
            }
            }
        })
        .catch(error => {
            console.error('Error fetching updated data:', error);
        });

        // Close modal and show success message
        updateProgressModal.style.display = 'none';
        alert('Progress and metrics updated successfully!');
    } else {
        alert('Failed to update progress: ' + data.message);
    }
    } catch (error) {
    console.error('Error updating progress:', error);
    alert('An error occurred while updating progress');
    }
};

// Update progress value live display (with validation)
progressSlider.oninput = function () {
    const minValue = parseInt(this.min) || 0;
    const currentValue = parseInt(this.value);

    if (currentValue < minValue) {
    this.value = minValue;
    }

    progressValue.textContent = `${this.value}%`;
};

function cancelRequest(requestId) {
    if (confirm('Are you sure you want to cancel this request?')) {
    fetch(`/influencer/requests/${requestId}/cancel`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(data => {
        if (data.success) {
            location.reload();
        } else {
            alert('Failed to cancel request: ' + data.message);
        }
        })
        .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while cancelling the request');
        });
    }
}

// Accept brand invite
async function acceptBrandInvite(inviteId, campaignTitle) {
    if (!confirm(`Accept invitation for "${campaignTitle}"?`)) {
    return;
    }

    try {
    const response = await fetch(`/influencer/brand-invites/${inviteId}/accept`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
        }
    });

    const data = await response.json();

    if (data.success) {
        alert('Invitation accepted successfully!');
        window.location.reload();
    } else {
        alert('Failed to accept invitation: ' + (data.message || 'Unknown error'));
    }
    } catch (error) {
    console.error('Error accepting invite:', error);
    alert('An error occurred while accepting the invitation. Please try again.');
    }
}

// Decline brand invite
async function declineBrandInvite(inviteId, campaignTitle) {
    if (!confirm(`Decline invitation for "${campaignTitle}"?\n\nThis action cannot be undone.`)) {
    return;
    }

    try {
    const response = await fetch(`/influencer/brand-invites/${inviteId}/decline`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
        }
    });

    const data = await response.json();

    if (data.success) {
        alert('Invitation declined.');
        window.location.reload();
    } else {
        alert('Failed to decline invitation: ' + (data.message || 'Unknown error'));
    }
    } catch (error) {
    console.error('Error declining invite:', error);
    alert('An error occurred while declining the invitation. Please try again.');
    }
}

// Cancel sent request
async function cancelSentRequest(requestId, campaignTitle) {
    if (!confirm(`Cancel your request for "${campaignTitle}"?\n\nThis action cannot be undone.`)) {
    return;
    }

    try {
    const response = await fetch(`/influencer/sent-requests/${requestId}/cancel`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
        }
    });

    const data = await response.json();

    if (data.success) {
        alert('Request cancelled successfully.');
        window.location.reload();
    } else {
        alert('Failed to cancel request: ' + (data.message || 'Unknown error'));
    }
    } catch (error) {
    console.error('Error cancelling request:', error);
    alert('An error occurred while cancelling the request. Please try again.');
    }
}

// Copy shop URL to clipboard
async function copyShopUrl(campaignId) {
    const urlInput = document.getElementById(`shopUrl_${campaignId}`);

    try {
    await navigator.clipboard.writeText(urlInput.value);

    // Show success feedback
    const copyBtn = urlInput.nextElementSibling;
    const originalIcon = copyBtn.innerHTML;
    copyBtn.innerHTML = '<i class="fas fa-check"></i>';
    copyBtn.style.backgroundColor = '#28a745';

    // Reset after 2 seconds
    setTimeout(() => {
        copyBtn.innerHTML = originalIcon;
        copyBtn.style.backgroundColor = '';
    }, 2000);

    } catch (error) {
    console.error('Failed to copy URL:', error);

    // Fallback for older browsers
    urlInput.select();
    urlInput.setSelectionRange(0, 99999);
    document.execCommand('copy');

    alert('Shop URL copied to clipboard!');
    }
}