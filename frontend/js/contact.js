document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu functionality
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.querySelector('.mobile-menu');
    const menuOverlay = document.querySelector('.menu-overlay');

    hamburger?.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        menuOverlay.classList.toggle('active');
    });

    menuOverlay?.addEventListener('click', () => {
        hamburger.classList.remove('active');
        mobileMenu.classList.remove('active');
        menuOverlay.classList.remove('active');
    });

    // Add hover animations to info items
    const infoItems = document.querySelectorAll('.info-item');
    infoItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.querySelector('i').style.transform = 'rotate(360deg)';
        });
    });

    // Modal functionality
    const modal = document.getElementById('generalEnquiryModal');
    const propertyBtn = document.querySelector('.property-btn');
    const closeModal = document.querySelector('.close-modal');
    const locationSelect = document.getElementById('location');
    const typeSelect = document.getElementById('type');
    const propertyListContainer = document.getElementById('propertyListContainer');
    const propertyList = document.getElementById('propertyList');
    const enquiryForm = document.getElementById('enquiryForm');

    // Open modal
    propertyBtn.addEventListener('click', async () => {
        const userData = await getCurrentUserData();
        if (userData) {
            modal.style.display = 'block';
            document.getElementById('name').value = userData.name;
            document.getElementById('email').value = userData.email;
        }
    });

    // Close modal
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Handle location and type selection
    async function updatePropertyList() {
        const location = locationSelect.value;
        const type = typeSelect.value;

        if (!location || !type) {
            propertyListContainer.style.display = 'none';
            return;
        }

        try {
            const data = await fetchPropertyData(type);
            const filteredProperties = data.filter(prop => {
                const propLocation = type === 'residential' 
                    ? prop.Location.City.toLowerCase()
                    : prop.Address.split(',')[1].trim().toLowerCase();
                return propLocation === location.toLowerCase();
            });

            propertyList.innerHTML = '<option value="">Select Property</option>';
            filteredProperties.forEach(prop => {
                const optionText = type === 'residential' 
                    ? `${prop.Name} - ${prop.BHK} (${prop['Starting Price']})`
                    : `${prop.Type} - ${prop.BHK} (₹${(prop['Price (INR)']/100000).toFixed(2)} Lac)`;
                
                propertyList.innerHTML += `<option value="${prop['Property ID']}">${optionText}</option>`;
            });

            propertyListContainer.style.display = 'block';
        } catch (error) {
            console.error('Error fetching property data:', error);
        }
    }

    locationSelect.addEventListener('change', updatePropertyList);
    typeSelect.addEventListener('change', updatePropertyList);

    // Add these functions at the beginning
    function showLoadingSpinner() {
        document.getElementById('loadingSpinner').style.display = 'flex';
    }

    function hideLoadingSpinner() {
        document.getElementById('loadingSpinner').style.display = 'none';
    }

    function showSuccessModal() {
        document.getElementById('successModal').style.display = 'flex';
    }

    function hideSuccessModal() {
        document.getElementById('successModal').style.display = 'none';
    }

    // Add success modal close button handler
    document.querySelector('.close-success-btn').addEventListener('click', hideSuccessModal);

    // Handle form submission
    enquiryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            showLoadingSpinner();
            const userData = JSON.parse(localStorage.getItem('userData'));
            if (!userData) {
                window.location.href = 'login.html';
                return;
            }

            const propertyDetails = await getPropertyDetails(
                typeSelect.value,
                propertyList.value
            );

            const formData = {
                userId: userData._id,
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                location: locationSelect.value,
                type: typeSelect.value,
                propertyId: propertyList.value,
                propertyDetails,
                message: document.getElementById('message').value
            };

            const response = await fetch('http://localhost:5000/api/general-enquiries', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (data.success) {
                modal.style.display = 'none';
                enquiryForm.reset();
                showSuccessModal();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error submitting enquiry:', error);
            alert('Failed to submit enquiry. Please try again.');
        } finally {
            hideLoadingSpinner();
        }
    });

    // Helper function to get property details
    async function getPropertyDetails(type, propertyId) {
        try {
            const data = await fetchPropertyData(type);
            return data.find(prop => prop['Property ID'] === propertyId);
        } catch (error) {
            console.error('Error getting property details:', error);
            return null;
        }
    }

    // Helper functions
    async function fetchPropertyData(type) {
        const response = await fetch(`../js/${type}Data.json`);
        return await response.json();
    }

    async function getCurrentUserData() {
        try {
            // Get user data from localStorage or session
            const userData = JSON.parse(localStorage.getItem('userData'));
            
            if (!userData) {
                // If no user is logged in, redirect to login page
                window.location.href = 'login.html';
                return null;
            }

            // Return user data
            return {
                name: userData.fullName,
                email: userData.email
            };
        } catch (error) {
            console.error('Error getting user data:', error);
            return null;
        }
    }

    // Club Membership Modal functionality
    const clubModal = document.getElementById('clubMembershipModal');
    const clubBtn = document.querySelector('.club-btn');
    const clubForm = document.getElementById('clubMembershipForm');
    const clubTypeSelect = document.getElementById('clubType');
    const membershipTypeSelect = document.getElementById('membershipType');

    // Open club modal
    clubBtn.addEventListener('click', async () => {
        const userData = await getCurrentUserData();
        if (userData) {
            clubModal.style.display = 'block';
            document.getElementById('clubName').value = userData.name;
            document.getElementById('clubEmail').value = userData.email;
            await loadClubTypes();
        }
    });

    // Close club modal when clicking on X
    clubModal.querySelector('.close-modal').addEventListener('click', () => {
        clubModal.style.display = 'none';
    });

    // Close club modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === clubModal) {
            clubModal.style.display = 'none';
        }
    });

    // Load club types from clubData.json
    async function loadClubTypes() {
        try {
            const response = await fetch('../js/clubData.json');
            const clubs = await response.json();
            
            clubTypeSelect.innerHTML = '<option value="">Select Club Type</option>';
            clubs.forEach(club => {
                clubTypeSelect.innerHTML += `<option value="${club['Club ID']}">${club.Name} - ${club.Type}</option>`;
            });
        } catch (error) {
            console.error('Error loading club types:', error);
        }
    }

    // Update pricing plans based on selected club
    clubTypeSelect.addEventListener('change', async function() {
        if (!this.value) {
            clearPricingPlans();
            return;
        }
        
        try {
            const response = await fetch('../js/clubData.json');
            const clubs = await response.json();
            const selectedClub = clubs.find(club => club['Club ID'] === this.value);
            
            if (selectedClub) {
                const standardPlan = selectedClub.Details.PricingPlans.find(plan => plan.name === "Standard");
                const premiumPlan = selectedClub.Details.PricingPlans.find(plan => plan.name === "Premium");
                
                document.querySelector('.standard-plan .plan-details').innerHTML = `
                    <div class="price">${standardPlan.price}</div>
                    <ul>
                        ${standardPlan.features.map(feature => `<li>${feature}</li>`).join('')}
                    </ul>
                `;
                
                document.querySelector('.premium-plan .plan-details').innerHTML = `
                    <div class="price">${premiumPlan.price}</div>
                    <ul>
                        ${premiumPlan.features.map(feature => `<li>${feature}</li>`).join('')}
                    </ul>
                `;
            }
        } catch (error) {
            console.error('Error loading club details:', error);
        }
    });

    function clearPricingPlans() {
        document.querySelector('.standard-plan .plan-details').innerHTML = '';
        document.querySelector('.premium-plan .plan-details').innerHTML = '';
    }

    // Handle club membership form submission
    clubForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            showLoadingSpinner();
            const userData = JSON.parse(localStorage.getItem('userData'));
            if (!userData) {
                window.location.href = 'login.html';
                return;
            }

            // Get selected club details
            const response = await fetch('../js/clubData.json');
            const clubs = await response.json();
            const selectedClub = clubs.find(club => club['Club ID'] === clubTypeSelect.value);
            const selectedPlan = selectedClub.Details.PricingPlans.find(
                plan => plan.name.toLowerCase() === membershipTypeSelect.value
            );

            const formData = {
                userId: userData._id,
                name: document.getElementById('clubName').value,
                email: document.getElementById('clubEmail').value,
                clubId: clubTypeSelect.value,
                clubName: selectedClub.Name,
                membershipType: membershipTypeSelect.value,
                plan: selectedPlan,
                clubDetails: {
                    type: selectedClub.Type,
                    description: selectedClub.Description,
                    location: selectedClub.Location,
                    amenities: selectedClub.Details.Amenities,
                    imageUrl: selectedClub.ImageUrl
                }
            };

            const submitResponse = await fetch('http://localhost:5000/api/club-memberships', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await submitResponse.json();
            if (data.success) {
                clubModal.style.display = 'none';
                clubForm.reset();
                clearPricingPlans();
                showSuccessModal();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error submitting club membership:', error);
            alert('Failed to submit club membership application. Please try again.');
        } finally {
            hideLoadingSpinner();
        }
    });
});
