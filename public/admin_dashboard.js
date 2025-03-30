function toggleLeftNavbar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    sidebar.classList.toggle('active');
    mainContent.classList.toggle('shifted');
}

// Close sidebar when clicking outside
document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.querySelector('.menu-btn');

    if (!sidebar.contains(e.target) && !menuBtn.contains(e.target) && sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
    }
});

// Highlight current page in navigation
document.addEventListener('DOMContentLoaded', () => {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.sidebar a');

    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.parentElement.classList.add('active');
        } else {
            link.parentElement.classList.remove('active');
        }
    });
});

// Toggle Notifications
function toggleNotifications() {
    const notificationsDropdown = document.getElementById('notifications-dropdown');
    notificationsDropdown.style.display = notificationsDropdown.style.display === 'block' ? 'none' : 'block';
}

// Toggle Profile Dropdown
function toggleProfileDropdown() {
    const dropdown = document.getElementById('profile-dropdown');
    dropdown.classList.toggle('show');
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const profileIcon = document.querySelector('.profile-icon');
    const dropdown = document.getElementById('profile-dropdown');

    if (!profileIcon.contains(e.target) && dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
    }
});

// Toggle Dark Mode
function toggleDarkMode() {
    const body = document.body;
    body.classList.toggle('dark-mode');
}

document.addEventListener('DOMContentLoaded', function () {
    // Simulated user data (Replace with actual user data retrieval)
    const user = {
        name: "John Doe", // Change dynamically
        gender: "male" // Change dynamically to "female" if needed
    };

    // Set user name
    document.getElementById("user-name").textContent = user.name;

    // Set appropriate icon based on gender
    const profileIcon = document.getElementById("profile-icon");
    profileIcon.classList.add(user.gender === "male" ? "fa-male" : "fa-female");

    const statsData = {
        totalUsers: { value: 78250, change: 70.5, extra: 8900 },
        activeUsers: { value: 15000, change: 55.2, extra: 4500 },
        totalRevenue: { value: 35078, change: 27.4, extra: 20395 },
        totalCollaborations: { value: 1250, change: 40.8, extra: 520 }
    };

    document.getElementById('totalUsers').innerHTML = `${statsData.totalUsers.value} <span class="badge green">&#9633; ${statsData.totalUsers.change}%</span>`;
    document.getElementById('extraUsers').textContent = statsData.totalUsers.extra;

    document.getElementById('activeUsers').innerHTML = `${statsData.activeUsers.value} <span class="badge blue">&#9633; ${statsData.activeUsers.change}%</span>`;
    document.getElementById('extraActiveUsers').textContent = statsData.activeUsers.extra;

    document.getElementById('totalRevenue').innerHTML = `$${statsData.totalRevenue.value} <span class="badge red">&#9633; ${statsData.totalRevenue.change}%</span>`;
    document.getElementById('extraRevenue').textContent = `$${statsData.totalRevenue.extra}`;

    document.getElementById('totalCollaborations').innerHTML = `${statsData.totalCollaborations.value} <span class="badge yellow">&#9633; ${statsData.totalCollaborations.change}%</span>`;
    document.getElementById('extraCollaborations').textContent = statsData.totalCollaborations.extra;
});

// First, let's get all the chart data from the EJS template
const monthlyRevenueData = JSON.parse(document.getElementById('monthlyRevenueChart').getAttribute('data-revenue') || '[]');
const analyticsData = Array.from(document.querySelectorAll('[data-chart]')).map(el => ({
    id: el.id,
    data: JSON.parse(el.getAttribute('data-chart') || '{}')
}));

// Initialize Performance Analytics Charts
function initPerformanceCharts() {
    analyticsData.forEach(chart => {
        const ctx = document.getElementById(chart.id).getContext('2d');
        const chartConfig = getChartConfig(chart.data);
        new Chart(ctx, chartConfig);
    });
}

// Chart configuration generator
function getChartConfig(data) {
    const defaultConfig = {
        type: data.type || 'line',
        data: {
            labels: data.labels || [],
            datasets: [{
                label: data.label || '',
                data: data.values || [],
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        borderDash: [2, 4]
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    };

    // Customize based on chart type
    if (data.type === 'doughnut' || data.type === 'pie') {
        defaultConfig.options.cutout = '60%';
        defaultConfig.data.datasets[0].backgroundColor = [
            'rgba(0, 123, 255, 0.8)',
            'rgba(40, 167, 69, 0.8)',
            'rgba(255, 193, 7, 0.8)',
            'rgba(220, 53, 69, 0.8)'
        ];
    }

    return defaultConfig;
}

// Sidebar toggle functionality
function toggleLeftNavbar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    sidebar.classList.toggle('active');
    mainContent.classList.toggle('shifted');
}

// Profile dropdown toggle
function toggleProfileDropdown() {
    const dropdown = document.getElementById('profile-dropdown');
    dropdown.classList.toggle('show');
}

// Notifications dropdown toggle
function toggleNotifications() {
    const dropdown = document.getElementById('notifications-dropdown');
    dropdown.classList.toggle('show');
}

// Dark mode toggle
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const icon = document.querySelector('.dark-mode-toggle i');
    if (document.body.classList.contains('dark-mode')) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
}

// Mark all notifications as read
function markAllAsRead() {
    const unreadNotifications = document.querySelectorAll('.notification-item.unread');
    unreadNotifications.forEach(notification => {
        notification.classList.remove('unread');
    });
    document.getElementById('notification-count').style.display = 'none';
}

// Handle logout
function handleLogout() {
    // Add your logout logic here
    window.location.href = '/logout';
}

// Initialize all charts when the DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    initMonthlyRevenueChart();
    initPerformanceCharts();

    // Close dropdowns when clicking outside
    document.addEventListener('click', function (event) {
        if (!event.target.closest('.profile')) {
            const profileDropdown = document.getElementById('profile-dropdown');
            if (profileDropdown.classList.contains('show')) {
                profileDropdown.classList.remove('show');
            }
        }
        if (!event.target.closest('.notifications')) {
            const notificationsDropdown = document.getElementById('notifications-dropdown');
            if (notificationsDropdown.classList.contains('show')) {
                notificationsDropdown.classList.remove('show');
            }
        }
    });
});