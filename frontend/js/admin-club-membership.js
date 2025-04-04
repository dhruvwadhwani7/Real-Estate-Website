document.addEventListener('DOMContentLoaded', function() {
    fetchMembershipStats();
    fetchMembershipEnquiries();
    setupModalListeners();
});

function logout() {
    localStorage.removeItem('userData');
    localStorage.removeItem('userEmail');
    window.location.href = 'signIn.html';
}

const API_BASE_URL = 'http://localhost:5000/api'; // Update this to match your server port

function fetchMembershipStats() {
    fetch(`${API_BASE_URL}/admin/club-membership-stats`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            updateStatsDisplay(data.stats);
        } else {
            console.error('Failed to fetch stats:', data.message);
        }
    })
    .catch(err => {
        console.error('Error fetching stats:', err);
        displayErrorMessage('Failed to load membership statistics');
    });
}

function updateStatsDisplay(stats) {
    document.getElementById('totalEnquiries').textContent = stats.total || 0;
    document.getElementById('golfEnquiries').textContent = stats.golfClub || 0;
    document.getElementById('healthEnquiries').textContent = stats.healthCentre || 0;
    document.getElementById('sportsEnquiries').textContent = stats.sportsCentre || 0;
    document.getElementById('clubhouseEnquiries').textContent = stats.clubHouse || 0;
}

function fetchMembershipEnquiries() {
    fetch(`${API_BASE_URL}/admin/club-memberships`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            displayMembershipEnquiries(data.memberships);
        } else {
            console.error('Failed to fetch memberships:', data.message);
        }
    })
    .catch(err => {
        console.error('Error fetching memberships:', err);
        displayErrorMessage('Failed to load membership applications');
    });
}

function displayMembershipEnquiries(memberships) {
    const grid = document.getElementById('membershipEnquiriesGrid');
    grid.innerHTML = '';

    memberships.forEach(membership => {
        const card = createMembershipCard(membership);
        grid.appendChild(card);
    });
}

function createMembershipCard(membership) {
    const card = document.createElement('div');
    card.className = 'enquiry-card';
    
    const isApproved = membership.status === 'approved';
    const buttonText = isApproved ? 'Not Approve' : 'Approve';
    const nextStatus = isApproved ? 'not_approved' : 'approved';
    
    card.innerHTML = `
        <div class="club-details">
            <h3>${membership.clubName}</h3>
            <p><strong>Applicant:</strong> ${membership.name}</p>
            <p><strong>Email:</strong> ${membership.email}</p>
            <p><strong>Membership Type:</strong> 
                <span class="membership-type ${membership.membershipType.toLowerCase()}">
                    ${membership.membershipType}
                </span>
            </p>
            <p><strong>Status:</strong> 
                <span class="status-badge ${membership.status}">
                    ${membership.status.replace('_', ' ')}
                </span>
            </p>
            <p><strong>Plan:</strong> ${membership.planDetails.price}</p>
        </div>
        <div class="actions-container">
            <button class="approve-btn ${membership.status}"
                    onclick="updateStatus('${membership._id}', '${nextStatus}')">
                ${buttonText}
            </button>
            <button class="delete-btn" onclick="showDeleteModal('${membership._id}')">
                <i class="fas fa-trash"></i> Delete
            </button>
        </div>
    `;
    return card;
}

function updateStatus(membershipId, status) {
    fetch(`${API_BASE_URL}/admin/club-memberships/${membershipId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
    })
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    })
    .then(data => {
        if (data.success) {
            fetchMembershipEnquiries();
            fetchMembershipStats();
            const actionMsg = status === 'approved' ? 'approved' : 'unapproved';
            showNotification(`Membership successfully ${actionMsg}`, 'success');
        }
    })
    .catch(err => {
        console.error('Error updating status:', err);
        showNotification('Failed to update membership status', 'error');
    });
}

function showNotification(message, type) {
    // Add notification implementation if needed
    alert(message);
}

function setupModalListeners() {
    const modal = document.getElementById('deleteModal');
    const closeBtn = document.querySelector('.close');
    const cancelBtn = document.getElementById('cancelDelete');

    closeBtn.onclick = () => modal.style.display = 'none';
    cancelBtn.onclick = () => modal.style.display = 'none';
    
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}

let currentMembershipId = null;

function showDeleteModal(membershipId) {
    currentMembershipId = membershipId;
    const modal = document.getElementById('deleteModal');
    modal.style.display = 'block';

    document.getElementById('confirmDelete').onclick = () => {
        deleteMembership(currentMembershipId);
        modal.style.display = 'none';
    };
}

function deleteMembership(membershipId) {
    fetch(`${API_BASE_URL}/admin/club-memberships/${membershipId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            fetchMembershipEnquiries();
            fetchMembershipStats();
        } else {
            console.error('Failed to delete membership:', data.message);
        }
    })
    .catch(err => {
        console.error('Error deleting membership:', err);
        alert('Failed to delete membership application');
    });
}

// Add error message display functionality
function displayErrorMessage(message) {
    const grid = document.getElementById('membershipEnquiriesGrid');
    grid.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <p>${message}</p>
        </div>
    `;
}


