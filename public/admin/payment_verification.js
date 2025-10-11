let sortColumn = "id";
let sortDirection = "asc";

// Fetch Transactions from Backend
async function fetchTransactions() {
    try {
        const response = await fetch("/payment_verification");
        const transactions = await response.json();
        renderTransactions(transactions);
    } catch (error) {
        console.error("Error fetching transactions:", error);
    }
}

// Render Transactions
function renderTransactions(transactions) {
    const tableBody = document.querySelector("#payment-table tbody");
    tableBody.innerHTML = "";

    transactions.forEach(transaction => {
        const row = document.createElement("tr");
        row.innerHTML = `
        <td>${transaction.id}</td>
        <td>${transaction.brand}</td>
        <td>${transaction.influencer}</td>
        <td>${transaction.amount}</td>
        <td>${transaction.payment_date}</td>
        <td><span class="status ${transaction.status}">${transaction.status}</span></td>
        <td>${transaction.payment_method}</td>
        <td>${transaction.collab_type}</td>
        <td>${transaction.influencer_category}</td>
        <td class="actions">
          <button class="view" onclick="viewTransaction(${transaction.id})">View</button>
        </td>
      `;
        tableBody.appendChild(row);
    });
}

// View Payment Details
let currentPaymentId = null;

async function viewPayment(transactionId) {
    try {
        currentPaymentId = transactionId;
        const response = await fetch(`/admin/payment_verification/${transactionId}`);
        const payment = await response.json();
        
        if (response.ok) {
            populatePaymentModal(payment);
            document.getElementById('payment-modal').style.display = 'block';
        } else {
            alert('Error loading payment details: ' + payment.message);
        }
    } catch (error) {
        console.error('Error fetching payment details:', error);
        alert('Error loading payment details');
    }
}

function populatePaymentModal(payment) {
    document.getElementById('modal-transaction-id').textContent = payment.transactionId || payment.id;
    document.getElementById('modal-brand').textContent = payment.brand || 'N/A';
    document.getElementById('modal-influencer').textContent = payment.influencer || 'N/A';
    document.getElementById('modal-amount').textContent = payment.amount ? `$${payment.amount.toLocaleString()}` : 'N/A';
    document.getElementById('modal-payment-method').textContent = payment.paymentMethod || payment.payment_method || 'N/A';
    document.getElementById('modal-date').textContent = payment.date || payment.payment_date || 'N/A';
    document.getElementById('modal-status').textContent = payment.status || 'N/A';
    document.getElementById('modal-collab-type').textContent = payment.collabType || payment.collab_type || 'N/A';
    document.getElementById('modal-description').textContent = payment.description || 'No description available';
    
    // Show/hide action buttons based on status
    const approveBtn = document.getElementById('modal-approve-btn');
    const rejectBtn = document.getElementById('modal-reject-btn');
    
    if (payment.status === 'pending') {
        approveBtn.style.display = 'inline-block';
        rejectBtn.style.display = 'inline-block';
    } else {
        approveBtn.style.display = 'none';
        rejectBtn.style.display = 'none';
    }
}

// Approve Payment
async function approvePayment(transactionId) {
    if (confirm('Are you sure you want to approve this payment?')) {
        await updatePaymentStatus(transactionId, 'approved');
    }
}

// Reject Payment
async function rejectPayment(transactionId) {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason && confirm('Are you sure you want to reject this payment?')) {
        await updatePaymentStatus(transactionId, 'rejected', reason);
    }
}

// Approve from modal
async function approvePaymentFromModal() {
    if (!currentPaymentId) return;
    
    if (confirm('Are you sure you want to approve this payment?')) {
        await updatePaymentStatus(currentPaymentId, 'approved');
        closePaymentModal();
    }
}

// Reject from modal
async function rejectPaymentFromModal() {
    if (!currentPaymentId) return;
    
    const reason = prompt('Please provide a reason for rejection:');
    if (reason && confirm('Are you sure you want to reject this payment?')) {
        await updatePaymentStatus(currentPaymentId, 'rejected', reason);
        closePaymentModal();
    }
}

