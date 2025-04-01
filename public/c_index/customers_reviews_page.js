// Sample collaborations data
const collaborations = [
    {
        id: 1,
        brand: "Nike",
        influencer: "John Fitness",
        title: "Summer Fitness Collection",
        description: "Showcasing the latest Nike fitness wear for summer 2025",
        category: "Fitness",
        status: "active",
        image: "nike.jpg",
        engagement: "50K likes, 1000 comments",
        platform: "Instagram",
        duration: "March 1 - July 31, 2025"
    },
    {
        id: 2,
        brand: "Sephora",
        influencer: "Beauty Queen",
        title: "Spring Makeup Tutorial Series",
        description: "Weekly makeup tutorials featuring Sephora products",
        category: "Beauty",
        status: "completed",
        image: "sephora.jpg",
        engagement: "100K views per video",
        platform: "YouTube",
        duration: "March 1 - May 31, 2024"
    }
    // Add more sample collaborations as needed
];

// Function to render collaborations
function renderCollabs(filteredCollabs) {
    const container = document.getElementById("collabs-container");
    container.innerHTML = filteredCollabs.length ?
        filteredCollabs.map(collab => `
            <div class="collab-card">
                <img src="${collab.image}" 
                     alt="${collab.title}" 
                     class="collab-image"
                     onerror="this.src='https://via.placeholder.com/300x200?text=Collaboration+Image'">
                <div class="collab-content">
                    <h3>${collab.title}</h3>
                    <div class="collab-details">
                        <p><strong>Brand:</strong> ${collab.brand}</p>
                        <p><strong>Influencer:</strong> ${collab.influencer}</p>
                        <p><strong>Category:</strong> ${collab.category}</p>
                        <p><strong>Platform:</strong> ${collab.platform}</p>
                        <p><strong>Engagement:</strong> ${collab.engagement}</p>
                        <p><strong>Duration:</strong> ${collab.duration}</p>
                    </div>
                    <button onclick="openReviewModal(${collab.id})" class="review-btn">
                        Leave Review
                    </button>
                </div>
            </div>
        `).join('')
        : "<p class='no-results'>No collaborations found.</p>";
}

// Filter collaborations
function filterCollabs() {
    const status = document.getElementById("collab-status").value;
    const searchTerm = document.getElementById("search").value.toLowerCase();

    const filteredCollabs = collaborations.filter(collab => {
        const matchesStatus = status === "all" || collab.status === status;
        const matchesSearch =
            collab.brand.toLowerCase().includes(searchTerm) ||
            collab.influencer.toLowerCase().includes(searchTerm) ||
            collab.title.toLowerCase().includes(searchTerm) ||
            collab.category.toLowerCase().includes(searchTerm);

        return matchesStatus && matchesSearch;
    });

    renderCollabs(filteredCollabs);
}

// Modal functions
function openReviewModal(collabId) {
    const collab = collaborations.find(c => c.id === collabId);
    if (collab) {
        document.getElementById("collabName").value = collab.title;
        document.getElementById("reviewModal").style.display = "block";
    }
}

function closeReviewModal() {
    document.getElementById("reviewModal").style.display = "none";
}

// Handle review submission
document.getElementById("reviewForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const review = {
        collabName: document.getElementById("collabName").value,
        rating: document.querySelector('input[name="rating"]:checked').value,
        reviewText: document.getElementById("reviewText").value
    };

    // Here you would typically send this to your backend
    console.log("Review submitted:", review);

    alert("Thank you for your review!");
    closeReviewModal();
});

// Event listeners
document.getElementById("search").addEventListener("input", filterCollabs);
document.getElementById("collab-status").addEventListener("change", filterCollabs);

// Initialize page
document.addEventListener("DOMContentLoaded", filterCollabs);

// Close modal when clicking outside
window.onclick = function (event) {
    if (event.target === document.getElementById("reviewModal")) {
        closeReviewModal();
    }
}
// Function to display campaigns based on filter
function filterCampaigns() {
    const status = document.getElementById("campaign-status").value;
    const container = document.getElementById("campaigns-container");
    container.innerHTML = ""; // Clear existing content

    campaigns.forEach((campaign) => {
        if (status === "all" || campaign.status === status) {
            const card = document.createElement("div");
            card.className = "campaign-card";
            card.innerHTML = `
                <h2>${campaign.name}</h2>
                <p><strong>Brand:</strong> ${campaign.brand}</p>
                <p><strong>Influencer:</strong> ${campaign.influencer}</p>
                <p><strong>Description:</strong> ${campaign.description}</p>
                <p><strong>Status:</strong> ${campaign.status}</p>
                <button onclick="openReviewModal('${campaign.id}')">Leave a Review</button>
            `;
            container.appendChild(card);
        }
    });
}

// Submit Review Form
document.getElementById('reviewForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const campaignName = document.getElementById('campaignName').value;
    const rating = document.getElementById('rating').value;
    const reviewText = document.getElementById('reviewText').value;

    // Save review (you can send this data to a backend API)
    console.log('Review Submitted:', { campaignName, rating, reviewText });

    // Close modal
    closeReviewModal();
    alert('Thank you for your review!');
});

// Display campaigns on page load
document.addEventListener("DOMContentLoaded", filterCampaigns);