// Add these functions at the beginning of the file
function showLogoutModal() {
    document.getElementById('logoutModal').style.display = 'block';
}

function closeLogoutModal() {
    document.getElementById('logoutModal').style.display = 'none';
}

function confirmLogout() {
    window.location.href = 'index.html';
}

// Mobile menu functionality
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

// Filter reset functionality
const resetBtn = document.querySelector('.reset-btn');
const filterSelects = document.querySelectorAll('.filter-item select');

resetBtn.addEventListener('click', () => {
    filterSelects.forEach(select => {
        select.selectedIndex = 0;
    });
});

// Sort menu functionality
const sortBtn = document.querySelector('.sort-btn');
const sortMenu = document.querySelector('.sort-menu');
const sortMenuItems = document.querySelectorAll('.sort-menu-item');
let currentSort = null;

// Toggle sort menu
sortBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isVisible = sortMenu.classList.contains('show');
    
    // Close any other open menus first
    closeAllMenus();
    
    if (!isVisible) {
        sortMenu.classList.add('show');
        sortBtn.classList.add('active');
    }
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (!sortMenu.contains(e.target) && !sortBtn.contains(e.target)) {
        closeAllMenus();
    }
});

// Close all menus helper function
function closeAllMenus() {
    sortMenu.classList.remove('show');
    sortBtn.classList.remove('active');
}

// Handle sort selection with visual feedback
sortMenuItems.forEach(item => {
    item.addEventListener('click', () => {
        const sortType = item.dataset.sort;
        
        // Remove active class from all items
        sortMenuItems.forEach(i => i.classList.remove('active'));
        
        // Add active class to clicked item
        item.classList.add('active');
        
        // Update sort button icon to show active state
        if (currentSort !== sortType) {
            currentSort = sortType;
            // You could update the sort button icon here if desired
            sortBtn.classList.add('active');
        }
        
        // Perform the sorting
        sortProperties(sortType);
        
        // Close the menu
        closeAllMenus();
    });
});

// Function to sort properties
function sortProperties(sortType) {
    const container = document.querySelector('.properties-container');
    const properties = [...container.querySelectorAll('.property-card')];
    
    properties.sort((a, b) => {
        switch(sortType) {
            case 'name-asc':
                return a.querySelector('.property-title').textContent
                    .localeCompare(b.querySelector('.property-title').textContent);
            case 'name-desc':
                return b.querySelector('.property-title').textContent
                    .localeCompare(a.querySelector('.property-title').textContent);
            case 'price-asc':
                return extractPrice(a) - extractPrice(b);
            case 'price-desc':
                return extractPrice(b) - extractPrice(a);
            case 'area-asc':
                return extractArea(a) - extractArea(b);
            case 'area-desc':
                return extractArea(b) - extractArea(a);
            default:
                return 0;
        }
    });
    
    // Re-append sorted properties
    properties.forEach(property => container.appendChild(property));
}

// Helper functions to extract numeric values
function extractPrice(propertyCard) {
    const priceText = propertyCard.querySelector('.price').textContent;
    return parseFloat(priceText.replace(/[₹,]/g, ''));
}

function extractArea(propertyCard) {
    const areaText = propertyCard.querySelector('.spec-item:last-child span').textContent;
    return parseFloat(areaText.replace(/[^0-9.]/g, ''));
}

// MapTiler initialization and management
let map, markers = [];
const mapSection = document.querySelector('.map-section');
const toggleMapBtn = document.querySelector('.toggle-map');

function initMap() {
    mapboxgl.accessToken = 'YOUR_MAPTILER_KEY'; // Replace with your MapTiler key
    
    map = new mapboxgl.Map({
        container: 'property-map',
        style: 'https://api.maptiler.com/maps/streets/style.json?key=iU912Qq8H8LoftWMzxw7',
        center: [mapConfig.defaultCenter.lng, mapConfig.defaultCenter.lat], // MapboxGL uses [lng, lat]
        zoom: mapConfig.defaultZoom
    });

    // Create markers for all properties
    createPropertyMarkers();
}

