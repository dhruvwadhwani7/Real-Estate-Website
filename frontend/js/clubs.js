let currentClub = null;
let currentImageIndex = 0;

async function loadClubData() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const clubId = urlParams.get('id');
        
        const response = await fetch('../js/clubData.json');
        const clubs = await response.json();
        
        currentClub = clubs.find(club => club['Club ID'] === clubId);
        if (!currentClub) throw new Error('Club not found');
        
        displayClubData();
        displayOtherClubs(clubId); // Add this line
        initializeScrollButtons(); // Add this line
    } catch (error) {
        console.error('Error loading club data:', error);
    }
}

function displayClubData() {
    // Set basic info
    document.getElementById('clubName').textContent = currentClub.Name;
    document.getElementById('clubType').textContent = currentClub.Type;
    document.getElementById('clubDescription').textContent = currentClub.Description;
    document.getElementById('operatingHours').textContent = currentClub.Details['Operating Hours'];

    // Set main image
    const mainImage = document.getElementById('mainImage');
    mainImage.src = currentClub.Image.Main;
    
    // Setup gallery
    setupGallery(currentClub.Image.Gallery);
    
    // Setup facilities
    const facilitiesGrid = document.getElementById('facilitiesGrid');
    Object.entries(currentClub.Details.Facilities).forEach(([name, desc]) => {
        facilitiesGrid.innerHTML += `
            <div class="facility-item">
                <h3>${name}</h3>
                <p>${desc}</p>
            </div>
        `;
    });

    // Setup services
    const servicesGrid = document.getElementById('servicesGrid');
    currentClub.Details.Services.forEach(service => {
        servicesGrid.innerHTML += `
            <div class="service-item">
                <i class="fas fa-check-circle"></i>
                <span>${service}</span>
            </div>
        `;
    });

    // Setup amenities
    const amenitiesGrid = document.getElementById('amenitiesGrid');
    currentClub.Details['Additional Amenities'].forEach(amenity => {
        amenitiesGrid.innerHTML += `
            <div class="amenity-item">
                <i class="fas fa-star"></i>
                <span>${amenity}</span>
            </div>
        `;
    });

    // Setup membership types
    const membershipTypes = document.getElementById('membershipTypes');
    currentClub.Details['Membership Types'].forEach(type => {
        membershipTypes.innerHTML += `
            <div class="membership-type">
                <h4>${type}</h4>
            </div>
        `;
    });

    // Remove membership select reference since form is removed
    
    // Rest of the display functions remain the same
    const pricingGrid = document.getElementById('pricingGrid');
    currentClub.Details.PricingPlans.forEach(plan => {
        pricingGrid.innerHTML += `
            <div class="pricing-card">
                <h3>${plan.name}</h3>
                <div class="price">${plan.price}</div>
                <ul>
                    ${plan.features.map(feature => `
                        <li><i class="fas fa-check"></i>${feature}</li>
                    `).join('')}
                </ul>
            </div>
        `;
    });

    // Setup events
    const eventsGrid = document.getElementById('eventsGrid');
    currentClub.Details.Events.forEach(event => {
        eventsGrid.innerHTML += `
            <div class="event-card">
                <h4>${event.name}</h4>
                <div class="event-date"><i class="fas fa-calendar"></i>${event.date}</div>
                <p>${event.description}</p>
            </div>
        `;
    });

    // Setup special features
    const specialFeaturesGrid = document.getElementById('specialFeaturesGrid');
    currentClub.Details.SpecialFeatures.forEach(feature => {
        specialFeaturesGrid.innerHTML += `
            <div class="feature-card">
                <i class="fas fa-${feature.icon}"></i>
                <h4>${feature.name}</h4>
                <p>${feature.description}</p>
            </div>
        `;
    });
}

function setupGallery(images) {
    const container = document.getElementById('thumbnailContainer');
    container.innerHTML = ''; // Clear existing thumbnails
    
    // Add main image as first thumbnail
    const mainThumb = document.createElement('img');
    mainThumb.src = currentClub.Image.Main;
    mainThumb.onclick = () => changeImage(-1); // -1 indicates main image
    container.appendChild(mainThumb);
    
    // Add gallery images
    images.forEach((img, index) => {
        const thumb = document.createElement('img');
        thumb.src = img;
        thumb.onclick = () => changeImage(index);
        container.appendChild(thumb);
    });
}

function changeImage(index) {
    const mainImage = document.getElementById('mainImage');
    if (index === -1) {
        mainImage.src = currentClub.Image.Main;
    } else {
        currentImageIndex = index;
        mainImage.src = currentClub.Image.Gallery[index];
    }
}

function prevImage() {
    currentImageIndex = (currentImageIndex - 1 + currentClub.Image.Gallery.length) % currentClub.Image.Gallery.length;
    changeImage(currentImageIndex);
}

function nextImage() {
    currentImageIndex = (currentImageIndex + 1) % currentClub.Image.Gallery.length;
    changeImage(currentImageIndex);
}

