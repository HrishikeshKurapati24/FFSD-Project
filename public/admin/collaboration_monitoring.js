// Fetch Collaborations from Backend
async function fetchCollaborations() {
    try {
        const response = await fetch("/collaboration_monitoring");
        const collaborations = await response.json();
        renderCollaborations(collaborations);
    } catch (error) {
        console.error("Error fetching collaborations:", error);
    }
}

// Render Collaborations
function renderCollaborations(collaborations) {
    const collabGrid = document.querySelector(".collab-grid");
    collabGrid.innerHTML = "";

    collaborations.forEach(collab => {
        const card = document.createElement("div");
        card.className = "collab-card";
        card.innerHTML = `
            <h3>${collab.brand} & ${collab.influencer}</h3>
            <p><strong>Start Date:</strong> ${collab.start_date}</p>
            <p><strong>End Date:</strong> ${collab.end_date}</p>
            <p><strong>Status:</strong> <span class="status ${collab.status}">${collab.status.replace("-", " ")}</span></p>
            <p><strong>Engagement Rate:</strong> ${collab.engagement_rate}%</p>
            <p><strong>Reach:</strong> ${collab.reach}</p>
            <div class="actions">
                <button class="view" onclick="viewCollaboration(${collab.id})">View</button>
                <button class="flag" onclick="flagCollaboration(${collab.id})">Flag</button>
            </div>
        `;
        collabGrid.appendChild(card);
    });
}

// Fetch and Display Collaborations on Page Load
fetchCollaborations();