function createPropertyMarkers() {
    // Clear existing markers
    markers.forEach(marker => marker.remove());
    markers = [];

    propertyData.forEach(property => {
        const markerEl = document.createElement('div');
        markerEl.className = 'custom-marker';
        markerEl.innerHTML = `
            <div class="marker-content">
                <i class="fas fa-map-marker-alt"></i>
                <div class="marker-tooltip">
                    <h4>${property.title}</h4>
                    <p class="marker-price">₹${property.price}</p>
                    <p class="marker-type">${property.propertyType}</p>
                </div>
            </div>
        `;
        markerEl.style.setProperty('--marker-color', mapConfig.markerColors[property.propertyType] || '#3498db');

        // Create and add marker
        const marker = new mapboxgl.Marker({
            element: markerEl,
            anchor: 'bottom'
        })
            .setLngLat([property.coordinates.lng, property.coordinates.lat])
            .addTo(map);

        // Add click event for popup
        markerEl.addEventListener('click', () => {
            const popup = new mapboxgl.Popup({ offset: 25 })
                .setLngLat([property.coordinates.lng, property.coordinates.lat])
                .setHTML(`
                    <div class="map-popup">
                        <h4>${property.title}</h4>
                        <p>${property.location}</p>
                        <p class="price">₹${property.price}</p>
                        <p class="type">${property.propertyType}</p>
                    </div>
                `)
                .addTo(map);
        });

        markers.push(marker);
    });
}

// Toggle map visibility
toggleMapBtn.addEventListener('click', () => {
    mapSection.classList.toggle('map-collapsed');
    toggleMapBtn.querySelector('span').textContent = 
        mapSection.classList.contains('map-collapsed') ? 'Show Map' : 'Hide Map';
});

// Add map state management
let isMapInteractionEnabled = false;
let selectedPropertyId = null;

// Modify renderProperties function to change hover behavior
function renderProperties(properties = propertyData) {
    const container = document.querySelector('.properties-container');
    container.innerHTML = properties.map(property => `
        <div class="property-card" data-property-id="${property.id}">
            <div class="property-image">
                <img src="${property.image}" alt="${property.title}">
            </div>
            <div class="property-details">
                <h3 class="property-title">${property.title}</h3>
                <div class="property-location">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${property.location}</span>
                </div>
                <div class="property-specs">
                    <div class="spec-item">
                        <i class="fas fa-bed"></i>
                        <span>${property.specs.beds} Beds</span>
                    </div>
                    <div class="spec-item">
                        <i class="fas fa-bath"></i>
                        <span>${property.specs.baths} Baths</span>
                    </div>
                    <div class="spec-item">
                        <i class="fas fa-ruler-combined"></i>
                        <span>${property.specs.area} sqft</span>
                    </div>
                </div>
                <div class="property-amenities">
                    ${property.amenities.map(amenity => `
                        <span class="amenity">
                            <i class="fas fa-${getAmenityIcon(amenity)}"></i> 
                            ${amenity}
                        </span>
                    `).join('')}
                </div>
                <div class="property-footer">
                    <div class="price">₹${property.price}</div>
                    <a href="property-main.html?id=${property.id}" class="view-details">
                        View Details
                    </a>
                </div>
            </div>
        </div>
    `).join('');

    // Update event listeners
    document.querySelectorAll('.property-card .view-details').forEach(button => {
        button.addEventListener('click', (e) => {
            const propertyId = e.currentTarget.closest('.property-card').dataset.propertyId;
            window.location.href = `property-main.html?id=${propertyId}`;
        });
    });
}

