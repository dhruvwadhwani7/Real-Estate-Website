// Fetch residential data from JSON file
async function fetchResidentialData() {
    try {
        const response = await fetch('../js/residentialData.json');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error loading residential data:', error);
        return [];
    }
}
