let currentFeedbackId = null; // Track the currently viewed feedback ID

// View Feedback Details
async function viewFeedback(feedbackId) {
    try {
        currentFeedbackId = feedbackId;
        const response = await fetch(`/admin/feedback_and_moderation/${feedbackId}`);
        const feedback = await response.json();
        
        if (response.ok) {
            populateFeedbackModal(feedback);
            document.getElementById('feedback-modal').style.display = 'block';
        } else {
            alert('Error loading feedback details: ' + feedback.message);
        }
    } catch (error) {
        console.error('Error fetching feedback details:', error);
        alert('Error loading feedback details');
    }
}

function populateFeedbackModal(feedback) {
    document.getElementById('modal-user').textContent = feedback.userName || feedback.user || 'Anonymous';
    document.getElementById('modal-type').textContent = feedback.type || 'General';
    document.getElementById('modal-subject').textContent = feedback.subject || feedback.title || 'No Subject';
    document.getElementById('modal-date').textContent = feedback.createdAt ? new Date(feedback.createdAt).toLocaleDateString() : feedback.date || 'N/A';
    document.getElementById('modal-status').textContent = feedback.status || 'pending';
    document.getElementById('modal-message').textContent = feedback.message || feedback.content || 'No message content';
    
    // Show/hide resolve button based on status
    const resolveBtn = document.getElementById('modal-resolve-btn');
    if (feedback.status === 'resolved') {
        resolveBtn.style.display = 'none';
    } else {
        resolveBtn.style.display = 'inline-block';
    }
}

// Resolve Feedback
async function resolveFeedback(feedbackId) {
    if (confirm('Are you sure you want to mark this feedback as resolved?')) {
        try {
            const response = await fetch(`/admin/feedback_and_moderation/${feedbackId}/resolve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                alert('Feedback marked as resolved!');
                window.location.reload();
            } else {
                alert('Error: ' + (result.message || 'Failed to resolve feedback'));
            }
        } catch (error) {
            console.error('Error resolving feedback:', error);
            alert('Error resolving feedback. Please try again.');
        }
    }
}

// Resolve from modal
async function resolveFeedbackFromModal() {
    if (!currentFeedbackId) return;
    
    if (confirm('Are you sure you want to mark this feedback as resolved?')) {
        try {
            const response = await fetch(`/admin/feedback_and_moderation/${currentFeedbackId}/resolve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                alert('Feedback marked as resolved!');
                closeFeedbackModal();
                window.location.reload();
            } else {
                alert('Error: ' + (result.message || 'Failed to resolve feedback'));
            }
        } catch (error) {
            console.error('Error resolving feedback:', error);
            alert('Error resolving feedback. Please try again.');
        }
    }
}

// Delete Feedback
async function deleteFeedback(feedbackId) {
    if (confirm('Are you sure you want to delete this feedback? This action cannot be undone.')) {
        try {
            const response = await fetch(`/admin/feedback_and_moderation/${feedbackId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                alert('Feedback deleted successfully!');
                window.location.reload();
            } else {
                alert('Error: ' + (result.message || 'Failed to delete feedback'));
            }
        } catch (error) {
            console.error('Error deleting feedback:', error);
            alert('Error deleting feedback. Please try again.');
        }
    }
}

// Filter Functions
function filterFeedback() {
    const searchTerm = document.getElementById('search-feedback')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('status-filter')?.value || 'all';
    const typeFilter = document.getElementById('type-filter')?.value || 'all';
    const dateFilter = document.getElementById('date-filter')?.value;
    
    const rows = document.querySelectorAll('.feedback-table tbody tr');
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length === 0) return;
        
        const text = row.textContent.toLowerCase();
        const status = cells[5]?.textContent.toLowerCase() || '';
        const type = cells[2]?.textContent.toLowerCase() || '';
        const date = cells[4]?.textContent || '';
        
        let show = true;
        
        // Search filter
        if (searchTerm && !text.includes(searchTerm)) {
            show = false;
        }
        
        // Status filter
        if (statusFilter !== 'all' && !status.includes(statusFilter)) {
            show = false;
        }
        
        // Type filter
        if (typeFilter !== 'all' && !type.includes(typeFilter.replace('_', ' '))) {
            show = false;
        }
        
        // Date filter
        if (dateFilter && !date.includes(dateFilter)) {
            show = false;
        }
        
        row.style.display = show ? '' : 'none';
    });
}

function resetFilters() {
    document.getElementById('search-feedback').value = '';
    document.getElementById('status-filter').value = 'all';
    document.getElementById('type-filter').value = 'all';
    document.getElementById('date-filter').value = '';
    
    filterFeedback();
}

// Close Feedback Modal
function closeFeedbackModal() {
    document.getElementById('feedback-modal').style.display = 'none';
    currentFeedbackId = null;
}


// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Add filter functionality
    const searchInput = document.getElementById('search-feedback');
    const statusFilter = document.getElementById('status-filter');
    const typeFilter = document.getElementById('type-filter');
    const dateFilter = document.getElementById('date-filter');
    const resetBtn = document.getElementById('reset-filters');
    
    if (searchInput) searchInput.addEventListener('input', filterFeedback);
    if (statusFilter) statusFilter.addEventListener('change', filterFeedback);
    if (typeFilter) typeFilter.addEventListener('change', filterFeedback);
    if (dateFilter) dateFilter.addEventListener('change', filterFeedback);
    if (resetBtn) resetBtn.addEventListener('click', resetFilters);
    
    // Modal event listeners
    const modal = document.getElementById('feedback-modal');
    const closeBtn = document.querySelector('.close');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeFeedbackModal);
    }
    
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeFeedbackModal();
        }
    });
});