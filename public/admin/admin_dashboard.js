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
    const themeIcon = document.getElementById('theme-icon');
    const isDarkMode = body.classList.toggle('dark-mode');
    
    // Update icon based on current mode
    if (isDarkMode) {
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
        localStorage.setItem('darkMode', 'enabled');
    } else {
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
        localStorage.setItem('darkMode', 'disabled');
    }
}

// Initialize theme on page load
function initializeTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');
    const savedTheme = localStorage.getItem('darkMode');
    
    if (savedTheme === 'enabled') {
        body.classList.add('dark-mode');
        if (themeIcon) {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        }
    } else {
        body.classList.remove('dark-mode');
        if (themeIcon) {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }
    }
}

document.addEventListener('DOMContentLoaded', function () {
    // Initialize theme
    initializeTheme();
    
    // Initialize all dashboard charts
    initializeDashboardCharts();
    
    // Initialize real-time updates
    initializeRealTimeUpdates();
});

function initializeDashboardCharts() {
    // Initialize all chart types for the admin dashboard
    initializeOverviewCharts();
    initializeRevenueChart();
    initializeUserGrowthChart();
    initializeCollaborationChart();
    initializePerformanceMetrics();
    initializeTopPerformersCharts();
    
    // Initialize existing analytics charts from EJS data
    initializeAnalyticsCharts();
}

