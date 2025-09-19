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
        const response = await fetch("/admin/user_management");
        const data = await response.json();
        renderUserTables(data);
    } catch (error) {
        console.error("Error fetching user data:", error);
    }
}

function renderUserTables(data) {
    const influencerList = document.getElementById("verifyInfluencerList");
    const brandList = document.getElementById("verifyBrandList");

    if (influencerList) {
        influencerList.innerHTML = "";
        data.influencers.forEach(influencer => {
            const id = influencer._id || influencer.id;
            influencerList.innerHTML += `
                <tr>
                    <td>${influencer.name || influencer.displayName || 'N/A'}</td>
                    <td>${influencer.email || 'N/A'}</td>
                    <td>${influencer.category || influencer.businessCategory || 'N/A'}</td>
                    <td>${influencer.social_handles || influencer.socialHandles || 'N/A'}</td>
                    <td>
                        <button class="btn-view-profile" onclick="viewInfluencerProfile('${id}')">View Profile</button>
                    </td>
                </tr>
            `;
        });
    }

    if (brandList) {
        brandList.innerHTML = "";
        data.brands.forEach(brand => {
            const id = brand._id || brand.id;
            brandList.innerHTML += `
                <tr>
                    <td>${brand.brandName || brand.name || 'N/A'}</td>
                    <td>${brand.email || 'N/A'}</td>
                    <td>${brand.website || 'N/A'}</td>
                    <td>${brand.industry || brand.businessCategory || brand.category || 'N/A'}</td>
                    <td>${brand.totalAudience ? brand.totalAudience.toLocaleString() : '0'}</td>
                    <td>
                        <button class="btn-view-profile" onclick="viewBrandProfile('${id}')">View Profile</button>
                    </td>
                </tr>
            `;
        });
    }
}

async function approveUser(id, userType) {
    try {
        console.log('Approving user:', { id, userType });
        const response = await fetch(`/admin/user_management/approve/${id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userType })
        });

        console.log('Response status:', response.status);
        const responseData = await response.json();
        console.log('Response data:', responseData);

        if (response.ok && responseData.success) {
            // Remove the approved row from the table
            removeApprovedRow(id);
            alert(`${userType.charAt(0).toUpperCase() + userType.slice(1)} approved successfully!`);
        } else {
            alert(`Error: ${responseData.message || 'Failed to approve user'}`);
        }
    } catch (error) {
        console.error("Error approving user:", error);
        alert("Error approving user. Please try again.");
    }
}

async function approveInfluencer(id) {
    await approveUser(id, 'influencer');
}

async function approveBrand(id) {
    await approveUser(id, 'brand');
}

// Function to remove the approved row from the table
function removeApprovedRow(id) {
    // Find all table rows
    const rows = document.querySelectorAll('table tbody tr');

    rows.forEach(row => {
        // Find the approve button in this row
        const approveButton = row.querySelector('button[onclick*="approveInfluencer"], button[onclick*="approveBrand"]');

        if (approveButton) {
            // Extract the ID from the onclick attribute
            const onclickAttr = approveButton.getAttribute('onclick');
            const idMatch = onclickAttr.match(/'([^']+)'/);

            if (idMatch && idMatch[1] === id) {
                // Remove this row from the table
                row.remove();
                console.log('Removed approved row with ID:', id);
            }
        }
    });
}

// Modal functionality for brand profiles
let currentBrandId = null;

async function viewBrandProfile(brandId) {
    try {
        currentBrandId = brandId;
        const response = await fetch(`/admin/user_management/brand/${brandId}`);
        const brand = await response.json();

        if (response.ok) {
            populateBrandProfileModal(brand);
            document.getElementById('brandProfileModal').style.display = 'block';
        } else {
            alert('Error loading brand profile: ' + brand.message);
        }
    } catch (error) {
        console.error('Error fetching brand profile:', error);
        alert('Error loading brand profile');
    }
}

function populateBrandProfileModal(brand) {
    const content = document.getElementById('brandProfileContent');
    const title = document.getElementById('brandModalTitle');
    const approveBtn = document.getElementById('approveBrandBtn');

    title.textContent = `${brand.brandName || brand.name} - Profile`;

    // Show/hide approve button based on verification status
    if (brand.verified) {
        approveBtn.style.display = 'none';
    } else {
        approveBtn.style.display = 'inline-block';
    }

    content.innerHTML = `
        <div class="profile-section">
            <h3>Basic Information</h3>
            <div class="profile-field">
                <label>Brand Name:</label>
                <span>${brand.brandName || brand.name || 'N/A'}</span>
            </div>
            <div class="profile-field">
                <label>Email:</label>
                <span>${brand.email || 'N/A'}</span>
            </div>
            <div class="profile-field">
                <label>Phone:</label>
                <span>${brand.phone || 'N/A'}</span>
            </div>
            <div class="profile-field">
                <label>Industry:</label>
                <span>${brand.industry || 'N/A'}</span>
            </div>
            <div class="profile-field">
                <label>Website:</label>
                <span>${brand.website ? `<a href="${brand.website}" target="_blank">${brand.website}</a>` : 'N/A'}</span>
            </div>
            <div class="profile-field">
                <label>Total Audience:</label>
                <span>${brand.totalAudience ? brand.totalAudience.toLocaleString() : '0'}</span>
            </div>
            <div class="profile-field">
                <label>Bio:</label>
                <span>${brand.bio || 'No bio provided'}</span>
            </div>
            <div class="profile-field">
                <label>Mission:</label>
                <span>${brand.mission || 'No mission statement'}</span>
            </div>
        </div>

        <div class="profile-section">
            <h3>Business Details</h3>
            <div class="profile-field">
                <label>Categories:</label>
                <span>${brand.categories && brand.categories.length > 0 ? brand.categories.join(', ') : 'None specified'}</span>
            </div>
            <div class="profile-field">
                <label>Languages:</label>
                <span>${brand.languages && brand.languages.length > 0 ? brand.languages.join(', ') : 'None specified'}</span>
            </div>
            <div class="profile-field">
                <label>Location:</label>
                <span>${brand.location || 'Not specified'}</span>
            </div>
            <div class="profile-field">
                <label>Member Since:</label>
                <span>${brand.createdAt ? new Date(brand.createdAt).toLocaleDateString() : 'N/A'}</span>
            </div>
        </div>
    `;
}

function closeBrandProfileModal() {
    document.getElementById('brandProfileModal').style.display = 'none';
    currentBrandId = null;
}

async function approveBrandFromModal() {
    if (!currentBrandId) return;

    try {
        const response = await fetch(`/admin/user_management/approve/${currentBrandId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userType: 'brand' })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            alert('Brand approved successfully!');
            closeBrandProfileModal();
            // Refresh the page to update the table
            window.location.reload();
        } else {
            alert('Error: ' + (result.message || 'Failed to approve brand'));
        }
    } catch (error) {
        console.error('Error approving brand:', error);
        alert('Error approving brand. Please try again.');
    }
}

