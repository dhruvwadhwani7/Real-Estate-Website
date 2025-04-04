// Scroll reveal functionality
function reveal() {
    const reveals = document.querySelectorAll('.reveal');
    
    reveals.forEach(element => {
        const windowHeight = window.innerHeight;
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < windowHeight - elementVisible) {
            element.classList.add('active');
        }
    });
}

window.addEventListener('scroll', reveal);

// Add hover animations
document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-15px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Properties page animations
if (window.location.pathname.includes('properties.html')) {
    // Fade in navigation elements
    const nav = document.querySelector('nav');
    nav.style.opacity = 0;
    window.addEventListener('load', () => {
        nav.style.transition = 'opacity 0.5s ease';
        nav.style.opacity = 1;
    });

    // Animate filter section
    const filterSection = document.querySelector('.filter-section');
    filterSection.style.opacity = 0;
    filterSection.style.transform = 'translateY(20px)';
    
    window.addEventListener('load', () => {
        setTimeout(() => {
            filterSection.style.transition = 'all 0.8s ease';
            filterSection.style.opacity = 1;
            filterSection.style.transform = 'translateY(0)';
        }, 300);
    });

    // Animate property cards
    const propertyCards = document.querySelectorAll('.property-card');
    propertyCards.forEach((card, index) => {
        card.style.opacity = 0;
        card.style.transform = 'translateY(20px)';
        
        window.addEventListener('load', () => {
            setTimeout(() => {
                card.style.transition = 'all 0.8s ease';
                card.style.opacity = 1;
                card.style.transform = 'translateY(0)';
            }, 500 + (index * 200)); // Stagger the animation of cards
        });
    });

    // Properties page button animations
    const authButtons = document.querySelectorAll('.sign-in, .sign-up');
    
    authButtons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px)';
            this.style.boxShadow = '0 5px 15px rgba(52, 152, 219, 0.3)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
    });
}
