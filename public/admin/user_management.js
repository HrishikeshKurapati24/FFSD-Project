// Tab Switching Function
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');
    document.querySelector(`button[onclick="showTab('${tabId}')"]`).classList.add('active');
}

// ========================================
// FUNCTIONALITY 5: ADMIN DATA MANAGEMENT - USER DATA RETRIEVAL
// ========================================
// Asynchronous user data retrieval for admin panel
// - Fetches user data from server via GET request
// - Handles both influencers and brands data
// - Renders data into dynamic HTML tables
// - Provides error handling for failed requests
// - Manages data refresh and UI updates
async function fetchUserData() {
    try {
        const response = await fetch("/user_management");
        const data = await response.json();
        renderUserTables(data);
    } catch (error) {
        console.error("Error fetching user data:", error);
    }
}

function renderUserTables(data) {
    const influencerList = document.getElementById("verifyInfluencerList");
    const brandList = document.getElementById("verifyBrandList");

    influencerList.innerHTML = "";
    brandList.innerHTML = "";

    data.influencers.forEach(influencer => {
        influencerList.innerHTML += `
            <tr>
                <td>${influencer.name}</td>
                <td>${influencer.email}</td>
                <td>${influencer.category}</td>
                <td>${influencer.social_handles}</td>
                <td>
                    <button onclick="approveUser(${influencer.id}, 'influencer')">Approve</button>
                </td>
            </tr>
        `;
    });

    data.brands.forEach(brand => {
        brandList.innerHTML += `
            <tr>
                <td>${brand.name}</td>
                <td>${brand.email}</td>
                <td>${brand.website}</td>
                <td>${brand.category}</td>
                <td>
                    <button onclick="approveUser(${brand.id}, 'brand')">Approve</button>
                </td>
            </tr>
        `;
    });
}

// ========================================
// FUNCTIONALITY 5: ADMIN DATA MANAGEMENT - USER APPROVAL
// ========================================
// Asynchronous user approval with data refresh
// - Sends approval request to server via POST
// - Handles success/error responses asynchronously
// - Refreshes user data after successful approval
// - Provides user feedback for approval status
// - Manages UI updates and data synchronization
async function approveUser(id, userType) {
    try {
        await fetch("/user_management/approve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, userType })
        });
        fetchUserData();
        alert(`User #${id} approved successfully!`);
    } catch (error) {
        console.error("Error approving user:", error);
    }
}

fetchUserData();