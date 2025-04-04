// Load property data when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Get property ID from URL or use default
    const urlParams = new URLSearchParams(window.location.search);
    const propertyId = urlParams.get('id') || defaultPropertyId;
    loadPropertyDetails(propertyId);
});

async function loadPropertyDetails(propertyId) {
    try {
        const response = await fetch('../js/propertyData.json');
        const properties = await response.json();
        const property = properties.find(p => p['Property ID'] === propertyId);

        if (property) {
            // Update URL with property ID without page reload
            const url = new URL(window.location);
            url.searchParams.set('id', propertyId);
            window.history.pushState({}, '', url);
            
            // Update UI first
            updateUI(property);
            
            // Initialize map after UI is updated
            setTimeout(() => {
                initMap(property.Longitude, property.Latitude);
            }, 100);
            
            updatePropertyNavigation(properties, propertyId);
            
            // Add active state to current property
            document.querySelectorAll('.property-nav-item').forEach(item => {
                item.classList.remove('active');
                if (item.dataset.propertyId === propertyId) {
                    item.classList.add('active');
                }
            });
        }
    } catch (error) {
        console.error('Error loading property details:', error);
    }
}

function updateUI(property) {
    // Update page title
    document.title = `${property.Type} in ${property.Address} - UrbanScape`;

    // Update main image
    document.getElementById('mainImage').src = property['Image Link'];
    
    // Update banner info
    document.getElementById('propertyTitle').textContent = `${property.BHK} ${property.Type}`;
    document.getElementById('propertyLocation').textContent = property.Address;
    document.getElementById('propertyPrice').textContent = `₹${formatPrice(property['Price (INR)'])}`;

    // Update key features
    document.getElementById('bedrooms').textContent = `${property.Bedrooms} Beds`;
    document.getElementById('bathrooms').textContent = `${property.Bathrooms} Baths`;
    document.getElementById('area').textContent = `${property['Area (sq ft)']} sq ft`;
    document.getElementById('parking').textContent = property.Details.Parking;

    // Update description
    document.getElementById('propertyDescription').textContent = property.Description;

    // Update property details
    const detailsGrid = document.getElementById('propertyDetails');
    const details = property.Details;
    detailsGrid.innerHTML = Object.entries(details)
        .filter(([key]) => !['Additional Features', 'Nearby'].includes(key))
        .map(([key, value]) => `
            <div class="detail-item">
                <span class="label">${key}</span>
                <span class="value">${value}</span>
            </div>
        `).join('');

    // Update amenities
    const amenitiesGrid = document.getElementById('propertyAmenities');
    const amenitiesArray = property.Amenities.split(', ').concat(property.Details['Additional Features']);
    amenitiesGrid.innerHTML = amenitiesArray
        .map(amenity => `
            <div class="amenity-item">
                <i class="fas ${getAmenityIcon(amenity)}"></i>
                <span>${amenity}</span>
            </div>
        `).join('');

    // Update nearby places
    const nearbyPlaces = document.getElementById('nearbyPlaces');
    const nearby = property.Details.Nearby;
    nearbyPlaces.innerHTML = Object.entries(nearby)
        .map(([category, places]) => `
            <div class="nearby-category">
                <h4><i class="fas ${getNearbyIcon(category)}"></i> ${category}</h4>
                <ul>${places.map(place => `<li>${place}</li>`).join('')}</ul>
            </div>
        `).join('');

    // Initialize map with property location
    initMap(property.Longitude, property.Latitude);

    // Initialize wishlist button after updating UI
    initializeWishlistButton();
}

function getNearbyIcon(category) {
    const icons = {
        'Schools': 'fa-school',
        'Hospitals': 'fa-hospital',
        'Shopping': 'fa-shopping-cart',
        'Transport': 'fa-bus'
    };
    return icons[category] || 'fa-map-marker-alt';
}

// Update amenity icons mapping
function getAmenityIcon(amenity) {
    const iconMap = {
        'Gym': 'fa-dumbbell',
        'Swimming Pool': 'fa-swimming-pool',
        'Security': 'fa-shield-alt',
        'Park': 'fa-tree',
        'Power Backup': 'fa-bolt',
        'Children Play Area': 'fa-child',
        'Clubhouse': 'fa-building',
        'Sports Facility': 'fa-futbol',
        'Lift': 'fa-elevator',
        'Parking': 'fa-parking',
        'Garden': 'fa-leaf',
        'Private Pool': 'fa-swimming-pool',
        'Smart Home': 'fa-home',
        'Home Theater': 'fa-film',
        'Terrace Garden': 'fa-seedling',
        'Wine Cellar': 'fa-wine-glass',
        'BBQ Area': 'fa-fire',
        'Guest House': 'fa-house-user',
        'Modular Kitchen': 'fa-utensils',
        'Private Garden': 'fa-tree',
        'High-end Security': 'fa-shield-alt',
        'Smart Home Features': 'fa-microchip'
    };

    return iconMap[amenity] || 'fa-check-circle';
}

