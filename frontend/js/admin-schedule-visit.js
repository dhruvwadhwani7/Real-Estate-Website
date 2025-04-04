document.addEventListener('DOMContentLoaded', () => {
    loadVisits();
    setupModalListeners();
});

function logout() {
    localStorage.removeItem('userData');
    localStorage.removeItem('userEmail');
    window.location.href = 'signIn.html';
}

let currentVisitId = null;

async function loadVisits() {
    try {
        const response = await fetch('http://localhost:5000/api/admin/property-visits');
        const data = await response.json();
        
        if (data.success) {
            updateVisitStats(data.visits);
            displayVisits(data.visits);
        }
    } catch (err) {
        console.error('Error loading visits:', err);
    }
}

function updateVisitStats(visits) {
    const pendingCount = visits.filter(v => v.status === 'pending').length;
    const approvedCount = visits.filter(v => v.status === 'approved').length;
    const queueCount = visits.filter(v => v.status === 'queue').length;

    document.getElementById('pendingCount').textContent = pendingCount;
    document.getElementById('approvedCount').textContent = approvedCount;
    document.getElementById('queueCount').textContent = queueCount;
}

function displayVisits(visits) {
    const grid = document.getElementById('visitsGrid');
    grid.innerHTML = '';

    visits.forEach(visit => {
        const card = createVisitCard(visit);
        grid.appendChild(card);
    });
}

function createVisitCard(visit) {
    const card = document.createElement('div');
    card.className = 'visit-card';
    
    const visitDate = new Date(visit.visitDetails.visitTime).toLocaleString();
    
    card.innerHTML = `
        <div class="visit-header">
            <h3>${visit.visitDetails.propertyName}</h3>
            <span class="visit-status status-${visit.status}">${visit.status}</span>
        </div>
        <div class="visit-details">
            <p><strong>Visitor:</strong> ${visit.visitDetails.name}</p>
            <p><strong>Email:</strong> ${visit.visitDetails.email}</p>
            <p><strong>Location:</strong> ${visit.visitDetails.location}</p>
            <p><strong>Scheduled Time:</strong> ${visitDate}</p>
        </div>
        <div class="visit-actions">
            <button class="status-btn" onclick="openStatusModal('${visit._id}')">
                Update Status
            </button>
            <button class="delete-btn" onclick="openDeleteModal('${visit._id}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    return card;
}

function setupModalListeners() {
    // Status Modal
    const statusModal = document.getElementById('statusModal');
    document.querySelector('#statusModal .close').onclick = () => statusModal.style.display = 'none';
    document.getElementById('cancelUpdate').onclick = () => statusModal.style.display = 'none';
    document.getElementById('updateStatus').onclick = updateVisitStatus;

    // Delete Modal
    const deleteModal = document.getElementById('deleteModal');
    document.getElementById('cancelDelete').onclick = () => deleteModal.style.display = 'none';
    document.getElementById('confirmDelete').onclick = deleteVisit;
}

function openStatusModal(visitId) {
    currentVisitId = visitId;
    document.getElementById('statusModal').style.display = 'block';
}

function openDeleteModal(visitId) {
    currentVisitId = visitId;
    document.getElementById('deleteModal').style.display = 'block';
}

async function updateVisitStatus() {
    const status = document.getElementById('statusSelect').value;
    
    try {
        const response = await fetch(`http://localhost:5000/api/admin/property-visits/${currentVisitId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });

        const data = await response.json();
        if (data.success) {
            document.getElementById('statusModal').style.display = 'none';
            loadVisits();
        }
    } catch (err) {
        console.error('Error updating visit status:', err);
    }
}

async function deleteVisit() {
    try {
        const response = await fetch(`http://localhost:5000/api/admin/property-visits/${currentVisitId}`, {
            method: 'DELETE'
        });

        const data = await response.json();
        if (data.success) {
            document.getElementById('deleteModal').style.display = 'none';
            loadVisits();
        }
    } catch (err) {
        console.error('Error deleting visit:', err);
    }
}
