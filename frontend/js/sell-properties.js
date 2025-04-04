document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('propertyModal');
    const addBtn = document.getElementById('addPropertyBtn');
    const closeBtn = document.querySelector('.close-modal');
    const propertyForm = document.getElementById('propertyForm');
    const cancelBtn = document.querySelector('.cancel-btn');
    const propertiesContainer = document.getElementById('my-properties');

    const successModal = document.getElementById('successModal');
    const successOkBtn = document.getElementById('successOkBtn');
    const successMessage = document.getElementById('successMessage');

    function showSuccessModal(message) {
        successMessage.textContent = message;
        successModal.style.display = 'block';
        setTimeout(() => successModal.classList.add('show'), 10);
    }

    function hideSuccessModal() {
        successModal.classList.remove('show');
        setTimeout(() => {
            successModal.style.display = 'none';
        }, 300);
    }

    successOkBtn.onclick = hideSuccessModal;

    // Show modal with login check
    addBtn.onclick = function() {
        const userEmail = localStorage.getItem('userEmail');
        if (!userEmail) {
            alert('Please login to add a property');
            window.location.href = 'signin.html';
            return;
        }
        showModal(false);
    }

    function hideModal() {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }

    // Close modal
    closeBtn.onclick = hideModal;

    cancelBtn.onclick = hideModal;

    // Close modal when clicking outside
    window.onclick = function(event) {
        if (event.target === modal) {
            hideModal();
        }
    }

    function showModal(isEditing = false, property = null) {
        const modalTitle = document.getElementById('modalTitle');
        const submitBtn = document.getElementById('submitBtn');
        
        if (isEditing && property) {
            modalTitle.textContent = 'Edit Property';
            submitBtn.textContent = 'Update Property';
            
            // Fill form with property data
            document.getElementById('propertyType').value = property.propertyType;
            document.getElementById('bhk').value = property.bhk;
            document.getElementById('bedrooms').value = property.bedrooms;
            document.getElementById('bathrooms').value = property.bathrooms;
            document.getElementById('area').value = property.area;
            document.getElementById('price').value = property.price;
            document.getElementById('description').value = property.description;
            document.getElementById('address').value = property.address;
            document.getElementById('imageLink').value = property.imageLink;

            // Check amenities
            document.querySelectorAll('.amenities-container input[type="checkbox"]').forEach(checkbox => {
                checkbox.checked = property.amenities.includes(checkbox.value);
            });

            propertyForm.dataset.editId = property._id;
        } else {
            modalTitle.textContent = 'Add New Property';
            submitBtn.textContent = 'Add Property';
            propertyForm.reset();
            delete propertyForm.dataset.editId;
        }

        modal.style.display = 'block';
        setTimeout(() => modal.classList.add('show'), 10);
    }

    // Handle form submission
    propertyForm.onsubmit = async function(e) {
        e.preventDefault();
        
        const userEmail = localStorage.getItem('userEmail');
        if (!userEmail) {
            alert('Please login to manage properties');
            return;
        }

        try {
            const userResponse = await fetch(`http://localhost:5000/api/user/${userEmail}`);
            const userData = await userResponse.json();

            if (!userData.success) throw new Error('Could not fetch user data');

            const propertyData = {
                propertyType: document.getElementById('propertyType').value,
                bhk: document.getElementById('bhk').value,
                bedrooms: parseInt(document.getElementById('bedrooms').value),
                bathrooms: parseInt(document.getElementById('bathrooms').value),
                area: parseInt(document.getElementById('area').value),
                price: parseInt(document.getElementById('price').value),
                description: document.getElementById('description').value,
                address: document.getElementById('address').value,
                amenities: Array.from(document.querySelectorAll('.amenities-container input:checked'))
                    .map(checkbox => checkbox.value),
                imageLink: document.getElementById('imageLink').value,
                sellerId: userData.userData._id
            };

            const editId = propertyForm.dataset.editId;
            const url = editId 
                ? `http://localhost:5000/api/selling-properties/${editId}`
                : 'http://localhost:5000/api/selling-properties';
            
            const response = await fetch(url, {
                method: editId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(propertyData)
            });

            const data = await response.json();

            if (data.success) {
                const message = editId ? 
                    'Property updated successfully!' : 
                    'Property listed successfully!';
                hideModal();
                showSuccessModal(message);
                loadProperties();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error managing property. Please try again.');
        }
    };

    // Modified loadProperties function
    async function loadProperties() {
        const userEmail = localStorage.getItem('userEmail');
        if (!userEmail) return;

        try {
            // First get the user details
            const userResponse = await fetch(`http://localhost:5000/api/user/${userEmail}`);
            const userData = await userResponse.json();

            if (!userData.success) {
                throw new Error('Could not fetch user data');
            }

            // Then load the properties
            const response = await fetch(`http://localhost:5000/api/selling-properties/${userData.userData._id}`);
            const data = await response.json();

            if (data.success) {
                const propertiesContainer = document.getElementById('my-properties');
                propertiesContainer.innerHTML = ''; // Clear existing properties
                data.properties.forEach(property => addPropertyToDisplay(property));
            }
        } catch (error) {
            console.error('Error loading properties:', error);
        }
    }

    function addPropertyToDisplay(property) {
        const propertyCard = document.createElement('div');
        propertyCard.className = 'property-card';
        propertyCard.dataset.id = property._id;

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
            <div class="card-actions">
                <div class="edit-icon" title="Edit Property">
                    <i class="fas fa-edit"></i>
                </div>
                <div class="delete-icon" title="Delete Property">
                    <i class="fas fa-trash"></i>
                </div>
            </div>
        `;

        // Add delete functionality
        const deleteIcon = propertyCard.querySelector('.delete-icon');
        deleteIcon.onclick = function() {
            showDeleteModal(property._id);
        };

        // Add edit functionality
        const editIcon = propertyCard.querySelector('.edit-icon');
        editIcon.onclick = function() {
            handleEditClick(property);
        };

        propertiesContainer.prepend(propertyCard);
    }

    function handleEditClick(property) {
        showModal(true, property);
    }

    // Add fadeOut animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeOut {
            to {
                opacity: 0;
                transform: translateY(20px);
            }
        }
    `;
    document.head.appendChild(style);

    // Initial load
    loadProperties();

    // Add these functions at the end of the DOMContentLoaded event listener
    const deleteModal = document.getElementById('deleteModal');
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    const cancelDeleteBtn = document.getElementById('cancelDelete');
    let propertyToDelete = null;

    function showDeleteModal(propertyId) {
        propertyToDelete = propertyId;
        deleteModal.style.display = 'block';
        setTimeout(() => deleteModal.classList.add('show'), 10);
    }

    function hideDeleteModal() {
        deleteModal.classList.remove('show');
        setTimeout(() => {
            deleteModal.style.display = 'none';
            propertyToDelete = null;
        }, 300);
    }

    confirmDeleteBtn.onclick = async function() {
        if (propertyToDelete) {
            try {
                const response = await fetch(`http://localhost:5000/api/selling-properties/${propertyToDelete}`, {
                    method: 'DELETE'
                });
                const data = await response.json();
                
                if (data.success) {
                    const propertyCard = document.querySelector(`.property-card[data-id="${propertyToDelete}"]`);
                    if (propertyCard) {
                        propertyCard.remove();
                    }
                    showSuccessModal('Property deleted successfully!');
                }
            } catch (error) {
                console.error('Error deleting property:', error);
                alert('Error deleting property. Please try again.');
            }
        }
        hideDeleteModal();
    };

    cancelDeleteBtn.onclick = hideDeleteModal;

    // Close modal when clicking outside
    window.onclick = function(event) {
        if (event.target === modal) {
            hideModal();
        } else if (event.target === deleteModal) {
            hideDeleteModal();
        }
    };
});