function formatPrice(price) {
    if (price >= 10000000) {
        return (price / 10000000).toFixed(2) + ' Cr';
    } else if (price >= 100000) {
        return (price / 100000).toFixed(2) + ' L';
    }
    return price.toLocaleString('en-IN');
}

function updatePropertyNavigation(properties, currentPropertyId) {
    const navContainer = document.getElementById('propertyNavLinks');
    navContainer.innerHTML = properties
        .filter(p => p['Property ID'] !== currentPropertyId)
        .map(p => `
            <a href="javascript:void(0)" 
               onclick="loadPropertyDetails('${p['Property ID']}')"
               class="property-nav-item"
               data-property-id="${p['Property ID']}">
                <img src="${p['Image Link']}" alt="${p.Type}">
                <div class="nav-property-info">
                    <h4>${p.BHK} ${p.Type}</h4>
                    <p>${p.Address.split(',')[0]}</p>
                    <span class="nav-property-price">₹${formatPrice(p['Price (INR)'])}</span>
                </div>
            </a>
        `).join('');
}

// Add event listener for popstate to handle browser back/forward
window.addEventListener('popstate', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const propertyId = urlParams.get('id') || defaultPropertyId;
    loadPropertyDetails(propertyId);
});

function initMap(longitude, latitude) {
    const mapContainer = document.getElementById('propertyMap');
    if (!mapContainer) return;

    try {
        // Remove any existing map
        while (mapContainer.firstChild) {
            mapContainer.removeChild(mapContainer.firstChild);
        }

        // Initialize map
        const map = new mapboxgl.Map({
            container: 'propertyMap',
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [longitude, latitude],
            zoom: 15,
            interactive: true
        });

        // Add navigation controls
        map.addControl(new mapboxgl.NavigationControl());

        // Create custom marker element
        const markerEl = document.createElement('div');
        markerEl.className = 'custom-marker';
        markerEl.innerHTML = `
            <div class="marker-content">
                <i class="fas fa-map-marker-alt"></i>
                <div class="marker-tooltip">
                    <h4>${document.getElementById('propertyTitle').textContent}</h4>
                    <p class="marker-price">${document.getElementById('propertyPrice').textContent}</p>
                    <p class="marker-type">${document.getElementById('propertyLocation').textContent}</p>
                </div>
            </div>
        `;

        // Add marker
        const marker = new mapboxgl.Marker({
            element: markerEl,
            anchor: 'bottom'
        })
        .setLngLat([longitude, latitude])
        .addTo(map);

        // Add popup
        const popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            offset: 25
        })
        .setLngLat([longitude, latitude])
        .setHTML(`
            <div class="map-popup">
                <h4>${document.getElementById('propertyTitle').textContent}</h4>
                <p>${document.getElementById('propertyLocation').textContent}</p>
                <p class="price">${document.getElementById('propertyPrice').textContent}</p>
            </div>
        `)
        .addTo(map);

        // Add click events for map controls
        const toggleMapBtn = document.querySelector('.toggle-map');
        const mapSection = document.querySelector('.map-section');
        
        if (toggleMapBtn && mapSection) {
            toggleMapBtn.addEventListener('click', () => {
                mapSection.classList.toggle('map-collapsed');
                const isCollapsed = mapSection.classList.contains('map-collapsed');
                toggleMapBtn.querySelector('span').textContent = isCollapsed ? 'Show Map' : 'Hide Map';
                
                if (!isCollapsed) {
                    setTimeout(() => {
                        map.resize();
                        map.flyTo({
                            center: [longitude, latitude],
                            zoom: 15,
                            essential: true
                        });
                    }, 300);
                }
            });
        }

        // Ensure map loads properly
        map.on('load', () => {
            map.resize();
        });

    } catch (error) {
        console.error('Error initializing map:', error);
        mapContainer.innerHTML = '<div class="map-error">Error loading map</div>';
    }
}

// Email Modal Functions
function showEmailModal() {
    const modal = document.getElementById('emailModal');
    modal.style.display = 'block';
}

