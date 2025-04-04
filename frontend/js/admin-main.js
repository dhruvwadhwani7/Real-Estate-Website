document.addEventListener('DOMContentLoaded', function() {
    // Check if user is admin
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (!userData || userData.userType !== 'admin') {
        window.location.href = 'signIn.html';
        return;
    }

    // Initialize admin dashboard
    initializeDashboard();

    // Add active class to current nav item
    const navLinks = document.querySelectorAll('.nav-links a:not(.dropdown a)');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Handle dropdown menu
    const dropdowns = document.querySelectorAll('.dropdown');
    dropdowns.forEach(dropdown => {
        dropdown.addEventListener('mouseenter', function() {
            this.querySelector('.dropdown-content').style.display = 'block';
        });
        
        dropdown.addEventListener('mouseleave', function() {
            this.querySelector('.dropdown-content').style.display = 'none';
        });
    });
});

let userDistributionChart = null;
let userGrowthChart = null;

async function fetchUserStats() {
    try {
        const response = await fetch('http://localhost:5000/api/users/stats');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        
        if (data.success) {
            updateStatBoxes(data.stats);
            updateUserDistributionChart(data.stats);
            updateUserGrowthChart(data.stats.growthData);
        } else {
            console.error('Failed to fetch stats:', data.message);
        }
    } catch (error) {
        console.error('Error fetching user stats:', error);
        displayErrorMessage('Failed to load user statistics');
    }
}

function updateStatBoxes(stats) {
    // Add animation effect for number updates
    animateNumber('sellerCount', stats.sellers);
    animateNumber('buyerCount', stats.buyers);
    animateNumber('adminCount', stats.admins);
}

function animateNumber(elementId, finalValue) {
    const element = document.getElementById(elementId);
    const startValue = parseInt(element.textContent) || 0;
    const duration = 1000; // 1 second animation
    const steps = 20;
    const stepValue = (finalValue - startValue) / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
        currentStep++;
        const currentValue = Math.floor(startValue + (stepValue * currentStep));
        element.textContent = currentValue;

        if (currentStep >= steps) {
            element.textContent = finalValue;
            clearInterval(interval);
        }
    }, duration / steps);
}

function updateUserDistributionChart(stats) {
    const ctx = document.getElementById('userDistributionChart').getContext('2d');
    
    if (userDistributionChart) {
        userDistributionChart.destroy();
    }

    userDistributionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Sellers', 'Buyers', 'Admins'],
            datasets: [{
                data: [stats.sellers, stats.buyers, stats.admins],
                backgroundColor: ['#e67e22', '#3498db', '#2ecc71'],
                borderWidth: 1,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        font: {
                            size: 14,
                            family: "'Poppins', sans-serif"
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'User Distribution',
                    font: {
                        size: 16,
                        family: "'Poppins', sans-serif",
                        weight: 'bold'
                    }
                }
            },
            animation: {
                animateScale: true,
                animateRotate: true
            }
        }
    });
}

function updateUserGrowthChart(growthData) {
    const ctx = document.getElementById('userGrowthChart').getContext('2d');
    
    // Process data for the line chart
    const datasets = {
        seller: { label: 'Sellers', color: '#e67e22' },
        buyer: { label: 'Buyers', color: '#3498db' },
        admin: { label: 'Admins', color: '#2ecc71' }
    };

    const processedData = Object.keys(datasets).map(userType => {
        const data = growthData
            .filter(item => item._id.userType === userType)
            .map(item => ({
                x: item._id.day,
                y: item.count
            }));

        return {
            label: datasets[userType].label,
            data: data,
            borderColor: datasets[userType].color,
            backgroundColor: datasets[userType].color + '20',
            fill: true,
            tension: 0.4
        };
    });

    if (userGrowthChart) {
        userGrowthChart.destroy();
    }

    userGrowthChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: processedData
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day'
                    },
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Users'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom'
                },
                title: {
                    display: true,
                    text: 'User Growth Trend'
                }
            }
        }
    });
}

function displayErrorMessage(message) {
    // Add error message display logic if needed
    console.error(message);
}

// Modify the initializeDashboard function
function initializeDashboard() {
    const adminName = JSON.parse(localStorage.getItem('userData'))?.fullName || 'Admin';
    document.querySelector('#adminName').textContent = adminName;
    
    // Fetch initial stats
    fetchUserStats();
    
    // Set up periodic refresh (every 30 seconds)
    setInterval(fetchUserStats, 30000);
}

function logout() {
    localStorage.removeItem('userData');
    localStorage.removeItem('userEmail');
    window.location.href = 'signIn.html';
}

// User List Modal Functionality
const modal = document.getElementById('userListModal');
const btn = document.getElementById('showUserList');
const span = document.getElementsByClassName('close')[0];
const userTypeFilter = document.getElementById('userTypeFilter');
let allUsers = []; // Store all users for filtering

// Update modal show/hide functions
btn.onclick = async function() {
    modal.style.display = "block";
    document.body.classList.add('modal-open');
    await fetchAndDisplayUsers();
}

span.onclick = function() {
    modal.style.display = "none";
    document.body.classList.remove('modal-open');
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
        document.body.classList.remove('modal-open');
    }
}

// Fetch and display users
async function fetchAndDisplayUsers() {
    try {
        const response = await fetch('http://localhost:5000/api/users/list');
        const data = await response.json();
        
        if (data.success) {
            allUsers = data.users;
            displayFilteredUsers(userTypeFilter.value); // Use current filter value
        } else {
            console.error('Failed to fetch users:', data.message);
        }
    } catch (error) {
        console.error('Error fetching users:', error);
    }
}

// Filter users
userTypeFilter.addEventListener('change', (e) => {
    displayFilteredUsers(e.target.value);
});

// Update displayFilteredUsers function
function displayFilteredUsers(filterType) {
    const tbody = document.querySelector('#userTable tbody');
    tbody.innerHTML = '';

    let filteredUsers;
    if (filterType === 'all') {
        filteredUsers = allUsers;
    } else {
        filteredUsers = allUsers.filter(user => user.userType.toLowerCase() === filterType.toLowerCase());
    }

    if (filteredUsers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="no-data">No ${filterType} users found</td>
            </tr>`;
        return;
    }

    filteredUsers.forEach(user => {
        // Escape HTML to prevent XSS
        const escapedName = user.fullName.replace(/[&<>"']/g, c => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[c]);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${escapedName || 'N/A'}</td>
            <td>${user.email || 'N/A'}</td>
            <td>${user.phone || 'N/A'}</td>
            <td>${capitalizeFirstLetter(user.userType) || 'N/A'}</td>
            <td class="action-cell">
                ${user.userType !== 'admin' ? 
                    `<button class="delete-btn" onclick="deleteUser('${user._id}', '${escapedName}')">
                        <i class="fas fa-trash-alt"></i>
                    </button>` : 
                    ''}
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Add deleteUser function
async function deleteUser(userId, userName) {
    try {
        // Add user confirmation
        if (!confirm(`Are you sure you want to delete user ${userName}?`)) {
            return;
        }

        console.log('Deleting user:', userId); // Debug log

        const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
            // Remove user from allUsers array
            allUsers = allUsers.filter(user => user._id !== userId);
            
            // Refresh the display
            displayFilteredUsers(userTypeFilter.value);
            
            // Refresh stats
            fetchUserStats();
            
            // Show success message
            alert('User deleted successfully');
        } else {
            throw new Error(data.message || 'Error deleting user');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user: ' + error.message);
    }
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