// Modify highlightMarker function
function highlightMarker(propertyId) {
    resetMarkers(); // Reset any existing highlights
    
    const property = propertyData.find(p => p.id === propertyId);
    if (property) {
        const marker = markers[propertyId - 1];
        
        // Animate map move only if property changed
        if (selectedPropertyId !== propertyId) {
            map.flyTo({
                center: [property.coordinates.lng, property.coordinates.lat],
                zoom: 15,
                essential: true,
                duration: 1000
            });
        }

        // Show popup
        marker.togglePopup();
        
        // Highlight the marker
        const markerEl = marker.getElement();
        markerEl.style.transform = 'scale(1.2)';
        markerEl.style.zIndex = '1';
    }
}

// Modify resetMarkers function
function resetMarkers() {
    markers.forEach(marker => {
        marker.getPopup().remove();
        const markerEl = marker.getElement();
        markerEl.style.transform = 'scale(1)';
        markerEl.style.zIndex = 'auto';
    });
}

// Helper function to get appropriate icon for amenities
function getAmenityIcon(amenity) {
    const icons = {
        'Parking': 'car',
        'Pool': 'swimming-pool',
        'Gym': 'dumbbell',
        'Garden': 'tree',
        'Security': 'shield-alt'
    };
    return icons[amenity] || 'check';
}

// Filter properties
function filterProperties() {
    const location = document.querySelector('select[name="location"]').value;
    const propertyType = document.querySelector('select[name="property-type"]').value;
    const furnishing = document.querySelector('select[name="furnishing"]').value;

    const filteredProperties = propertyData.filter(property => {
        return (!location || property.location.includes(location)) &&
               (!propertyType || property.propertyType === propertyType) &&
               (!furnishing || property.furnishing === furnishing);
    });

    renderProperties(filteredProperties);
    createPropertyMarkers(); // Update markers after filtering
}

// Add event listeners for filters
document.querySelectorAll('.filter-item select').forEach(select => {
    select.addEventListener('change', filterProperties);
});

// View property details function (placeholder)
function viewPropertyDetails(propertyId) {
    const property = propertyData.find(p => p['Property ID'] === propertyId);
    if (!property) return;

    const modal = document.getElementById('propertyModal');
    const modalBody = modal.querySelector('.modal-body');

    modalBody.innerHTML = `
        <div class="property-details-view">
            <div class="image-section">
                <img src="${property['Image Link']}" alt="${property.Type}">
                <div class="property-type-badge">${property.Type}</div>
            </div>
            
            <div class="info-section">
                <div class="title-price">
                    <h2>${property.Description.split('.')[0]}</h2>
                    <div class="price">₹${formatPrice(property['Price (INR)'])}</div>
                </div>
                
                <div class="location">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${property.Address}</span>
                </div>
                
                <div class="key-specs">
                    <div class="spec">
                        <i class="fas fa-bed"></i>
                        <span>${property.Bedrooms} Beds</span>
                    </div>
                    <div class="spec">
                        <i class="fas fa-bath"></i>
                        <span>${property.Bathrooms} Baths</span>
                    </div>
                    <div class="spec">
                        <i class="fas fa-ruler-combined"></i>
                        <span>${property['Area (sq ft)']} sq ft</span>
                    </div>
                    <div class="spec">
                        <i class="fas fa-car"></i>
                        <span>${property.Details.Parking}</span>
                    </div>
                </div>
                
                <div class="details-section">
                    <h3>Property Details</h3>
                    <div class="details-grid">
                        ${generateDetailsHTML(property.Details)}
                    </div>
                </div>
                
                <div class="amenities-section">
                    <h3>Amenities</h3>
                    <div class="amenities-grid">
                        ${generateAmenitiesHTML(property.Details['Additional Features'])}
                    </div>
                </div>
                
                <div class="nearby-section">
                    <h3>Nearby Places</h3>
                    <div class="nearby-grid">
                        ${generateNearbyHTML(property.Details.Nearby)}
                    </div>
                </div>
                
                <div class="actions">
                    <button class="contact-btn">Contact Agent</button>
                    <button class="share-btn">Share Property</button>
                </div>
            </div>
        </div>
    `;

    // Show modal
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent scrolling

    // Add close functionality
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.onclick = () => {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    };

    // Close when clicking outside
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    };
}

