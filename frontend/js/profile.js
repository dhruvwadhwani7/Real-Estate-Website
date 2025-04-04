document.addEventListener('DOMContentLoaded', function() {
    // Function to fetch user data from API
    async function fetchUserData() {
        try {
            // Get user email from localStorage
            const userEmail = localStorage.getItem('userEmail');
            if (!userEmail) {
                window.location.href = 'signin.html';
                return;
            }

            const response = await fetch(`http://localhost:5000/api/user/${userEmail}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            
            if (data.success) {
                // Store user type in localStorage
                localStorage.setItem('userType', data.userData.userType);
                sessionStorage.setItem('userType', data.userData.userType);
                updateProfile(data.userData);
                
                // Load properties if user is a seller
                if (data.userData.userType === 'seller') {
                    loadUserProperties(data.userData._id);
                    loadUserMessages(data.userData._id);  // Add this line
                }
                
                // Load wishlist for all users
                loadUserWishlist(data.userData._id);
                // Add this line to load visit status
                loadVisitStatus(data.userData._id);
                // Add this line after other data loading calls
                loadMembershipNotifications(data.userData._id);
            } else {
                console.error('Failed to fetch user data:', data.message);
            }
        } catch (error) {
            console.error('There was a problem with the fetch operation:', error);
        }
    }

    // Function to update the profile information dynamically
    function updateProfile(userData) {
        document.getElementById('user-name').textContent = userData.fullName || 'N/A';
        document.getElementById('user-email').textContent = userData.email || 'N/A';
        document.getElementById('user-phone').textContent = userData.phone || 'N/A';
        document.getElementById('user-type').textContent = userData.userType || 'N/A';
    }

    // Function to load user's properties
    async function loadUserProperties(userId) {
        try {
            const response = await fetch(`http://localhost:5000/api/selling-properties/${userId}`);
            const data = await response.json();

            if (data.success) {
                const propertiesContainer = document.getElementById('user-properties');
                propertiesContainer.innerHTML = ''; // Clear existing properties
                
                if (data.properties.length === 0) {
                    propertiesContainer.innerHTML = '<p class="no-properties">No properties added yet.</p>';
                    return;
                }

                data.properties.forEach(property => {
                    const propertyCard = createPropertyCard(property);
                    propertiesContainer.appendChild(propertyCard);
                });
            }
        } catch (error) {
            console.error('Error loading properties:', error);
        }
    }

    async function loadUserMessages(userId) {
        try {
            const response = await fetch(`http://localhost:5000/api/messages/${userId}`);
            const data = await response.json();

            if (data.success) {
                const messagesContainer = document.getElementById('user-messages');
                messagesContainer.innerHTML = ''; // Clear existing messages
                
                if (data.messages.length === 0) {
                    messagesContainer.innerHTML = '<p class="no-messages">No messages received yet.</p>';
                    return;
                }

                data.messages.forEach(message => {
                    const messageCard = createMessageCard(message);
                    messagesContainer.appendChild(messageCard);
                });
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }

    function createMessageCard(message) {
        const messageDate = new Date(message.createdAt).toLocaleDateString();
        const messageCard = document.createElement('div');
        messageCard.className = 'message-card';

        const imageUrl = message.propertyDetails.imageUrl || '../images/placeholder-property.jpg';
        
        messageCard.innerHTML = `
            <div class="message-header">
                <div class="buyer-icon">
                    <i class="fas fa-user"></i>
                </div>
                <div class="buyer-details">
                    <div class="buyer-name">${message.senderId.fullName}</div>
                    <div class="message-date">${messageDate}</div>
                </div>
            </div>
            <div class="property-details">
                <div class="property-image">
                    <img src="${imageUrl}" alt="Property Image" 
                        onerror="this.src='../images/placeholder-property.jpg'">
                </div>
                <div class="property-info-message">
                    <h4>Property Details</h4>
                    <p class="property-type">${message.propertyDetails.propertyType}</p>
                    <p class="property-location">
                        <i class="fas fa-map-marker-alt"></i> 
                        ${message.propertyDetails.location}
                    </p>
                    <p class="property-price">₹${Number(message.propertyDetails.price).toLocaleString()}</p>
                </div>
            </div>
            <div class="message-content">
                <h4>Message:</h4>
                <p>${message.message}</p>
            </div>
        `;

        return messageCard;
    }

    function createPropertyCard(property) {
        const propertyCard = document.createElement('div');
        propertyCard.className = 'property-card';

        const amenitiesHtml = property.amenities
            .map(amenity => `<span class="amenity-tag">${amenity}</span>`)
            .join('');

        propertyCard.innerHTML = `
            <div class="property-image">
                <img src="${property.imageLink}" alt="${property.propertyType}">
            </div>
            <div class="property-info">
                <h3 class="property-title">${property.propertyType} - ${property.bhk}</h3>
                <div class="property-price">₹${Number(property.price).toLocaleString()}</div>
                <div class="property-location">
                    <i class="fas fa-map-marker-alt"></i>
                    ${property.address}
                </div>
                <div class="property-specs">
                    <div class="spec-item">
                        <i class="fas fa-bed"></i>
                        ${property.bedrooms} Beds
                    </div>
                    <div class="spec-item">
                        <i class="fas fa-bath"></i>
                        ${property.bathrooms} Baths
                    </div>
                    <div class="spec-item">
                        <i class="fas fa-vector-square"></i>
                        ${property.area} sq ft
                    </div>
                </div>
                <div class="property-amenities">
                    ${amenitiesHtml}
                </div>
            </div>
        `;

        return propertyCard;
    }

    // Add this after fetchUserData function
    async function loadMembershipNotifications(userId) {
        try {
            const response = await fetch(`http://localhost:5000/api/club-memberships/${userId}`);
            const data = await response.json();

            if (!data.success) {
                console.error('Failed to fetch membership data:', data.message);
                return;
            }

            const notificationsContainer = document.getElementById('membership-notifications');
            notificationsContainer.innerHTML = '';

            if (!data.memberships || data.memberships.length === 0) {
                return;
            }

            data.memberships.forEach(membership => {
                const notificationCard = createMembershipNotification(membership);
                notificationsContainer.appendChild(notificationCard);
            });
        } catch (error) {
            console.error('Error loading membership notifications:', error);
        }
    }

    function createMembershipNotification(membership) {
        const card = document.createElement('div');
        card.className = `notification-card ${membership.status}`;

        const statusText = membership.status.replace('_', ' ');
        const dateFormatted = new Date(membership.createdAt).toLocaleDateString();

        card.innerHTML = `
            <div class="notification-content">
                <div class="notification-title">
                    ${membership.clubName} Membership
                    <span class="notification-status ${membership.status}">${statusText}</span>
                </div>
                <div class="notification-details">
                    <p>Type: ${membership.membershipType} | Applied: ${dateFormatted}</p>
                </div>
            </div>
        `;

        return card;
    }

    // Fetch and update user data on page load
    fetchUserData();
});

// Add these functions at the end of the file
function showLogoutModal() {
    document.getElementById('logoutModal').style.display = 'block';
}

function closeLogoutModal() {
    document.getElementById('logoutModal').style.display = 'none';
}

function handleLogout() {
    // Clear all stored data
    localStorage.clear();
    sessionStorage.clear();
    
    // Redirect to home page
    window.location.href = 'home.html';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('logoutModal');
    if (event.target === modal) {
        closeLogoutModal();
    }
}

// Add this function to load wishlist
async function loadUserWishlist(userId) {
    try {
        const response = await fetch(`http://localhost:5000/api/wishlist/${userId}`);
        const data = await response.json();

        const wishlistContainer = document.getElementById('wishlist-properties');
        wishlistContainer.innerHTML = '';

        if (!data.success || data.wishlistItems.length === 0) {
            wishlistContainer.innerHTML = `
                <div class="empty-wishlist">
                    <i class="far fa-heart"></i>
                    <p>Your wishlist is empty. Start adding properties you love!</p>
                </div>
            `;
            return;
        }

        data.wishlistItems.forEach(item => {
            const propertyCard = createWishlistPropertyCard(item);
            wishlistContainer.appendChild(propertyCard);
        });
    } catch (error) {
        console.error('Error loading wishlist:', error);
    }
}

function createWishlistPropertyCard(item) {
    const card = document.createElement('div');
    card.className = 'property-card';

    card.innerHTML = `
        <div class="property-image">
            <img src="${item.propertyData.imageLink}" alt="Property">
        </div>
        <div class="property-info">
            <h3 class="property-title">${item.propertyData.type}</h3>
            <div class="property-price">₹${Number(item.propertyData.price).toLocaleString()}</div>
            <div class="property-location">
                <i class="fas fa-map-marker-alt"></i>
                ${item.propertyData.address}
            </div>
            <div class="property-specs">
                <div class="spec-item">
                    <i class="fas fa-bed"></i>
                    ${item.propertyData.bedrooms} Beds
                </div>
                <div class="spec-item">
                    <i class="fas fa-bath"></i>
                    ${item.propertyData.bathrooms} Baths
                </div>
                <div class="spec-item">
                    <i class="fas fa-vector-square"></i>
                    ${item.propertyData.area} sq ft
                </div>
            </div>
        </div>
        <div class="card-actions">
            <button class="remove-wishlist" onclick="removeFromWishlist('${item.propertyId}')">
                <i class="fas fa-trash"></i> Remove
            </button>
            <button class="view-property" onclick="viewProperty('${item.propertyId}')">
                <i class="fas fa-eye"></i> View
            </button>
        </div>
    `;

    return card;
}

// Add functions to handle wishlist actions
async function removeFromWishlist(propertyId) {
    try {
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (!userData || !userData._id) {
            alert('Please login to manage wishlist');
            return;
        }

        const response = await fetch('http://localhost:5000/api/wishlist', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: userData._id,
                propertyId: propertyId
            })
        });

        const data = await response.json();
        if (data.success) {
            loadUserWishlist(userData._id); // Reload wishlist
            alert('Property removed from wishlist');
        }
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        alert('Error removing property from wishlist');
    }
}

