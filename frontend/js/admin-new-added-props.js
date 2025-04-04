// Load property statistics and data when page loads
document.addEventListener('DOMContentLoaded', () => {
    fetchPropertyStats();
    fetchAllProperties();
    fetchSellersSummary();
});

function logout() {
    localStorage.removeItem('userData');
    localStorage.removeItem('userEmail');
    window.location.href = 'signIn.html';
}

// Fetch property statistics
async function fetchPropertyStats() {
    try {
        const response = await fetch('http://localhost:5000/api/admin/property-stats');
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('totalCount').textContent = data.stats.total;
            document.getElementById('residentialCount').textContent = data.stats.total;
            document.getElementById('commercialCount').textContent = data.stats.commercial;
        }
    } catch (error) {
        console.error('Error fetching property stats:', error);
    }
}

// Fetch location statistics
async function fetchLocationStats() {
    try {
        const response = await fetch('http://localhost:5000/api/admin/location-stats');
        const data = await response.json();
        
        if (data.success) {
            const locationGrid = document.getElementById('locationGrid');
            locationGrid.innerHTML = '';
            
            data.locations.forEach(loc => {
                const card = createLocationCard(loc);
                locationGrid.appendChild(card);
            });
        }
    } catch (error) {
        console.error('Error fetching location stats:', error);
    }
}

// Create location card
function createLocationCard(location) {
    const card = document.createElement('div');
    card.className = 'location-card';
    card.innerHTML = `
        <h3>${location.name}</h3>
        <p>${location.count}</p>
    `;
    return card;
}

// Fetch all properties
async function fetchAllProperties() {
    try {
        const response = await fetch('http://localhost:5000/api/admin/all-properties');
        const data = await response.json();
        
        if (data.success) {
            const propertiesGrid = document.getElementById('propertiesGrid');
            propertiesGrid.innerHTML = '';
            
            data.properties.forEach(property => {
                const card = createPropertyCard(property);
                propertiesGrid.appendChild(card);
            });
        }
    } catch (error) {
        console.error('Error fetching properties:', error);
    }
}

// Create property card
function createPropertyCard(property) {
    const card = document.createElement('div');
    card.className = 'property-card';
    card.innerHTML = `
        <img src="${property.imageLink}" alt="${property.propertyType}" class="property-image">
        <div class="property-details">
            <h3 class="property-title">${property.propertyType}</h3>
            <p class="property-location">${property.address}</p>
            <p class="property-price">₹${property.price.toLocaleString()}</p>
            <p class="property-author">Posted by: ${property.sellerId.fullName}</p>
            <p class="property-email">Contact: ${property.sellerId.email}</p>
            <div class="property-actions">
                <button class="delete-btn" onclick="confirmDelete('${property._id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `;
    return card;
}

// Edit property
async function editProperty(propertyId) {
    try {
        const response = await fetch(`http://localhost:5000/api/admin/property/${propertyId}`);
        const data = await response.json();
        
        if (data.success) {
            showEditModal(data.property);
        }
    } catch (error) {
        console.error('Error fetching property details:', error);
    }
}

// Show edit modal
function showEditModal(property) {
    const modal = document.getElementById('editPropertyModal');
    const form = document.getElementById('editPropertyForm');
    
    // Populate form fields
    form.innerHTML = `
        <input type="hidden" name="propertyId" value="${property._id}">
        <div class="form-group">
            <label>Property Type</label>
            <input type="text" name="propertyType" value="${property.propertyType}">
        </div>
        // ...Add other form fields...
        <button type="submit">Update Property</button>
    `;
    
    modal.style.display = 'block';
}

// Handle form submission
document.getElementById('editPropertyForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    // Handle form submission logic
});

// Modify the confirmDelete function
function confirmDelete(propertyId) {
    const modal = document.getElementById('deleteModal');
    const confirmBtn = document.getElementById('confirmDelete');
    const cancelBtn = document.getElementById('cancelDelete');
    
    modal.style.display = 'block';
    
    // Remove any existing event listeners
    confirmBtn.replaceWith(confirmBtn.cloneNode(true));
    cancelBtn.replaceWith(cancelBtn.cloneNode(true));
    
    // Get the new buttons
    const newConfirmBtn = document.getElementById('confirmDelete');
    const newCancelBtn = document.getElementById('cancelDelete');
    
    // Add new event listeners
    newConfirmBtn.addEventListener('click', async () => {
        try {
            // Changed to use the correct endpoint URL
            const response = await fetch(`http://localhost:5000/api/selling-properties/${propertyId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                modal.style.display = 'none';
                // Show success message
                alert('Property deleted successfully');
                // Refresh the properties list
                fetchAllProperties();
                // Refresh the stats
                fetchPropertyStats();
            } else {
                alert('Failed to delete property: ' + data.message);
            }
        } catch (error) {
            console.error('Error deleting property:', error);
            alert('Error deleting property. Please try again.');
        }
    });
    
    newCancelBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
}

// Close modals when clicking outside
window.onclick = (event) => {
    const modals = document.getElementsByClassName('modal');
    for (let modal of modals) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }
};

// Add new function to fetch and display sellers summary
async function fetchSellersSummary() {
    try {
        const response = await fetch('http://localhost:5000/api/admin/seller-properties-summary');
        const data = await response.json();
        
        if (data.success) {
            displaySellersSummary(data.summary);
        }
    } catch (error) {
        console.error('Error fetching sellers summary:', error);
    }
}

// Add function to display sellers summary
function displaySellersSummary(summary) {
    const tbody = document.querySelector('#sellersTable tbody');
    tbody.innerHTML = '';

    summary.forEach(seller => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${seller.sellerName}</td>
            <td>${seller.sellerEmail}</td>
            <td>${seller.totalProperties}</td>
            <td>${seller.propertyTypes.join(', ')}</td>
            <td>₹${seller.totalValue.toLocaleString()}</td>
        `;
        tbody.appendChild(row);
    });
}