function generateDetailsHTML(details) {
    const detailsToShow = [
        { key: 'Construction Year', icon: 'calendar' },
        { key: 'Furnishing', icon: 'couch' },
        { key: 'Built-up Area', icon: 'ruler-combined' },
        { key: 'Maintenance', icon: 'money-bill' },
        { key: 'Available From', icon: 'clock' },
        { key: 'Ownership Type', icon: 'file-contract' }
    ];

    return detailsToShow.map(detail => `
        <div class="detail-item">
            <i class="fas fa-${detail.icon}"></i>
            <span class="label">${detail.key}</span>
            <span class="value">${details[detail.key]}</span>
        </div>
    `).join('');
}

function generateAmenitiesHTML(amenities) {
    return amenities.map(amenity => `
        <div class="amenity-item">
            <i class="fas ${getAmenityIcon(amenity)}"></i>
            <span>${amenity}</span>
        </div>
    `).join('');
}

function generateNearbyHTML(nearby) {
    return Object.entries(nearby).map(([category, items]) => `
        <div class="nearby-category">
            <h4>${category}</h4>
            <ul>
                ${items.map(item => `<li>${item}</li>`).join('')}
            </ul>
        </div>
    `).join('');
}

// Add map interaction toggle
function toggleMapInteraction(enable) {
    isMapInteractionEnabled = enable;
    if (!enable) {
        resetMarkers();
    }
}

// Update map controls function
function addMapControls() {
    const controlsDiv = document.querySelector('.map-controls');
    controlsDiv.innerHTML = `
        <button class="map-control-btn toggle-map">
            <i class="fas fa-chevron-down"></i>
            <span>Show Map</span>
        </button>
    `;

    const toggleBtn = controlsDiv.querySelector('.toggle-map');
    const mapSection = document.querySelector('.map-section');
    
    // Set initial state
    mapSection.classList.add('map-collapsed');
    
    toggleBtn.addEventListener('click', () => {
        const isCollapsed = mapSection.classList.contains('map-collapsed');
        const btnIcon = toggleBtn.querySelector('i');
        const btnText = toggleBtn.querySelector('span');

        if (isCollapsed) {
            // Expanding
            mapSection.classList.remove('map-collapsed');
            btnIcon.className = 'fas fa-chevron-up';
            btnText.textContent = 'Hide Map';
            
            // Ensure map renders correctly after expansion
            setTimeout(() => {
                map.resize();
                // Center map on all markers
                const bounds = new mapboxgl.LngLatBounds();
                markers.forEach(marker => {
                    bounds.extend(marker.getLngLat());
                });
                map.fitBounds(bounds, {
                    padding: 50,
                    duration: 0
                });
            }, 300);
        } else {
            // Collapsing
            mapSection.classList.add('map-collapsed');
            btnIcon.className = 'fas fa-chevron-down';
            btnText.textContent = 'Show Map';
        }
    });
}

// Initial render
document.addEventListener('DOMContentLoaded', async () => {
    initMap();
    await loadPropertyData(); // Load data before rendering
    updateFilterOptions(); // Add this new function to update filter dropdowns
});

// Add this new function to update filter options based on JSON data
function updateFilterOptions() {
    // Update location filter
    const locations = [...new Set(propertyData.map(p => p.location.split(',')[1].trim()))];
    updateSelectOptions('location', locations);

    // Update BHK filter
    const bhkTypes = [...new Set(propertyData.map(p => p.propertyType))];
    updateSelectOptions('property-type', bhkTypes);

    // Update price range filter
    const prices = propertyData.map(p => parseFloat(p.price));
    const priceRanges = generatePriceRanges(Math.min(...prices), Math.max(...prices));
    updateSelectOptions('price-range', priceRanges);

    // Update area filter
    const areas = propertyData.map(p => p.specs.area);
    const areaRanges = generateAreaRanges(Math.min(...areas), Math.max(...areas));
    updateSelectOptions('area', areaRanges);
}

