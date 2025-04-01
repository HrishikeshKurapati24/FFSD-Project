document.addEventListener('DOMContentLoaded', function () {
    // Set chart defaults
    Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
    Chart.defaults.font.size = 12;
    Chart.defaults.plugins.legend.labels.usePointStyle = true;

    const metrics = JSON.parse(document.getElementById('metricsData').textContent);

    // Brand Growth Chart
    new Chart(document.getElementById('brandGrowthChart'), {
        type: 'line',
        data: {
            labels: metrics.monthlyGrowth.labels,
            datasets: [{
                label: 'Active Brands',
                data: metrics.monthlyGrowth.data,
                borderColor: '#2196F3',
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#2196F3',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    align: 'end'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        padding: 10
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        padding: 10
                    }
                }
            }
        }
    });

    // Revenue Chart
    new Chart(document.getElementById('revenueChart'), {
        type: 'bar',
        data: {
            labels: metrics.revenueData.labels,
            datasets: [{
                label: 'Revenue',
                data: metrics.revenueData.data,
                backgroundColor: 'rgba(76, 175, 80, 0.8)',
                borderRadius: 6,
                maxBarThickness: 40
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    align: 'end'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        callback: function (value) {
                            return '$' + value.toLocaleString();
                        },
                        padding: 10
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        padding: 10
                    }
                }
            }
        }
    });

    // Category Distribution Chart
    new Chart(document.getElementById('categoryChart'), {
        type: 'doughnut',
        data: {
            labels: metrics.topCategories.map(cat => cat.name),
            datasets: [{
                data: metrics.topCategories.map(cat => cat.percentage),
                backgroundColor: [
                    'rgba(33, 150, 243, 0.8)',   // Blue
                    'rgba(76, 175, 80, 0.8)',    // Green
                    'rgba(255, 193, 7, 0.8)',    // Yellow
                    'rgba(156, 39, 176, 0.8)',   // Purple
                    'rgba(255, 87, 34, 0.8)'     // Orange
                ],
                borderWidth: 0
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
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                }
            },
            cutout: '65%'
        }
    });

    // Add hover effects to metric cards
    const metricCards = document.querySelectorAll('.metric-card');
    metricCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px)';
            card.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.1)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = 'none';
        });
    });

    // Handle time range changes
    document.getElementById('timeRange').addEventListener('change', function (e) {
        // Implement time range filtering logic here
        console.log('Time range changed to:', e.target.value);
    });
}); 