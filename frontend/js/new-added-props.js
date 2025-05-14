// Import navbar related code from properties.js
// ...existing code for navbar functionality from properties.js...

// Add navbar functionality
function showLogoutModal() {
    document.getElementById('logoutModal').style.display = 'block';
}

function closeLogoutModal() {
    document.getElementById('logoutModal').style.display = 'none';
}

function confirmLogout() {
    window.location.href = 'index.html';
}

// Function to fetch newly added properties
async function fetchNewlyAddedProperties() {
    try {
        const response = await fetch('http://localhost:5000/api/newly-added-properties');
        const data = await response.json();
        
        if (data.success) {
            displayProperties(data.properties);
        } else {
            console.error('Error fetching properties:', data.message);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Function to display properties
function displayProperties(properties) {
    const container = document.querySelector('.properties-container');
    const template = document.getElementById('property-card-template');
    
    container.innerHTML = '';
    
    properties.forEach(property => {
        const propertyCard = template.content.cloneNode(true);
        
        // Set property image with error handling
        const img = propertyCard.querySelector('.property-image img');
        img.onerror = function() {
            this.src = '../images/default-property.jpg';
            this.alt = 'Property image not available';
        };
        img.src = property.imageUrl || '../images/default-property.jpg';
        img.alt = property.propertyType;
        
        // Set property details using propertyType and address
        propertyCard.querySelector('.property-title').textContent = 
            `${property.propertyType || 'Property'}`;
        propertyCard.querySelector('.property-location span').textContent = 
            property.location || 'Location not specified';
        
        // Set specifications with validation
        const specs = propertyCard.querySelectorAll('.property-specs .spec-item span');
        specs[0].textContent = `${property.bedrooms || 0} Beds`;
        specs[1].textContent = `${property.bathrooms || 0} Baths`;
        specs[2].textContent = `${property.area || 0} sq ft`;
        
        // Set amenities with validation
        const amenitiesContainer = propertyCard.querySelector('.property-amenities');
        amenitiesContainer.innerHTML = ''; // Clear existing amenities
        if (property.amenities && property.amenities.length > 0) {
            property.amenities.forEach(amenity => {
                const span = document.createElement('span');
                span.className = 'amenity-tag';
                span.innerHTML = `<i class="fas ${getAmenityIcon(amenity)}"></i> ${amenity}`;
                amenitiesContainer.appendChild(span);
            });
        } else {
            const span = document.createElement('span');
            span.className = 'amenity-tag';
            span.innerHTML = '<i class="fas fa-info-circle"></i> No amenities listed';
            amenitiesContainer.appendChild(span);
        }
        
        // Set seller info with fallback
        propertyCard.querySelector('.seller-name').textContent = 
            property.sellerName || 'Anonymous';
        
        // Set price with validation
        propertyCard.querySelector('.price').textContent = 
            property.price ? `₹${formatPrice(property.price)}` : 'Price on request';
        
        // Set view details link
        // const viewDetailsLink = propertyCard.querySelector('.view-details');
        // viewDetailsLink.href = `property-details.html?id=${property._id}`;

        const messageBtn = propertyCard.querySelector('.message-owner-btn');
        messageBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showMessageModal(property);  // Remove sellerId parameter
        });

        container.appendChild(propertyCard);
    });
}

// Helper function for price formatting
function formatPrice(price) {
    if (price >= 10000000) {
        return (price / 10000000).toFixed(2) + ' Cr';
    } else if (price >= 100000) {
        return (price / 100000).toFixed(2) + ' L';
    }
    return price.toLocaleString('en-IN');
}

// Helper function for amenity icons
function getAmenityIcon(amenity) {
    const iconMap = {
        'Swimming Pool': 'fa-swimming-pool',
        'Security': 'fa-shield-alt',
        'Park': 'fa-tree',
        'Sports Facility': 'fa-futbol',
        'Gym': 'fa-dumbbell',
        'Clubhouse': 'fa-building'
    };
    return iconMap[amenity] || 'fa-check-circle';
}

// Message modal functionality
function showMessageModal(property) {
    const modal = document.getElementById('messageModal');
    const modalImage = document.getElementById('modal-property-image');
    const modalTitle = document.getElementById('modal-property-title');
    const modalLocation = document.getElementById('modal-property-location');
    const modalPrice = document.getElementById('modal-property-price');

    // Set modal content
    modalImage.src = property.imageUrl || '../images/default-property.jpg';
    modalTitle.textContent = property.propertyType;
    modalLocation.textContent = property.location;
    modalPrice.textContent = property.price ? `₹${formatPrice(property.price)}` : 'Price on request';

    // Store complete property object for message sending
    modal.dataset.propertyId = property._id;
    modal.dataset.sellerId = property.sellerId._id; // Access the seller's ID from populated data

    modal.style.display = 'block';
}

// Get current user from localStorage
function getCurrentUser() {
    const userDataStr = localStorage.getItem('userData');
    if (!userDataStr) return null;
    try {
        return JSON.parse(userDataStr);
    } catch (err) {
        console.error('Error parsing user data:', err);
        return null;
    }
}

// Update the message form submission handler
document.getElementById('messageForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser._id) {
        alert('Please sign in to send messages');
        return;
    }

    const modal = document.getElementById('messageModal');
    const messageText = document.getElementById('messageText').value;
    const propertyId = modal.dataset.propertyId;
    const receiverId = modal.dataset.sellerId;

    if (!receiverId) {
        alert('Unable to identify property owner. Please try again.');
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                propertyId,
                senderId: currentUser._id,
                receiverId,
                message: messageText,
                propertyDetails: {
                    title: document.getElementById('modal-property-title').textContent,
                    location: document.getElementById('modal-property-location').textContent,
                    price: document.getElementById('modal-property-price').textContent,
                    imageUrl: document.getElementById('modal-property-image').src
                }
            })
        });

        const data = await response.json();
        if (data.success) {
            modal.style.display = 'none';
            document.getElementById('messageText').value = '';
            showSuccessModal();
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error details:', error);
        alert('Error sending message: ' + (error.message || 'Unknown error'));
    }
});

// Add success modal functionality
function showSuccessModal() {
    const successModal = document.getElementById('successModal');
    successModal.style.display = 'block';
}

// Add click handler for OK button
document.querySelector('.ok-btn').addEventListener('click', () => {
    document.getElementById('successModal').style.display = 'none';
});

// Close modal when clicking the close button or outside the modal
document.querySelector('.close-modal').addEventListener('click', () => {
    document.getElementById('messageModal').style.display = 'none';
});

// Update window click handler to include success modal
window.addEventListener('click', (e) => {
    const messageModal = document.getElementById('messageModal');
    const successModal = document.getElementById('successModal');
    if (e.target === messageModal) {
        messageModal.style.display = 'none';
    }
    if (e.target === successModal) {
        successModal.style.display = 'none';
    }
});

// Mobile menu functionality
document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.querySelector('.mobile-menu');
    const menuOverlay = document.querySelector('.menu-overlay');

    hamburger.addEventListener('click', () => {
        mobileMenu.style.left = '0';
        menuOverlay.style.display = 'block';
    });

    menuOverlay.addEventListener('click', () => {
        mobileMenu.style.left = '-100%';
        menuOverlay.style.display = 'none';
    });

    // Initialize the property fetching
    fetchNewlyAddedProperties();
});