function updateSelectOptions(selectName, options) {
    const select = document.querySelector(`select[name="${selectName}"]`);
    if (select) {
        const currentValue = select.value;
        select.innerHTML = `<option value="">Any ${selectName.charAt(0).toUpperCase() + selectName.slice(1)}</option>`;
        options.forEach(option => {
            select.add(new Option(option, option));
        });
        select.value = currentValue;
    }
}

function generatePriceRanges(min, max) {
    const ranges = [];
    const step = (max - min) / 4;
    for (let i = 0; i < 4; i++) {
        const start = min + (step * i);
        const end = min + (step * (i + 1));
        ranges.push(`${formatPrice(start)} - ${formatPrice(end)}`);
    }
    return ranges;
}

function generateAreaRanges(min, max) {
    const ranges = [];
    const step = (max - min) / 4;
    for (let i = 0; i < 4; i++) {
        const start = Math.round(min + (step * i));
        const end = Math.round(min + (step * (i + 1)));
        ranges.push(`${start} - ${end} sq ft`);
    }
    return ranges;
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('../js/propertyData.json');
        const properties = await response.json();
        displayProperties(properties);
    } catch (error) {
        console.error('Error loading properties:', error);
    }
});

function displayProperties(properties) {
    const container = document.querySelector('.properties-container');
    const template = document.getElementById('property-card-template');
    
    properties.forEach(property => {
        const propertyCard = template.content.cloneNode(true);
        
        // Set property image
        const img = propertyCard.querySelector('.property-image img');
        img.src = property['Image Link'];
        img.alt = `${property.BHK} ${property.Type}`;
        
        // Set property details
        propertyCard.querySelector('.property-title').textContent = `${property.BHK} ${property.Type}`;
        propertyCard.querySelector('.property-location span').textContent = property.Address;
        
        // Set specifications
        const specs = propertyCard.querySelectorAll('.property-specs .spec-item span');
        specs[0].textContent = `${property.Bedrooms} Beds`;
        specs[1].textContent = `${property.Bathrooms} Baths`;
        specs[2].textContent = `${property['Area (sq ft)']} sq ft`;
        
        // Set amenities
        const amenitiesContainer = propertyCard.querySelector('.property-amenities');
        property.Amenities.split(', ').slice(0, 3).forEach(amenity => {
            const span = document.createElement('span');
            span.className = 'amenity';
            span.innerHTML = `<i class="fas ${getAmenityIcon(amenity)}"></i> ${amenity}`;
            amenitiesContainer.appendChild(span);
        });
        
        // Set price and view details link with ID
        propertyCard.querySelector('.price').textContent = `₹${formatPrice(property['Price (INR)'])}`;
        const viewDetailsLink = propertyCard.querySelector('.view-details');
        const viewButtonId = `VB${property['Property ID'].replace('PROP', '')}`; // Convert PROP1 to VB1
        viewDetailsLink.id = viewButtonId;
        viewDetailsLink.href = `property-main.html?id=${property['Property ID']}`;
        viewDetailsLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = `property-main.html?id=${property['Property ID']}`;
        });
        
        container.appendChild(propertyCard);
    });
}

function formatPrice(price) {
    if (price >= 10000000) {
        return (price / 10000000).toFixed(2) + ' Cr';
    } else if (price >= 100000) {
        return (price / 100000).toFixed(2) + ' L';
    }
    return price.toLocaleString('en-IN');
}

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