function initializeOverviewCharts() {
    // Create overview metrics chart
    const overviewContainer = document.createElement('div');
    overviewContainer.className = 'analytics-card';
    overviewContainer.innerHTML = `
        <h3>Platform Overview</h3>
        <canvas id="overviewChart"></canvas>
    `;
    
    const analyticsGrid = document.querySelector('.analytics-grid');
    if (analyticsGrid) {
        analyticsGrid.insertBefore(overviewContainer, analyticsGrid.firstChild);
        
        const overviewData = {
            labels: ['Users', 'Brands', 'Influencers', 'Active Collabs', 'Completed Collabs'],
            data: [1250, 185, 890, 67, 234]
        };
        
        new Chart(document.getElementById('overviewChart'), {
            type: 'doughnut',
            data: {
                labels: overviewData.labels,
                datasets: [{
                    data: overviewData.data,
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB', 
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF'
                    ],
                    borderWidth: 2,
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
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }
}

function initializeRevenueChart() {
    // Create revenue trends chart
    const revenueContainer = document.createElement('div');
    revenueContainer.className = 'analytics-card';
    revenueContainer.innerHTML = `
        <h3>Revenue Trends</h3>
        <canvas id="revenueTrendsChart"></canvas>
    `;
    
    const analyticsGrid = document.querySelector('.analytics-grid');
    if (analyticsGrid) {
        analyticsGrid.appendChild(revenueContainer);
        
        const revenueData = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            revenue: [45000, 52000, 48000, 61000, 58000, 67000],
            commissions: [2250, 2600, 2400, 3050, 2900, 3350],
            expenses: [15000, 17000, 16000, 19000, 18500, 21000]
        };
        
        new Chart(document.getElementById('revenueTrendsChart'), {
            type: 'line',
            data: {
                labels: revenueData.labels,
                datasets: [
                    {
                        label: 'Total Revenue',
                        data: revenueData.revenue,
                        borderColor: '#4CAF50',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Commissions',
                        data: revenueData.commissions,
                        borderColor: '#2196F3',
                        backgroundColor: 'rgba(33, 150, 243, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Expenses',
                        data: revenueData.expenses,
                        borderColor: '#FF5722',
                        backgroundColor: 'rgba(255, 87, 34, 0.1)',
                        fill: false,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': $' + context.parsed.y.toLocaleString();
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Month'
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Amount ($)'
                        },
                        ticks: {
                            callback: function(value) {
                                return '$' + (value / 1000) + 'K';
                            }
                        }
                    }
                }
            }
        });
    }
}

function initializeUserGrowthChart() {
    // Create user growth chart
    const userGrowthContainer = document.createElement('div');
    userGrowthContainer.className = 'analytics-card';
    userGrowthContainer.innerHTML = `
        <h3>User Growth</h3>
        <canvas id="userGrowthChart"></canvas>
    `;
    
    const analyticsGrid = document.querySelector('.analytics-grid');
    if (analyticsGrid) {
        analyticsGrid.appendChild(userGrowthContainer);
        
        const userGrowthData = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            totalUsers: [1050, 1180, 1320, 1450, 1590, 1750],
            newUsers: [130, 150, 140, 130, 140, 160],
            activeUsers: [850, 950, 1020, 1150, 1280, 1400]
        };
        
        new Chart(document.getElementById('userGrowthChart'), {
            type: 'bar',
            data: {
                labels: userGrowthData.labels,
                datasets: [
                    {
                        label: 'Total Users',
                        data: userGrowthData.totalUsers,
                        backgroundColor: 'rgba(33, 150, 243, 0.8)',
                        borderColor: '#2196F3',
                        borderWidth: 1
                    },
                    {
                        label: 'New Users',
                        data: userGrowthData.newUsers,
                        backgroundColor: 'rgba(76, 175, 80, 0.8)',
                        borderColor: '#4CAF50',
                        borderWidth: 1
                    },
                    {
                        label: 'Active Users',
                        data: userGrowthData.activeUsers,
                        type: 'line',
                        borderColor: '#FF9800',
                        backgroundColor: 'rgba(255, 152, 0, 0.2)',
                        fill: false,
                        tension: 0.4,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.parsed.y.toLocaleString();
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Month'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Number of Users'
                        },
                        beginAtZero: true
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Active Users'
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        });
    }
}

function initializeCollaborationChart() {
    // Create collaboration status chart
    const collabContainer = document.createElement('div');
    collabContainer.className = 'analytics-card';
    collabContainer.innerHTML = `
        <h3>Collaboration Status</h3>
        <canvas id="collaborationStatusChart"></canvas>
    `;
    
    const analyticsGrid = document.querySelector('.analytics-grid');
    if (analyticsGrid) {
        analyticsGrid.appendChild(collabContainer);
        
        const collabData = {
            labels: ['Active', 'Completed', 'Pending', 'Cancelled'],
            data: [67, 234, 23, 12],
            colors: ['#4CAF50', '#2196F3', '#FF9800', '#F44336']
        };
        
        new Chart(document.getElementById('collaborationStatusChart'), {
            type: 'pie',
            data: {
                labels: collabData.labels,
                datasets: [{
                    data: collabData.data,
                    backgroundColor: collabData.colors,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
}

function initializePerformanceMetrics() {
    // Create performance metrics chart
    const performanceContainer = document.createElement('div');
    performanceContainer.className = 'analytics-card';
    performanceContainer.innerHTML = `
        <h3>Platform Performance</h3>
        <canvas id="platformPerformanceChart"></canvas>
    `;
    
    const analyticsGrid = document.querySelector('.analytics-grid');
    if (analyticsGrid) {
        analyticsGrid.appendChild(performanceContainer);
        
        const performanceData = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            avgEngagement: [4.2, 4.5, 4.8, 4.3, 5.1, 5.4],
            successRate: [78, 82, 85, 80, 88, 92],
            userSatisfaction: [4.1, 4.3, 4.5, 4.2, 4.6, 4.8]
        };
        
        new Chart(document.getElementById('platformPerformanceChart'), {
            type: 'radar',
            data: {
                labels: ['Engagement', 'Success Rate', 'User Satisfaction', 'Response Time', 'Quality Score', 'Retention'],
                datasets: [
                    {
                        label: 'Current Month',
                        data: [5.4, 92, 4.8, 85, 88, 76],
                        borderColor: '#2196F3',
                        backgroundColor: 'rgba(33, 150, 243, 0.2)',
                        borderWidth: 2,
                        pointBackgroundColor: '#2196F3',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    },
                    {
                        label: 'Previous Month',
                        data: [5.1, 88, 4.6, 82, 85, 72],
                        borderColor: '#4CAF50',
                        backgroundColor: 'rgba(76, 175, 80, 0.2)',
                        borderWidth: 2,
                        pointBackgroundColor: '#4CAF50',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        pointLabels: {
                            font: {
                                size: 11
                            }
                        }
                    }
                }
            }
        });
    }
}

function initializeTopPerformersCharts() {
    // Initialize charts for top performers if containers exist
    const topBrandsContainer = document.querySelector('.analytics-card h3');
    if (topBrandsContainer && topBrandsContainer.textContent.includes('Top Brands')) {
        const chartContainer = document.createElement('canvas');
        chartContainer.id = 'topBrandsChart';
        topBrandsContainer.parentElement.appendChild(chartContainer);
        
        // Sample top brands data
        const topBrandsData = {
            labels: ['Nike', 'Adidas', 'Apple', 'Samsung', 'Coca-Cola'],
            revenue: [125000, 98000, 156000, 87000, 142000],
            collaborations: [12, 9, 15, 8, 11]
        };
        
        new Chart(chartContainer, {
            type: 'bar',
            data: {
                labels: topBrandsData.labels,
                datasets: [
                    {
                        label: 'Revenue ($)',
                        data: topBrandsData.revenue,
                        backgroundColor: 'rgba(33, 150, 243, 0.8)',
                        borderColor: '#2196F3',
                        borderWidth: 1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Active Collaborations',
                        data: topBrandsData.collaborations,
                        backgroundColor: 'rgba(76, 175, 80, 0.8)',
                        borderColor: '#4CAF50',
                        borderWidth: 1,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                if (context.datasetIndex === 0) {
                                    return context.dataset.label + ': $' + context.parsed.y.toLocaleString();
                                } else {
                                    return context.dataset.label + ': ' + context.parsed.y;
                                }
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Brands'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Revenue ($)'
                        },
                        ticks: {
                            callback: function(value) {
                                return '$' + (value / 1000) + 'K';
                            }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Collaborations'
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        });
    }
}

function initializeAnalyticsCharts() {
    // Initialize charts from EJS data
    const canvases = document.querySelectorAll('canvas[data-chart]');
    
    canvases.forEach(canvas => {
        try {
            const chartData = JSON.parse(canvas.getAttribute('data-chart'));
            
            let chartConfig = {
                type: chartData.type || 'line',
                data: {
                    labels: chartData.labels || [],
                    datasets: [{
                        label: chartData.label || 'Data',
                        data: chartData.values || [],
                        borderColor: getChartColor(chartData.type),
                        backgroundColor: getChartBackgroundColor(chartData.type),
                        borderWidth: 2,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top'
                        }
                    },
                    scales: chartData.type !== 'doughnut' && chartData.type !== 'pie' ? {
                        y: {
                            beginAtZero: true
                        }
                    } : {}
                }
            };
            
            new Chart(canvas, chartConfig);
        } catch (error) {
            console.error('Error initializing chart:', error);
        }
    });
}

function getChartColor(type) {
    const colors = {
        'line': '#2196F3',
        'bar': '#4CAF50',
        'doughnut': '#FF9800',
        'pie': '#E91E63'
    };
    return colors[type] || '#2196F3';
}

function getChartBackgroundColor(type) {
    const colors = {
        'line': 'rgba(33, 150, 243, 0.1)',
        'bar': 'rgba(76, 175, 80, 0.8)',
        'doughnut': ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
        'pie': ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
    };
    return colors[type] || 'rgba(33, 150, 243, 0.1)';
}

function initializeRealTimeUpdates() {
    // Simulate real-time updates every 30 seconds
    setInterval(() => {
        updateDashboardMetrics();
    }, 30000);
}

function updateDashboardMetrics() {
    // Update stats cards with new data
    const statsCards = document.querySelectorAll('.stats-card h2');
    statsCards.forEach(card => {
        const currentValue = parseInt(card.textContent.replace(/[^0-9]/g, ''));
        const variation = Math.floor(Math.random() * 10) - 5; // Random variation
        const newValue = Math.max(0, currentValue + variation);
        
        // Animate the change
        animateValue(card, currentValue, newValue, 1000);
    });
}

function animateValue(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        
        const badge = element.querySelector('.badge');
        const badgeText = badge ? badge.outerHTML : '';
        element.innerHTML = Math.floor(current).toLocaleString() + badgeText;
    }, 16);
}

// Initialize stats data when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize stats data if elements exist
    const statsData = {
        totalUsers: { value: 78250, change: 70.5, extra: 8900 },
        activeUsers: { value: 15000, change: 55.2, extra: 4500 },
        totalRevenue: { value: 35078, change: 27.4, extra: 20395 },
        totalCollaborations: { value: 1250, change: 40.8, extra: 520 }
    };

    // Update stats if elements exist
    const totalUsersEl = document.getElementById('totalUsers');
    if (totalUsersEl) {
        totalUsersEl.innerHTML = `${statsData.totalUsers.value} <span class="badge green">&#9633; ${statsData.totalUsers.change}%</span>`;
        const extraUsersEl = document.getElementById('extraUsers');
        if (extraUsersEl) extraUsersEl.textContent = statsData.totalUsers.extra;
    }

    const activeUsersEl = document.getElementById('activeUsers');
    if (activeUsersEl) {
        activeUsersEl.innerHTML = `${statsData.activeUsers.value} <span class="badge green">&#9633; ${statsData.activeUsers.change}%</span>`;
        const extraActiveUsersEl = document.getElementById('extraActiveUsers');
        if (extraActiveUsersEl) extraActiveUsersEl.textContent = statsData.activeUsers.extra;
    }

    const totalRevenueEl = document.getElementById('totalRevenue');
    if (totalRevenueEl) {
        totalRevenueEl.innerHTML = `$${statsData.totalRevenue.value} <span class="badge green">&#9633; ${statsData.totalRevenue.change}%</span>`;
        const extraRevenueEl = document.getElementById('extraRevenue');
        if (extraRevenueEl) extraRevenueEl.textContent = statsData.totalRevenue.extra;
    }

    const totalCollaborationsEl = document.getElementById('totalCollaborations');
    if (totalCollaborationsEl) {
        totalCollaborationsEl.innerHTML = `${statsData.totalCollaborations.value} <span class="badge green">&#9633; ${statsData.totalCollaborations.change}%</span>`;
        const extraCollaborationsEl = document.getElementById('extraCollaborations');
        if (extraCollaborationsEl) extraCollaborationsEl.textContent = statsData.totalCollaborations.extra;
    }
    
    // Initialize analytics charts from EJS data
    initializeEJSCharts();
});

// Initialize charts from EJS template data
function initializeEJSCharts() {
    try {
        // Get chart data from EJS template if available
        const monthlyRevenueEl = document.getElementById('monthlyRevenueChart');
        if (monthlyRevenueEl) {
            const monthlyRevenueData = JSON.parse(monthlyRevenueEl.getAttribute('data-revenue') || '[]');
            if (monthlyRevenueData.length > 0) {
                // Initialize monthly revenue chart with EJS data
                console.log('Monthly revenue data:', monthlyRevenueData);
            }
        }
        
        // Initialize other EJS charts
        const analyticsElements = document.querySelectorAll('[data-chart]');
        analyticsElements.forEach(el => {
            try {
                const chartData = JSON.parse(el.getAttribute('data-chart') || '{}');
                console.log(`Chart data for ${el.id}:`, chartData);
            } catch (error) {
                console.warn(`Error parsing chart data for ${el.id}:`, error);
            }
        });
    } catch (error) {
        console.warn('Error initializing EJS charts:', error);
    }
}
// Performance charts initialization (placeholder for future implementation)
function initPerformanceCharts() {
    console.log('Performance charts initialization placeholder');
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

function handleLogout() {
    window.location.href = '/admin/logout';
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