// Update Payment Status
async function updatePaymentStatus(transactionId, status, reason = null) {
    try {
        const response = await fetch('/admin/payment_verification/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                id: transactionId, 
                status: status,
                reason: reason
            })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            alert(`Payment #${transactionId} ${status} successfully!`);
            window.location.reload(); // Refresh the page to show updated data
        } else {
            alert('Error: ' + (result.message || `Failed to ${status} payment`));
        }
    } catch (error) {
        console.error('Error updating payment:', error);
        alert('Error updating payment. Please try again.');
    }
}

// Close Payment Modal
function closePaymentModal() {
    document.getElementById('payment-modal').style.display = 'none';
    currentPaymentId = null;
}

// Modal event listeners
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('payment-modal');
    const closeBtn = document.querySelector('.close');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closePaymentModal);
    }
    
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closePaymentModal();
        }
    });
    
    // Add filter functionality
    addFilterFunctionality();
});

// Add filter functionality
function addFilterFunctionality() {
    const searchInput = document.getElementById('search-payments');
    const statusFilter = document.getElementById('status-filter');
    const methodFilter = document.getElementById('payment-method-filter');
    const collabFilter = document.getElementById('collab-type-filter');
    const categoryFilter = document.getElementById('influencer-category-filter');
    const startDateFilter = document.getElementById('start-date-filter');
    const endDateFilter = document.getElementById('end-date-filter');
    const resetBtn = document.getElementById('reset-filters');
    
    if (searchInput) searchInput.addEventListener('input', filterPayments);
    if (statusFilter) statusFilter.addEventListener('change', filterPayments);
    if (methodFilter) methodFilter.addEventListener('change', filterPayments);
    if (collabFilter) collabFilter.addEventListener('change', filterPayments);
    if (categoryFilter) categoryFilter.addEventListener('change', filterPayments);
    if (startDateFilter) startDateFilter.addEventListener('change', filterPayments);
    if (endDateFilter) endDateFilter.addEventListener('change', filterPayments);
    if (resetBtn) resetBtn.addEventListener('click', resetFilters);
}

function filterPayments() {
    const searchTerm = document.getElementById('search-payments')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('status-filter')?.value || 'all';
    const methodFilter = document.getElementById('payment-method-filter')?.value || 'all';
    const collabFilter = document.getElementById('collab-type-filter')?.value || 'all';
    const categoryFilter = document.getElementById('influencer-category-filter')?.value || 'all';
    const startDate = document.getElementById('start-date-filter')?.value;
    const endDate = document.getElementById('end-date-filter')?.value;
    
    const rows = document.querySelectorAll('.payment-table tbody tr');
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length === 0) return;
        
        const text = row.textContent.toLowerCase();
        const status = cells[5]?.textContent.toLowerCase() || '';
        const date = cells[1]?.textContent || '';
        
        let show = true;
        
        // Search filter
        if (searchTerm && !text.includes(searchTerm)) {
            show = false;
        }
        
        // Status filter
        if (statusFilter !== 'all' && !status.includes(statusFilter)) {
            show = false;
        }
        
        // Date filters
        if (startDate && date < startDate) {
            show = false;
        }
        if (endDate && date > endDate) {
            show = false;
        }
        
        row.style.display = show ? '' : 'none';
    });
}

function resetFilters() {
    document.getElementById('search-payments').value = '';
    document.getElementById('status-filter').value = 'all';
    document.getElementById('payment-method-filter').value = 'all';
    document.getElementById('collab-type-filter').value = 'all';
    document.getElementById('influencer-category-filter').value = 'all';
    document.getElementById('start-date-filter').value = '';
    document.getElementById('end-date-filter').value = '';
    
    filterPayments();
}

// Initialize page
// fetchTransactions(); // Comment out if data is already loaded from server