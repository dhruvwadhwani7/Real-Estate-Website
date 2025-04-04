let propertyData = [];

// Helper object for map markers
const mapConfig = {
    defaultCenter: {
        lat: 19.0760,  // Mumbai center approximately
        lng: 72.8777
    },
    defaultZoom: 11,
    markerColors: {
        "1 BHK": "#FF4444",
        "2 BHK": "#FFB841",
        "3 BHK": "#33B5E5",
        "4 BHK": "#00C851",
        "5 BHK": "#AA66CC"
    }
};

// Fetch and transform the JSON data
async function loadPropertyData() {
    try {
        const response = await fetch('../real_estate_sample_india.json');
        const jsonData = await response.json();
        
        // Transform the JSON data to match our application's format
        propertyData = jsonData.map(item => ({
            id: item["Property ID"],
            title: `${item.BHK} Property in ${item.Address.split(',')[0]}`,
            location: item.Address,
            coordinates: {
                lat: item.Latitude,
                lng: item.Longitude
            },
            price: formatPrice(item["Price (INR)"]),
            specs: {
                beds: item.Bedrooms,
                baths: item.Bathrooms,
                area: item["Area (sq ft)"]
            },
            amenities: item.Amenities.split(', '),
            image: item["Image Link"],
            propertyType: item.BHK,
            description: item.Description,
            furnishing: getFurnishingStatus() // Random furnishing status as it's not in JSON
        }));

        // Trigger initial render after data is loaded
        renderProperties(propertyData);
        createPropertyMarkers();
        
    } catch (error) {
        console.error('Error loading property data:', error);
    }
}

// Helper function to format price
function formatPrice(price) {
    if (price >= 10000000) {
        return `${(price / 10000000).toFixed(2)} Cr`;
    } else if (price >= 100000) {
        return `${(price / 100000).toFixed(2)} L`;
    } else {
        return `₹${price.toLocaleString()}`;
    }
}

// Helper function to get random furnishing status
function getFurnishingStatus() {
    const statuses = ['Fully Furnished', 'Semi-Furnished', 'Unfurnished'];
    return statuses[Math.floor(Math.random() * statuses.length)];
}

// Export the loadPropertyData function
window.loadPropertyData = loadPropertyData;