function openGalleryModal() {
    const modal = document.getElementById('galleryModal');
    const galleryGrid = document.getElementById('fullGalleryGrid');
    
    // Clear existing images
    galleryGrid.innerHTML = '';
    
    // Create array of all images
    const allImages = [currentClub.Image.Main, ...currentClub.Image.Gallery];
    
    // Add images to grid
    allImages.forEach((imgSrc, index) => {
        const imgContainer = document.createElement('div');
        imgContainer.className = 'gallery-grid-item';
        
        const img = document.createElement('img');
        img.src = imgSrc;
        img.alt = `Club Image ${index + 1}`;
        img.loading = 'lazy'; // Add lazy loading
        img.onclick = () => openImageModal(imgSrc);
        
        // Add fade-in animation
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease';
        
        img.onload = () => {
            img.style.opacity = '1';
        };
        
        imgContainer.appendChild(img);
        galleryGrid.appendChild(imgContainer);
    });
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function openImageModal(imgSrc) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    modalImg.src = imgSrc;
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeGalleryModal() {
    document.getElementById('galleryModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function closeImageModal() {
    document.getElementById('imageModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Add event listeners to close modals when clicking outside
window.onclick = function(event) {
    const galleryModal = document.getElementById('galleryModal');
    const imageModal = document.getElementById('imageModal');
    
    if (event.target === galleryModal) {
        closeGalleryModal();
    }
    if (event.target === imageModal) {
        closeImageModal();
    }
}

// Add keyboard support for closing modals
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeGalleryModal();
        closeImageModal();
    }
});

// Load club data when page loads
document.addEventListener('DOMContentLoaded', loadClubData);

function displayOtherClubs(currentClubId) {
    const clubNavLinks = document.getElementById('clubNavLinks');
    clubNavLinks.innerHTML = ''; // Clear existing content

    // Fetch and display other clubs
    fetch('../js/clubData.json')
        .then(response => response.json())
        .then(clubs => {
            clubs.forEach(club => {
                // Skip current club
                if (club['Club ID'] === currentClubId) return;

                const clubLink = document.createElement('a');
                clubLink.href = `club2.html?id=${club['Club ID']}`;
                clubLink.className = 'club-nav-item';
                clubLink.innerHTML = `
                    <div class="club-nav-image">
                        <img src="${club.Image.Main}" alt="${club.Name}">
                    </div>
                    <div class="club-nav-content">
                        <div class="club-nav-title">${club.Name}</div>
                        <div class="club-nav-type">${club.Type}</div>
                        <div class="club-nav-features">
                            <span class="club-nav-feature">
                                <i class="fas fa-clock"></i>
                                ${club.Details['Operating Hours']}
                            </span>
                        </div>
                    </div>
                `;
                clubNavLinks.appendChild(clubLink);
            });
        })
        .catch(error => console.error('Error loading other clubs:', error));
}

function initializeScrollButtons() {
    const container = document.querySelector('.clubs-horizontal-scroll');
    const prevBtn = document.querySelector('.scroll-btn.prev');
    const nextBtn = document.querySelector('.scroll-btn.next');

    if (!container || !prevBtn || !nextBtn) return;

    prevBtn.addEventListener('click', () => {
        container.scrollBy({
            left: -320,
            behavior: 'smooth'
        });
    });

    nextBtn.addEventListener('click', () => {
        container.scrollBy({
            left: 320,
            behavior: 'smooth'
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('emailModal');
    const closeBtn = document.querySelector('.close-email-modal');
    const clubSelect = document.getElementById('clubSelect');

    // Populate club select
    fetch('../js/clubData.json')
        .then(response => response.json())
        .then(clubs => {
            clubs.forEach(club => {
                const option = document.createElement('option');
                option.value = club['Club ID'];
                option.textContent = club.Name;
                clubSelect.appendChild(option);
            });
            
            // Set current club as selected if available
            if (currentClub) {
                clubSelect.value = currentClub['Club ID'];
            }
        });

    // Handle email form submission
    document.getElementById('emailForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const emailModal = document.getElementById('emailModal');
        const loadingSpinner = document.getElementById('loadingSpinner');
        const successModal = document.getElementById('successModal');

        try {
            const selectedClub = await getClubDetails(clubSelect.value);
            const formData = {
                senderName: document.getElementById('senderName').value,
                senderEmail: document.getElementById('senderEmail').value,
                message: document.getElementById('message').value,
                clubDetails: {
                    id: selectedClub['Club ID'],
                    name: selectedClub.Name,
                    type: selectedClub.Type,
                    description: selectedClub.Description,
                    operatingHours: selectedClub.Details['Operating Hours'],
                    mainImage: selectedClub.Image.Main,
                    facilities: selectedClub.Details.Facilities,
                    services: selectedClub.Details.Services
                }
            };

            // Hide email modal and show loading spinner
            emailModal.style.display = 'none';
            loadingSpinner.style.display = 'flex';

            const response = await fetch('http://localhost:5000/api/share-club', {
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

    // Add email modal open/close handlers
    const emailBtn = document.querySelector('.share-btn.email');
    const emailModal = document.getElementById('emailModal');
    const closeEmailBtn = document.querySelector('.close-email-modal');

    emailBtn.addEventListener('click', () => {
        emailModal.style.display = 'block';
    });

    closeEmailBtn.addEventListener('click', () => {
        emailModal.style.display = 'none';
    });

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === emailModal) {
            emailModal.style.display = 'none';
        }
    });
});

async function getClubDetails(clubId) {
    const response = await fetch('../js/clubData.json');
    const clubs = await response.json();
    return clubs.find(club => club['Club ID'] === clubId);
}