function viewProperty(propertyId) {
    window.location.href = `property-main.html?id=${propertyId}`;
}

// Add function to load visit status
async function loadVisitStatus(userId) {
    try {
        const response = await fetch(`http://localhost:5000/api/property-visits/${userId}`);
        const data = await response.json();

        const visitContainer = document.getElementById('visit-status-container');
        visitContainer.innerHTML = '';

        if (!data.success || data.visits.length === 0) {
            visitContainer.innerHTML = `
                <div class="empty-visits">
                    <i class="far fa-calendar"></i>
                    <p>No property visits scheduled yet.</p>
                </div>`;
            return;
        }

        data.visits.forEach(visit => {
            const visitCard = createVisitCard(visit);
            visitContainer.appendChild(visitCard);
        });
    } catch (error) {
        console.error('Error loading visit status:', error);
    }
}

function createVisitCard(visit) {
    const card = document.createElement('div');
    card.className = `visit-card ${visit.status}`;

    const visitDate = new Date(visit.visitDetails.visitTime).toLocaleString();
    const statusText = visit.status.charAt(0).toUpperCase() + visit.status.slice(1);
    const price = visit.visitDetails.price ? `₹${Number(visit.visitDetails.price).toLocaleString()}` : '';

    card.innerHTML = `
        <div class="visit-status ${visit.status}">
            ${statusText}
        </div>
        <div class="visit-details">
            <p><i class="fas fa-home"></i>${visit.visitDetails.propertyName || 'Property Name Not Available'}</p>
            <p><i class="fas fa-map-marker-alt"></i>${visit.visitDetails.location || 'Location Not Available'}</p>
            ${price ? `<p><i class="fas fa-tag"></i>${price}</p>` : ''}
            <p><i class="fas fa-user"></i>${visit.visitDetails.name}</p>
            <p><i class="fas fa-envelope"></i>${visit.visitDetails.email}</p>
        </div>
        <div class="visit-time">
            <i class="far fa-clock"></i>
            Scheduled for: ${visitDate}
        </div>
    `;

    return card;
}