// Property Visit Form Functions
function openVisitForm(event) {
    event.preventDefault();
    const modal = document.getElementById('propertyVisitForm');
    const form = document.getElementById('visitForm');
    
    // Get logged in user details from localStorage or session
    const user = JSON.parse(localStorage.getItem('userData'));
    if (!user) {
        alert('Please log in to schedule a visit');
        return;
    }

    // Pre-fill user details
    document.getElementById('visitorName').value = user.fullName;
    document.getElementById('visitorEmail').value = user.email;

    // Show modal
    modal.style.display = 'block';
}

function closeVisitForm() {
    document.getElementById('propertyVisitForm').style.display = 'none';
}

// Handle location change with proper data loading
document.getElementById('visitLocation').addEventListener('change', async function() {
    const location = this.value;
    const propertySelect = document.getElementById('visitProperty');
    
    // Clear current options
    propertySelect.innerHTML = '<option value="">Select Property</option>';
    
    if (!location) return;

    try {
        // Load real estate data
        const response = await fetch('../js/propertyData.json');
        const propertyData = await response.json();

        // Filter properties by selected location
        const filteredProperties = propertyData.filter(property => {
            const propertyLocation = property.Address.split(',')[1].trim();
            return propertyLocation === location;
        });
        
        // Add filtered properties to select
        filteredProperties.forEach(property => {
            const option = document.createElement('option');
            option.value = property['Property ID'];
            const priceFormatted = formatPrice(property['Price (INR)']);
            option.textContent = `${property.Type} - ${property.BHK} - ₹${priceFormatted} - ${property.Address.split(',')[0]}`;
            propertySelect.appendChild(option);
        });

    } catch (error) {
        console.error('Error loading property data:', error);
        alert('Error loading properties. Please try again.');
    }
});

// Add a dedicated function for price formatting
function formatPrice(price) {
    if (price >= 10000000) {
        return (price / 10000000).toFixed(2) + ' Cr';
    } else if (price >= 100000) {
        return (price / 100000).toFixed(2) + ' L';
    }
    return price.toLocaleString('en-IN');
}

// Handle form submission with improved error handling and validation
document.getElementById('visitForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    try {
        const user = JSON.parse(localStorage.getItem('userData'));
        if (!user || !user._id) {
            throw new Error('User not logged in');
        }

        // Extract numeric ID from PROP format and add prefix
        const rawPropertyId = this.visitProperty.value;
        const propertyIdNumber = rawPropertyId.replace('PROP', '');
        const mongoPropertyId = `property${propertyIdNumber}`;

        showLoadingSpinner();

        const formData = {
            userId: user._id,
            userType: user.userType,
            propertyId: mongoPropertyId,
            visitDetails: {
                name: this.visitorName.value,
                email: this.visitorEmail.value,
                location: this.visitLocation.value,
                propertyName: this.visitProperty.options[this.visitProperty.selectedIndex].text,
                visitTime: new Date(this.visitTime.value)
            }
        };

        const response = await fetch('http://localhost:5000/api/property-visits', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        
        if (data.success) {
            setTimeout(() => {
                showSuccessModal();
            }, 1500);
        } else {
            hideLoadingSpinner();
            throw new Error(data.message || 'Failed to schedule visit');
        }
    } catch (error) {
        hideLoadingSpinner();
        console.error('Error scheduling visit:', error);
        alert(`Error scheduling visit: ${error.message}`);
    }
});

function showLoadingSpinner() {
    document.querySelector('.loading-overlay').style.display = 'flex';
}

function hideLoadingSpinner() {
    document.querySelector('.loading-overlay').style.display = 'none';
}

function showSuccessModal() {
    const modal = document.getElementById('successModal');
    hideLoadingSpinner();
    modal.style.display = 'flex';
    // Use setTimeout to ensure the display: flex is applied before adding the show class
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

function closeSuccessModal() {
    const modal = document.getElementById('successModal');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
        closeVisitForm(); // Close the visit form modal
    }, 300);
}

// Set minimum date for visit time
document.getElementById('visitTime').addEventListener('focus', function() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    this.min = now.toISOString().slice(0, 16);
});
