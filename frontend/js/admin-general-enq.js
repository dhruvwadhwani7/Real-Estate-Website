document.addEventListener('DOMContentLoaded', function() {
    loadEnquiriesData();
    setupEventListeners();
});
function logout() {
    localStorage.removeItem('userData');
    localStorage.removeItem('userEmail');
    window.location.href = 'signIn.html';
}

let currentEnquiryToDelete = null;

async function loadEnquiriesData() {
    try {
        const response = await fetch('http://localhost:5000/api/admin/general-enquiries');
        const data = await response.json();

        if (data.success) {
            updateStatistics(data.enquiries);
            displayEnquiries(data.enquiries);
        }
    } catch (err) {
        console.error('Error loading enquiries:', err);
    }
}

function updateStatistics(enquiries) {
    const total = enquiries.length;
    const property = enquiries.filter(e => e.type === 'property').length;
    const residential = enquiries.filter(e => e.type === 'residential').length;

    document.getElementById('totalEnquiries').textContent = total;
    document.getElementById('propertyEnquiries').textContent = property;
    document.getElementById('residentialEnquiries').textContent = residential;
}

// Update the display function to use validation
function displayEnquiries(enquiries) {
    const propertyGrid = document.getElementById('propertyEnquiriesGrid');
    const residentialGrid = document.getElementById('residentialEnquiriesGrid');

    propertyGrid.innerHTML = '';
    residentialGrid.innerHTML = '';

    enquiries.forEach(enquiry => {
        const validatedEnquiry = validateEnquiryData(enquiry);
        const card = createEnquiryCard(validatedEnquiry);
        if (enquiry.type === 'property') {
            propertyGrid.appendChild(card);
        } else {
            residentialGrid.appendChild(card);
        }
    });
}

// Add this utility function to validate property data
function validateEnquiryData(enquiry) {
    const propertyDetails = enquiry.propertyDetails || {};
    return {
        ...enquiry,
        propertyDetails: {
            ...propertyDetails,
            propertyType: enquiry.type === 'property' 
                ? (propertyDetails.propertyType || 'Property')
                : (propertyDetails.propertyType || 'Residential Property'),
            imageUrl: propertyDetails.imageUrl || '../../img/default-property.jpg',
            location: propertyDetails.location || 'Location not specified'
        }
    };
}

function createEnquiryCard(enquiry) {
    // Enhanced validation of property details
    const propertyDetails = enquiry.propertyDetails || {};
    const propertyType = enquiry.type === 'property' 
        ? (propertyDetails.propertyType || 'Property')
        : (propertyDetails.propertyType || 'Residential Property');
        
    const imageUrl = propertyDetails.imageUrl || '../../img/default-property.jpg';
    const location = propertyDetails.location || 'Location not specified';

    const card = document.createElement('div');
    card.className = 'enquiry-card';
    
    card.innerHTML = `
        <div class="enquiry-header">
            <h3>${propertyType}</h3>
            <button class="delete-btn" onclick="showDeleteModal('${enquiry._id}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        <div class="enquiry-image-container">
            <img src="${imageUrl}" 
                alt="${propertyType}" 
                class="enquiry-property-image"
                onerror="this.src='../../img/default-property.jpg'"
            >
        </div>
        <div class="enquiry-details">
            <p><strong>Property Type:</strong> ${propertyType}</p>
            <p><strong>Location:</strong> ${location}</p>
            <p><strong>Enquiry Type:</strong> ${enquiry.type.charAt(0).toUpperCase() + enquiry.type.slice(1)}</p>
            <p><strong>Enquiry By:</strong> ${enquiry.name}</p>
            <p><strong>Email:</strong> ${enquiry.email}</p>
            <p><strong>Contact Location:</strong> ${enquiry.location}</p>
            <p><strong>Date:</strong> ${new Date(enquiry.createdAt).toLocaleDateString()}</p>
            ${enquiry.message ? `<p><strong>Message:</strong> ${enquiry.message}</p>` : ''}
        </div>
    `;

    // Add error handler for image
    const img = card.querySelector('.enquiry-property-image');
    img.addEventListener('error', function() {
        this.src = '../../img/default-property.jpg';
    });

    return card;
}

function setupEventListeners() {
    const modal = document.getElementById('deleteModal');
    const closeBtn = modal.querySelector('.close');
    const cancelBtn = document.getElementById('cancelDelete');
    const confirmBtn = document.getElementById('confirmDelete');

    closeBtn.onclick = hideDeleteModal;
    cancelBtn.onclick = hideDeleteModal;
    confirmBtn.onclick = deleteEnquiry;

    window.onclick = (event) => {
        if (event.target === modal) {
            hideDeleteModal();
        }
    };
}

function showDeleteModal(enquiryId) {
    currentEnquiryToDelete = enquiryId;
    document.getElementById('deleteModal').style.display = 'block';
}

function hideDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    currentEnquiryToDelete = null;
}

async function deleteEnquiry() {
    if (!currentEnquiryToDelete) return;

    try {
        const response = await fetch(`http://localhost:5000/api/admin/general-enquiries/${currentEnquiryToDelete}`, {
            method: 'DELETE'
        });

        const data = await response.json();
        if (data.success) {
            hideDeleteModal();
            loadEnquiriesData();
        }
    } catch (err) {
        console.error('Error deleting enquiry:', err);
    }
}

// function logout() {
//     // Implement logout logic
//     window.location.href = 'login.html';
// }
