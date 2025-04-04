document.addEventListener('DOMContentLoaded', function() {
    // Check user type and redirect if necessary
    const userData = JSON.parse(localStorage.getItem('userData'));
    const currentPage = window.location.pathname.split('/').pop();

    if (!userData) {
        // No user data, redirect to sign in
        window.location.href = 'signIn.html';
        return;
    }

    // Redirect if user is on wrong page
    if (userData.userType === 'seller' && currentPage === 'home2.html') {
        window.location.href = 'home3.html';
    } else if (userData.userType === 'buyer' && currentPage === 'home3.html') {
        window.location.href = 'home2.html';
    }

    // ...existing code for other functionality...
});

window.addEventListener('scroll', function() {
    const nav = document.querySelector('nav');
    const heroHeight = document.querySelector('.header-hero').offsetHeight;
    const profileBtn = document.querySelector('.profile-btn');
    const logoutBtn = document.querySelector('.logout-btn');
    
    if (window.scrollY >= heroHeight - 100) {
        nav.classList.add('nav-scrolled');
        profileBtn.querySelector('i').style.color = '#2c3e50';
        logoutBtn.querySelector('i').style.color = '#2c3e50';
    } else {
        nav.classList.remove('nav-scrolled');
        profileBtn.querySelector('i').style.color = 'white';
        logoutBtn.querySelector('i').style.color = 'white';
    }
});

// Hamburger menu functionality
const hamburger = document.querySelector('.hamburger');
const mobileMenu = document.querySelector('.mobile-menu');
const mobileMenuLinks = document.querySelectorAll('.mobile-menu-links a');
const menuOverlay = document.querySelector('.menu-overlay');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    mobileMenu.classList.toggle('active');
    menuOverlay.classList.toggle('active');
    document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : 'auto';
});

// Close menu when clicking a link
mobileMenuLinks.forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        mobileMenu.classList.remove('active');
        menuOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    });
});

// Close menu when clicking overlay
menuOverlay.addEventListener('click', () => {
    hamburger.classList.remove('active');
    mobileMenu.classList.remove('active');
    menuOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
});

// Handle active state for mobile menu links
const mobileLinks = document.querySelectorAll('.mobile-menu-links a');

mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
        mobileLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
    });
});

// Set initial active state based on current URL
function setInitialActiveState() {
    const currentHash = window.location.hash || '#home';
    mobileLinks.forEach(link => {
        if (link.getAttribute('href') === currentHash) {
            link.classList.add('active');
        }
    });
}

setInitialActiveState();

// Enhanced Project Slider Functionality
const projectsGrid = document.querySelector('.projects-grid');
const prevBtn = document.querySelector('.prev');
const nextBtn = document.querySelector('.next');
let currentSlide = 0;
const totalGroups = document.querySelectorAll('.project-group').length;

function updateSliderPosition() {
    const offset = currentSlide * -100;
    projectsGrid.style.transform = `translateX(${offset}%)`;
}

function moveSlide(direction) {
    currentSlide = Math.max(0, Math.min(totalGroups - 1, currentSlide + direction));
    updateSliderPosition();
    
    // Update button states
    prevBtn.style.opacity = currentSlide === 0 ? '0.5' : '1';
    prevBtn.style.cursor = currentSlide === 0 ? 'not-allowed' : 'pointer';
    
    nextBtn.style.opacity = currentSlide === totalGroups - 1 ? '0.5' : '1';
    nextBtn.style.cursor = currentSlide === totalGroups - 1 ? 'not-allowed' : 'pointer';
}

prevBtn.addEventListener('click', () => {
    if (currentSlide > 0) moveSlide(-1);
});

nextBtn.addEventListener('click', () => {
    if (currentSlide < totalGroups - 1) moveSlide(1);
});

// Initialize
moveSlide(0);

// Update on window resize
window.addEventListener('resize', () => {
    const newSlidesPerView = window.innerWidth > 1200 ? 3 : window.innerWidth > 768 ? 2 : 1;
    if (newSlidesPerView !== slidesPerView) {
        location.reload();
    }
});

// Add touch swipe functionality
const projectsContainer = document.querySelector('.projects-slider-container');
let touchStartX = 0;
let touchEndX = 0;

projectsContainer.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
}, false);

projectsContainer.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].clientX;
    handleSwipe();
}, false);

// Add trackpad swipe functionality
projectsContainer.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        if (e.deltaX > 50) {
            if (currentSlide < totalGroups - 1) moveSlide(1);
        } else if (e.deltaX < -50) {
            if (currentSlide > 0) moveSlide(-1);
        }
    }
}, { passive: false });

function handleSwipe() {
    const swipeDistance = touchEndX - touchStartX;
    if (Math.abs(swipeDistance) > 50) { // Minimum swipe distance
        if (swipeDistance > 0) {
            // Swipe right
            if (currentSlide > 0) moveSlide(-1);
        } else {
            // Swipe left
            if (currentSlide < totalGroups - 1) moveSlide(1);
        }
    }
}

// Updated Social Club Content Rotation
const clubInfo = [
    {
        name: "The Grand Club",
        description: "Experience luxury living with world-class amenities including:",
        features: ["Indoor & Outdoor Pools", "State-of-the-art Fitness Center", "Sports Facilities", "Fine Dining Restaurant"]
    },
    {
        name: "Wellness Center",
        description: "Rejuvenate your mind and body with our premium facilities:",
        features: ["Spa & Sauna", "Yoga Studio", "Meditation Garden", "Professional Trainers"]
    },
    {
        name: "Sports Complex",
        description: "Stay active with our comprehensive sports facilities:",
        features: ["Tennis Courts", "Squash Courts", "Cricket Nets", "Basketball Court"]
    },
    {
        name: "Entertainment Hub",
        description: "Enjoy quality time with family and friends:",
        features: ["Movie Theatre", "Games Room", "Party Hall", "Children's Play Area"]
    }
];

let currentClubIndex = 0;
const ROTATION_INTERVAL = 5000; // 5 seconds per content change

function updateClubContent() {
    const club = clubInfo[currentClubIndex];
    const clubNameElement = document.querySelector('.club-name');
    const clubDescElement = document.querySelector('.club-description');
    const featuresList = document.querySelector('.club-features');
    
    // Add fade out effect
    clubNameElement.style.opacity = '0';
    clubDescElement.style.opacity = '0';
    featuresList.style.opacity = '0';
    
    setTimeout(() => {
        // Update content
        clubNameElement.textContent = club.name;
        clubDescElement.textContent = club.description;
        featuresList.innerHTML = club.features.map(feature => 
            `<li><i class="fas fa-check"></i>${feature}</li>`
        ).join('');
        
        // Fade in new content
        clubNameElement.style.opacity = '1';
        clubDescElement.style.opacity = '1';
        featuresList.style.opacity = '1';
    }, 500);
    
    currentClubIndex = (currentClubIndex + 1) % clubInfo.length;
}

// Initial update
updateClubContent();

// Set interval for content rotation
setInterval(updateClubContent, ROTATION_INTERVAL);
