// View Collaboration Details
async function viewCollabDetails(collabId) {
    try {
        const response = await fetch(`/admin/collaboration_monitoring/${collabId}`);
        const collab = await response.json();
        
        if (response.ok) {
            alert(`Collaboration Details:\n\nBrand: ${collab.brand}\nInfluencer: ${collab.influencer}\nStatus: ${collab.status}\nStart Date: ${collab.startDate}\nEnd Date: ${collab.endDate}\nEngagement Rate: ${collab.engagementRate}%\nReach: ${collab.reach}\nDescription: ${collab.description || 'No description'}`);
        } else {
            alert('Error loading collaboration details');
        }
    } catch (error) {
        console.error('Error fetching collaboration details:', error);
        alert('Error loading collaboration details');
    }
}

// Approve Collaboration
async function approveCollab(collabId) {
    if (confirm('Are you sure you want to approve this collaboration?')) {
        try {
            const response = await fetch(`/admin/collaboration_monitoring/${collabId}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                alert('Collaboration approved successfully!');
                window.location.reload();
            } else {
                alert('Error: ' + (result.message || 'Failed to approve collaboration'));
            }
        } catch (error) {
            console.error('Error approving collaboration:', error);
            alert('Error approving collaboration. Please try again.');
        }
    }
}

// Modal functionality for collaboration details
let currentCollabId = null;

async function openCollabModal(collabId) {
    try {
        currentCollabId = collabId;
        const response = await fetch(`/admin/collaboration_monitoring/${collabId}`);
        const collab = await response.json();
        
        if (response.ok) {
            populateCollabModal(collab);
            document.getElementById('collab-modal').style.display = 'block';
        } else {
            alert('Error loading collaboration details');
        }
    } catch (error) {
        console.error('Error fetching collaboration details:', error);
        alert('Error loading collaboration details');
    }
}

function populateCollabModal(collab) {
    // Basic Information
    document.getElementById('modal-collab-id').textContent = `Collaboration Details #${collab.id || 'N/A'}`;
    document.getElementById('modal-collab-number').textContent = collab.id || 'N/A';
    document.getElementById('modal-brand').textContent = collab.brand || 'N/A';
    document.getElementById('modal-influencer').textContent = collab.influencer || 'N/A';
    
    // Status with styling
    const statusElement = document.getElementById('modal-status');
    const status = collab.status || 'N/A';
    statusElement.textContent = status;
    statusElement.className = `status-badge status-${status.toLowerCase()}`;
    
    // Dates
    document.getElementById('modal-start-date').textContent = collab.startDate ? 
        new Date(collab.startDate).toLocaleDateString() : 'N/A';
    document.getElementById('modal-end-date').textContent = collab.endDate ? 
        new Date(collab.endDate).toLocaleDateString() : 'N/A';
    
    // Performance Metrics
    document.getElementById('modal-engagement').textContent = collab.engagementRate ? 
        collab.engagementRate + '%' : 'N/A';
    document.getElementById('modal-reach').textContent = collab.reach ? 
        collab.reach.toLocaleString() : 'N/A';
    
    // Description
    document.getElementById('modal-description').textContent = collab.description || 'No description available';
    
    // Additional Metrics
    document.getElementById('modal-impressions').textContent = collab.impressions ? 
        collab.impressions.toLocaleString() : '-';
    document.getElementById('modal-clicks').textContent = collab.clicks ? 
        collab.clicks.toLocaleString() : '-';
    document.getElementById('modal-conversions').textContent = collab.conversions ? 
        collab.conversions.toLocaleString() : '-';
    document.getElementById('modal-roi').textContent = collab.roi ? 
        collab.roi + '%' : '-';
    
    // Populate posts if available
    const postsContainer = document.getElementById('modal-posts');
    postsContainer.innerHTML = '';
    
    if (collab.posts && collab.posts.length > 0) {
        collab.posts.forEach(post => {
            const postDiv = document.createElement('div');
            postDiv.style.cssText = 'margin-bottom: 10px; padding: 8px; background: white; border-radius: 4px; border-left: 3px solid #007bff;';
            postDiv.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 4px;">${post.title || 'Untitled Post'}</div>
                <div style="font-size: 0.9em; color: #666; margin-bottom: 4px;">
                    <i class="fas fa-calendar"></i> ${post.date || 'No date'} | 
                    <i class="fas fa-heart"></i> ${post.engagement || 0} engagements
                </div>
                ${post.description ? `<div style="font-size: 0.85em; color: #888;">${post.description}</div>` : ''}
            `;
            postsContainer.appendChild(postDiv);
        });
    } else {
        postsContainer.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;"><i class="fas fa-info-circle"></i> No posts available for this collaboration</div>';
    }
    
    // Show/hide action buttons based on status
    const approveBtn = document.getElementById('modal-approve-btn');
    const rejectBtn = document.getElementById('modal-reject-btn');
    
    if (status.toLowerCase() === 'pending') {
        approveBtn.style.display = 'inline-block';
        rejectBtn.style.display = 'inline-block';
    } else {
        approveBtn.style.display = 'none';
        rejectBtn.style.display = 'none';
    }
}

function closeCollabModal() {
    document.getElementById('collab-modal').style.display = 'none';
    currentCollabId = null;
}

// Modal Action Functions
async function approveCollabFromModal() {
    if (!currentCollabId) {
        alert('No collaboration selected');
        return;
    }
    
    if (confirm('Are you sure you want to approve this collaboration?')) {
        try {
            const response = await fetch(`/admin/collaboration_monitoring/${currentCollabId}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                alert('Collaboration approved successfully!');
                closeCollabModal();
                window.location.reload();
            } else {
                alert('Error: ' + (result.message || 'Failed to approve collaboration'));
            }
        } catch (error) {
            console.error('Error approving collaboration:', error);
            alert('Error approving collaboration. Please try again.');
        }
    }
}

async function rejectCollabFromModal() {
    if (!currentCollabId) {
        alert('No collaboration selected');
        return;
    }
    
    const reason = prompt('Please provide a reason for rejection (optional):');
    
    if (confirm('Are you sure you want to reject this collaboration?')) {
        try {
            const response = await fetch(`/admin/collaboration_monitoring/${currentCollabId}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: reason || 'No reason provided' })
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                alert('Collaboration rejected successfully!');
                closeCollabModal();
                window.location.reload();
            } else {
                alert('Error: ' + (result.message || 'Failed to reject collaboration'));
            }
        } catch (error) {
            console.error('Error rejecting collaboration:', error);
            alert('Error rejecting collaboration. Please try again.');
        }
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('collab-modal');
    if (event.target === modal) {
        closeCollabModal();
    }
}

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const modal = document.getElementById('collab-modal');
        if (modal.style.display === 'block') {
            closeCollabModal();
        }
    }
});

// Filter Functions
function filterCollaborations() {
    const searchTerm = document.getElementById('search-collabs')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('status-filter')?.value || 'all';
    const startDate = document.getElementById('start-date-filter')?.value;
    const endDate = document.getElementById('end-date-filter')?.value;
    
    const collabCards = document.querySelectorAll('.collab-card');
    
    collabCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        const status = card.querySelector('.status-badge')?.textContent.toLowerCase() || '';
        
        let show = true;
        
        // Search filter
        if (searchTerm && !text.includes(searchTerm)) {
            show = false;
        }
        
        // Status filter
        if (statusFilter !== 'all' && !status.includes(statusFilter)) {
            show = false;
        }
        
        // Date filters would need additional data attributes on cards
        
        card.style.display = show ? 'block' : 'none';
    });
}

function resetFilters() {
    document.getElementById('search-collabs').value = '';
    document.getElementById('status-filter').value = 'all';
    document.getElementById('start-date-filter').value = '';
    document.getElementById('end-date-filter').value = '';
    
    filterCollaborations();
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Add filter functionality
    const searchInput = document.getElementById('search-collabs');
    const statusFilter = document.getElementById('status-filter');
    const startDateFilter = document.getElementById('start-date-filter');
    const endDateFilter = document.getElementById('end-date-filter');
    const resetBtn = document.getElementById('reset-filters');
    
    if (searchInput) searchInput.addEventListener('input', filterCollaborations);
    if (statusFilter) statusFilter.addEventListener('change', filterCollaborations);
    if (startDateFilter) startDateFilter.addEventListener('change', filterCollaborations);
    if (endDateFilter) endDateFilter.addEventListener('change', filterCollaborations);
    if (resetBtn) resetBtn.addEventListener('click', resetFilters);
    
    // Modal event listeners
    const modal = document.getElementById('collab-modal');
    
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeCollabModal();
        }
    });
    
    // Add hover effects to collaboration cards
    const collabCards = document.querySelectorAll('.collab-card');
    collabCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            this.style.transform = 'translateY(-2px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
            this.style.transform = 'translateY(0)';
        });
    });
});