// Close modal when clicking the close button or outside the modal
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('emailModal');
    const closeBtn = document.querySelector('.close-email-modal');

    closeBtn.onclick = () => {
        modal.style.display = 'none';
    };

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };

    // Handle email form submission
    document.getElementById('emailForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const emailModal = document.getElementById('emailModal');
        const loadingSpinner = document.getElementById('loadingSpinner');
        const successModal = document.getElementById('successModal');

        try {
            const property = await getCurrentPropertyDetails();
            const formData = {
                senderName: document.getElementById('senderName').value,
                senderEmail: document.getElementById('senderEmail').value,
                message: document.getElementById('message').value,
                propertyDetails: {
                    id: property['Property ID'],
                    type: property.Type,
                    location: property.Address,
                    price: property['Price (INR)'],
                    description: property.Description,
                    imageUrl: property['Image Link']
                }
            };

            // Hide email modal and show loading spinner
            emailModal.style.display = 'none';
            loadingSpinner.style.display = 'flex';

            const response = await fetch('http://localhost:5000/api/share-property', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            
            // Hide loading spinner
            loadingSpinner.style.display = 'none';

            if (result.success) {
                // Reset form
                document.getElementById('emailForm').reset();
                
                // Show success modal
                successModal.style.display = 'flex';
                successModal.style.opacity = '1';
                
                // Don't auto-hide success modal - let user dismiss it
                const okButton = successModal.querySelector('.ok-btn');
                okButton.focus(); // Focus on OK button for accessibility
            } else {
                throw new Error(result.message || 'Failed to send email');
            }
        } catch (error) {
            console.error('Error sending email:', error);
            loadingSpinner.style.display = 'none';
            alert('Error sending email: ' + error.message);
            emailModal.style.display = 'block';
        }
    });

    // Handle success modal OK button
    document.querySelector('.ok-btn').addEventListener('click', () => {
        const successModal = document.getElementById('successModal');
        successModal.style.opacity = '0';
        setTimeout(() => {
            successModal.style.display = 'none';
        }, 300);
    });

    // Only close success modal when clicking outside if user specifically clicks the overlay
    document.getElementById('successModal').addEventListener('click', (event) => {
        if (event.target === document.getElementById('successModal')) {
            const successModal = document.getElementById('successModal');
            successModal.style.opacity = '0';
            setTimeout(() => {
                successModal.style.display = 'none';
            }, 300);
        }
    });
});

async function getCurrentPropertyDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const propertyId = urlParams.get('id') || defaultPropertyId;
    
    const response = await fetch('../js/propertyData.json');
    const properties = await response.json();
    return properties.find(p => p['Property ID'] === propertyId);
}

// Wishlist functionality
async function initializeWishlistButton() {
    const wishlistBtn = document.querySelector('.wishlist-btn');
    
    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem('userData'));
    
    if (!userData || !userData._id) {
        wishlistBtn.addEventListener('click', () => {
            if (confirm('Please login to add properties to wishlist. Go to login page?')) {
                window.location.href = 'login.html';
            }
        });
        return;
    }

    try {
        const property = await getCurrentPropertyDetails();
        
        // Check if property is in wishlist
        const response = await fetch(`http://localhost:5000/api/wishlist/check/${userData._id}/${property['Property ID']}`);
        const data = await response.json();

        if (data.success && data.isInWishlist) {
            updateWishlistButton(true);
        }

        // Add click handler
        wishlistBtn.addEventListener('click', () => toggleWishlist(userData._id, property));
    } catch (err) {
        console.error('Error initializing wishlist:', err);
    }
}

function updateWishlistButton(isInWishlist) {
    const wishlistBtn = document.querySelector('.wishlist-btn');
    const icon = wishlistBtn.querySelector('i');
    const text = wishlistBtn.querySelector('span');

    if (isInWishlist) {
        icon.classList.remove('far');
        icon.classList.add('fas');
        text.textContent = 'Added to Wishlist';
        wishlistBtn.classList.add('active');
    } else {
        icon.classList.remove('fas');
        icon.classList.add('far');
        text.textContent = 'Add to Wishlist';
        wishlistBtn.classList.remove('active');
    }
}

async function toggleWishlist(userId, property) {
    const wishlistBtn = document.querySelector('.wishlist-btn');
    const isCurrentlyInWishlist = wishlistBtn.classList.contains('active');

    try {
        const response = await fetch('http://localhost:5000/api/wishlist', {
            method: isCurrentlyInWishlist ? 'DELETE' : 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId,
                propertyId: property['Property ID'],
                propertyData: {
                    type: property.Type,
                    address: property.Address,
                    price: property['Price (INR)'],
                    imageLink: property['Image Link'],
                    bedrooms: property.Bedrooms,
                    bathrooms: property.Bathrooms,
                    area: property['Area (sq ft)']
                }
            })
        });

        const data = await response.json();

        if (data.success) {
            updateWishlistButton(!isCurrentlyInWishlist);
            // Show success message
            alert(data.message);
        } else {
            throw new Error(data.message);
        }
    } catch (err) {
        console.error('Error toggling wishlist:', err);
        alert('Error updating wishlist. Please try again.');
    }
}

// Add more functions for map, contact form, sharing, etc...
