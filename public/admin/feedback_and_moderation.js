let modalFeedbackId = null; // Track the currently viewed feedback ID

async function fetchFeedback() {
    try {
        const response = await fetch("/feedback_and_moderation");
        const feedbacks = await response.json();
        renderFeedback(feedbacks);
    } catch (error) {
        console.error("Error fetching feedback:", error);
    }
}

// Render Feedback
function renderFeedback(filteredFeedback) {
    const tableBody = document.querySelector("#feedback-table tbody");
    tableBody.innerHTML = "";

    filteredFeedback.forEach(feedback => {
        const row = document.createElement("tr");
        row.innerHTML = `
        <td>${feedback.id}</td>
        <td>${feedback.type}</td>
        <td>${feedback.user}</td>
        <td>${feedback.message}</td>
        <td><span class="status ${feedback.status}">${feedback.status}</span></td>
        <td>${feedback.date}</td>
        <td class="actions">
          <button class="view" onclick="viewFeedback(${feedback.id})">View</button>
        </td>
      `;
        tableBody.appendChild(row);
    });
}

// Filter Feedback
function filterFeedback() {
    const searchTerm = document.getElementById("search-feedback").value.toLowerCase();
    const typeFilter = document.getElementById("type-filter").value;
    const statusFilter = document.getElementById("status-filter").value;

    const filteredFeedback = feedbackList.filter(feedback => {
        const matchesSearch = feedback.user.toLowerCase().includes(searchTerm) ||
            feedback.message.toLowerCase().includes(searchTerm);
        const matchesType = typeFilter === "all" || feedback.type === typeFilter;
        const matchesStatus = statusFilter === "all" || feedback.status === statusFilter;

        return matchesSearch && matchesType && matchesStatus;
    });

    renderFeedback(filteredFeedback);
}

// Reset Filters
function resetFilters() {
    document.getElementById("search-feedback").value = "";
    document.getElementById("type-filter").value = "all";
    document.getElementById("status-filter").value = "all";
    filterFeedback(); // Re-render the full list
}

// View Feedback Details
function viewFeedback(feedbackId) {
    const feedback = feedbackList.find(f => f.id === feedbackId);
    if (feedback) {
        modalFeedbackId = feedbackId; // Track the currently viewed feedback
        document.getElementById("modal-feedback-id").textContent = `Feedback #${feedback.id}`;
        document.getElementById("modal-type").textContent = feedback.type;
        document.getElementById("modal-user").textContent = feedback.user;
        document.getElementById("modal-message").textContent = feedback.message;
        document.getElementById("modal-status").textContent = feedback.status;
        document.getElementById("modal-date").textContent = feedback.date;
        document.getElementById("feedback-modal").style.display = "block";
    }
}

// Resolve Feedback
function resolveFeedback(feedbackId) {
    const feedback = feedbackList.find(f => f.id === feedbackId);
    if (feedback) {
        feedback.status = "resolved";
        filterFeedback(); // Re-render the list
        alert(`Feedback #${feedback.id} resolved!`);
        document.getElementById("feedback-modal").style.display = "none";
    }
}

// Warn User
function warnUser(feedbackId) {
    const feedback = feedbackList.find(f => f.id === feedbackId);
    if (feedback) {
        alert(`User ${feedback.user} warned!`);
    }
}

// Ban User
function banUser(feedbackId) {
    const feedback = feedbackList.find(f => f.id === feedbackId);
    if (feedback) {
        alert(`User ${feedback.user} banned!`);
    }
}

// Close Modal
document.querySelector(".close").addEventListener("click", () => {
    document.getElementById("feedback-modal").style.display = "none";
});

// Close Modal When Clicking Outside
window.addEventListener("click", (event) => {
    const modal = document.getElementById("feedback-modal");
    if (event.target === modal) {
        modal.style.display = "none";
    }
});

// Attach Event Listeners to Filters
document.getElementById("search-feedback").addEventListener("input", filterFeedback);
document.getElementById("type-filter").addEventListener("change", filterFeedback);
document.getElementById("status-filter").addEventListener("change", filterFeedback);
document.getElementById("reset-filters").addEventListener("click", resetFilters);

fetchFeedback();

// Initial Render (Show All Feedback)
filterFeedback();