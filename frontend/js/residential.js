document.addEventListener('DOMContentLoaded', async () => {
    const residentialData = await fetchResidentialData();
    const container = document.querySelector('.residential-container');
    const template = document.querySelector('#residential-card-template');

    // Map configuration with stored state or defaults
    const mapConfig = {
        defaultCenter: JSON.parse(localStorage.getItem('residentialMapCenter')) || { lng: 73.8567, lat: 18.5204 },
        defaultZoom: parseFloat(localStorage.getItem('residentialMapZoom')) || 5,
        markerColors: {
            'Apartment': '#2ecc71',
            'Premium Flats': '#3498db',
            'Villa': '#e74c3c',
            'Penthouse': '#f1c40f',
            'Garden Homes': '#27ae60'
        }
    };

    let map, markers = [];
    const mapSection = document.querySelector('.map-section');
    const toggleMapBtn = document.querySelector('.toggle-map');

    function initMap() {
        mapboxgl.accessToken = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';
        
        // Get last known position and zoom
        const lastPosition = JSON.parse(localStorage.getItem('residentialMapPosition')) || {
            center: [mapConfig.defaultCenter.lng, mapConfig.defaultCenter.lat],
            zoom: mapConfig.defaultZoom,
            bearing: 0,
            pitch: 0
        };

        map = new mapboxgl.Map({
            container: 'residential-map',
            style: 'https://api.maptiler.com/maps/streets/style.json?key=iU912Qq8H8LoftWMzxw7',
            ...lastPosition // Spread the saved position properties
        });

        // Save complete map state on any movement
        map.on('moveend', () => {
            const mapPosition = {
                center: map.getCenter(),
                zoom: map.getZoom(),
                bearing: map.getBearing(),
                pitch: map.getPitch()
            };
            
            localStorage.setItem('residentialMapPosition', JSON.stringify({
                center: [mapPosition.center.lng, mapPosition.center.lat],
                zoom: mapPosition.zoom,
                bearing: mapPosition.bearing,
                pitch: mapPosition.pitch
            }));
        });

        // Save state before page unload
        window.addEventListener('beforeunload', () => {
            const mapPosition = {
                center: map.getCenter(),
                zoom: map.getZoom(),
                bearing: map.getBearing(),
                pitch: map.getPitch()
            };
            
            localStorage.setItem('residentialMapPosition', JSON.stringify({
                center: [mapPosition.center.lng, mapPosition.center.lat],
                zoom: mapPosition.zoom,
                bearing: mapPosition.bearing,
                pitch: mapPosition.pitch
            }));
        });

        map.on('load', () => {
            map.resize();
            createPropertyMarkers();
            
            // Only fit bounds if no saved position exists
            if (!localStorage.getItem('residentialMapPosition')) {
                fitMapToBounds();
            }
        });
    }

    function fitMapToBounds() {
        if (markers.length > 0) {
            const bounds = new mapboxgl.LngLatBounds();
            markers.forEach(marker => bounds.extend(marker.getLngLat()));
            map.fitBounds(bounds, {
                padding: 50,
                maxZoom: 15,
                duration: 0
            });
        }
    }

    function createPropertyMarkers() {
        markers.forEach(marker => marker.remove());
        markers = [];

        residentialData.forEach(property => {
            const markerEl = document.createElement('div');
            markerEl.className = 'custom-marker';
            markerEl.innerHTML = `
                <div class="marker-content">
                    <i class="fas fa-map-marker-alt"></i>
                    <div class="marker-tooltip">
                        <h4>${property.Name}</h4>
                        <p class="marker-price">${property['Starting Price']}</p>
                        <p class="marker-type">${property.Type}</p>
                    </div>
                </div>
            `;
            markerEl.style.setProperty('--marker-color', mapConfig.markerColors[property.Type] || '#2ecc71');

            const marker = new mapboxgl.Marker(markerEl)
                .setLngLat([property.Location.Longitude, property.Location.Latitude])
                .addTo(map);

            // Add click event to show popup
            markerEl.addEventListener('click', () => {
                const popup = new mapboxgl.Popup({ offset: 25 })
                    .setLngLat([property.Location.Longitude, property.Location.Latitude])
                    .setHTML(`
                        <div class="map-popup">
                            <h4>${property.Name}</h4>
                            <p>${property.Location.Address}</p>
                            <p class="price">Starting from ${property['Starting Price']}</p>
                            <p class="type">${property.Type}</p>
                        </div>
                    `)
                    .addTo(map);
            });

            markers.push(marker);
        });
    }

    // Modified toggle map visibility with state persistence
    toggleMapBtn.addEventListener('click', () => {
        mapSection.classList.toggle('map-collapsed');
        const isCollapsed = mapSection.classList.contains('map-collapsed');
        toggleMapBtn.querySelector('span').textContent = isCollapsed ? 'Show Map' : 'Hide Map';
        
        localStorage.setItem('residentialMapCollapsed', isCollapsed);
        
        if (!isCollapsed) {
            setTimeout(() => {
                map.resize();
                // Don't call fitBounds here to maintain user's last position
            }, 300);
        }
    });

    // Restore map collapsed state
    const mapCollapsed = localStorage.getItem('residentialMapCollapsed') === 'true';
    if (mapCollapsed) {
        mapSection.classList.add('map-collapsed');
        toggleMapBtn.querySelector('span').textContent = 'Show Map';
    }

    // Initialize map before rendering cards
    initMap();

    function createResidentialCard(project) {
        const card = template.content.cloneNode(true);
        
        // Set image and basic info
        card.querySelector('img').src = project['Image Link'];
        card.querySelector('.project-name').textContent = project.Name;
        card.querySelector('.project-location span').textContent = project.Location.Address;
        
        // Set specifications
        card.querySelector('.type').textContent = project.Type;
        card.querySelector('.bhk').textContent = project.BHK;
        card.querySelector('.area').textContent = `${project['Area (sq ft)']} sq ft`;
        
        // Add features
        const featuresContainer = card.querySelector('.project-features');
        project.Details['Additional Features'].slice(0, 4).forEach(feature => {
            const tag = document.createElement('span');
            tag.className = 'feature-tag';
            tag.textContent = feature;
            featuresContainer.appendChild(tag);
        });
        
        // Set price
        card.querySelector('.starting-price').textContent = `Starting from ${project['Starting Price']}`;
        
        // Set button ID
        card.querySelector('.view-details').dataset.id = project['Property ID'];
        
        return card;
    }

    // Render all projects
    residentialData.forEach(project => {
        container.appendChild(createResidentialCard(project));
    });

    // Implement filtering, sorting, and modal functionality
    // Similar to properties.js but adapted for residential data

    // Add Modal functionality
    document.querySelector('.enquire-btn').addEventListener('click', () => {
        document.querySelector('.enquiry-modal').classList.add('show');
    });

    document.querySelector('.enquiry-modal-close').addEventListener('click', () => {
        document.querySelector('.enquiry-modal').classList.remove('show');
    });

    document.querySelector('.enquiry-modal').addEventListener('click', (e) => {
        if (e.target === document.querySelector('.enquiry-modal')) {
            document.querySelector('.enquiry-modal').classList.remove('show');
        }
    });

    // Prevent form submission and show success message
    document.querySelector('.enquiry-form').addEventListener('submit', (e) => {
        e.preventDefault();
        // Add your form submission logic here
        alert('Thank you for your enquiry. We will get back to you soon!');
        document.querySelector('.enquiry-modal').classList.remove('show');
    });

    // Add cleanup function for page unload
    window.addEventListener('beforeunload', () => {
        // Optionally clear bounds when leaving the site completely
        // localStorage.removeItem('mapBounds');
    });
});