// Modal functionality for influencer profiles
let currentInfluencerId = null;

async function viewInfluencerProfile(influencerId) {
    try {
        currentInfluencerId = influencerId;
        const response = await fetch(`/admin/user_management/influencer/${influencerId}`);
        const influencer = await response.json();

        if (response.ok) {
            populateInfluencerProfileModal(influencer);
            document.getElementById('influencerProfileModal').style.display = 'block';
        } else {
            alert('Error loading influencer profile: ' + influencer.message);
        }
    } catch (error) {
        console.error('Error fetching influencer profile:', error);
        alert('Error loading influencer profile');
    }
}

function populateInfluencerProfileModal(influencer) {
    const content = document.getElementById('influencerProfileContent');
    const title = document.getElementById('influencerModalTitle');
    const approveBtn = document.getElementById('approveInfluencerBtn');

    title.textContent = `${influencer.displayName || influencer.fullName || 'Influencer'} - Profile`;

    // Show/hide approve button based on verification status
    if (influencer.verified) {
        approveBtn.style.display = 'none';
    } else {
        approveBtn.style.display = 'inline-block';
    }

    content.innerHTML = `
        <div class="profile-section">
            <h3>Basic Information</h3>
            <div class="profile-field">
                <label>Full Name:</label>
                <span>${influencer.fullName || 'N/A'}</span>
            </div>
            <div class="profile-field">
                <label>Display Name:</label>
                <span>${influencer.displayName || 'N/A'}</span>
            </div>
            <div class="profile-field">
                <label>Email:</label>
                <span>${influencer.email || 'N/A'}</span>
            </div>
            <div class="profile-field">
                <label>Phone:</label>
                <span>${influencer.phone || 'N/A'}</span>
            </div>
            <div class="profile-field">
                <label>Niche:</label>
                <span>${influencer.niche || 'N/A'}</span>
            </div>
            <div class="profile-field">
                <label>About:</label>
                <span>${influencer.about || 'No description provided'}</span>
            </div>
            <div class="profile-field">
                <label>Bio:</label>
                <span>${influencer.bio || 'No bio provided'}</span>
            </div>
        </div>

        <div class="profile-section">
            <h3>Professional Details</h3>
            <div class="profile-field">
                <label>Categories:</label>
                <span>${influencer.categories && influencer.categories.length > 0 ? influencer.categories.join(', ') : 'None specified'}</span>
            </div>
            <div class="profile-field">
                <label>Languages:</label>
                <span>${influencer.languages && influencer.languages.length > 0 ? influencer.languages.join(', ') : 'None specified'}</span>
            </div>
            <div class="profile-field">
                <label>Location:</label>
                <span>${influencer.location || 'Not specified'}</span>
            </div>
            <div class="profile-field">
                <label>Influence Regions:</label>
                <span>${influencer.influenceRegions || 'Not specified'}</span>
            </div>
            <div class="profile-field">
                <label>Primary Market:</label>
                <span>${influencer.primaryMarket || 'Not specified'}</span>
            </div>
            <div class="profile-field">
                <label>Member Since:</label>
                <span>${influencer.createdAt ? new Date(influencer.createdAt).toLocaleDateString() : 'N/A'}</span>
            </div>
        </div>
    `;
}

function closeInfluencerProfileModal() {
    document.getElementById('influencerProfileModal').style.display = 'none';
    currentInfluencerId = null;
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
async function approveInfluencerFromModal() {
    if (!currentInfluencerId) return;

    try {
        const response = await fetch(`/admin/user_management/approve/${currentInfluencerId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userType: 'influencer' })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            alert('Influencer approved successfully!');
            closeInfluencerProfileModal();
            // Refresh the page to update the table
            window.location.reload();
        } else {
            alert('Error: ' + (result.message || 'Failed to approve influencer'));
        }
    } catch (error) {
        console.error('Error approving influencer:', error);
        alert('Error approving influencer. Please try again.');
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const brandModal = document.getElementById('brandProfileModal');
    const influencerModal = document.getElementById('influencerProfileModal');

    if (event.target === brandModal) {
        closeBrandProfileModal();
    }

    if (event.target === influencerModal) {
        closeInfluencerProfileModal();
    }
}

fetchUserData();