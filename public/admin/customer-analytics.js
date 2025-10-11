document.addEventListener('DOMContentLoaded', function () {
    const metrics = JSON.parse(document.getElementById('metricsData').textContent);
    
    // Initialize charts with error handling
    initializeCharts(metrics);
    
    // Handle time range changes
    document.getElementById('timeRange')?.addEventListener('change', function (e) {
        updateChartsWithTimeRange(e.target.value);
    });
});

function initializeCharts(metrics) {
    if (!metrics) {
        console.warn('No metrics data available');
        return;
    }
    
    // Gender Distribution Pie Chart
    initializeGenderChart(metrics);
    
    // Customer Engagement Trends Line Chart
    initializeEngagementChart(metrics);
    
    // Customer Growth Chart
    initializeGrowthChart(metrics);
    
    // Customer Retention Chart
    initializeRetentionChart(metrics);
}

function initializeGenderChart(metrics) {
    const genderCtx = document.getElementById('genderChart');
    if (!genderCtx) return;
    
    const genderData = metrics.demographics?.gender || [
        { type: 'Male', percentage: 45 },
        { type: 'Female', percentage: 52 },
        { type: 'Other', percentage: 3 }
    ];
    
    new Chart(genderCtx, {
        type: 'doughnut',
        data: {
            labels: genderData.map(g => g.type),
            datasets: [{
                data: genderData.map(g => g.percentage),
                backgroundColor: [
                    '#36A2EB',
                    '#FF6384',
                    '#FFCE56'
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
                            return context.label + ': ' + context.parsed + '%';
                        }
                    }
                }
            }
        }
    });
}

function initializeEngagementChart(metrics) {
    const engagementCtx = document.getElementById('engagementChart');
    if (!engagementCtx) return;
    
    const engagementData = metrics.engagementTrends || {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        activeUsers: [1200, 1350, 1500, 1400, 1600, 1750],
        newUsers: [200, 250, 300, 280, 320, 350],
        interactions: [5400, 6200, 7100, 6800, 7500, 8200]
    };
    
    new Chart(engagementCtx, {
        type: 'line',
        data: {
            labels: engagementData.labels,
            datasets: [
                {
                    label: 'Active Users',
                    data: engagementData.activeUsers,
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'New Users',
                    data: engagementData.newUsers,
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Total Interactions',
                    data: engagementData.interactions,
                    borderColor: '#FF9800',
                    backgroundColor: 'rgba(255, 152, 0, 0.1)',
                    fill: false,
                    tension: 0.4,
                    yAxisID: 'y1'
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
                    intersect: false
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
                        text: 'Users'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Interactions'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

function initializeGrowthChart(metrics) {
    // Create a customer growth chart if container exists
    const growthContainer = document.createElement('div');
    growthContainer.className = 'chart-card';
    growthContainer.innerHTML = `
        <h3>Customer Growth Over Time</h3>
        <canvas id="customerGrowthChart"></canvas>
    `;
    
    const chartsContainer = document.querySelector('.charts-container');
    if (chartsContainer) {
        chartsContainer.appendChild(growthContainer);
        
        const growthData = metrics.growthData || {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            totalCustomers: [5000, 5200, 5500, 5800, 6100, 6500],
            monthlyGrowth: [200, 300, 300, 300, 400]
        };
        
        new Chart(document.getElementById('customerGrowthChart'), {
            type: 'bar',
            data: {
                labels: growthData.labels,
                datasets: [
                    {
                        label: 'Total Customers',
                        data: growthData.totalCustomers,
                        backgroundColor: 'rgba(33, 150, 243, 0.8)',
                        borderColor: '#2196F3',
                        borderWidth: 1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Monthly Growth',
                        data: growthData.monthlyGrowth,
                        type: 'line',
                        borderColor: '#4CAF50',
                        backgroundColor: 'rgba(76, 175, 80, 0.2)',
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
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Total Customers'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Monthly Growth'
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

function initializeRetentionChart(metrics) {
    // Create customer retention chart
    const retentionContainer = document.createElement('div');
    retentionContainer.className = 'chart-card';
    retentionContainer.innerHTML = `
        <h3>Customer Retention Rate</h3>
        <canvas id="retentionChart"></canvas>
    `;
    
    const chartsContainer = document.querySelector('.charts-container');
    if (chartsContainer) {
        chartsContainer.appendChild(retentionContainer);
        
        const retentionData = metrics.retentionData || {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Month 2', 'Month 3'],
            retentionRates: [100, 85, 75, 68, 55, 45]
        };
        
        new Chart(document.getElementById('retentionChart'), {
            type: 'line',
            data: {
                labels: retentionData.labels,
                datasets: [{
                    label: 'Retention Rate (%)',
                    data: retentionData.retentionRates,
                    borderColor: '#E91E63',
                    backgroundColor: 'rgba(233, 30, 99, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#E91E63',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }]
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
                                return context.dataset.label + ': ' + context.parsed.y + '%';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Retention Rate (%)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }
}

function updateChartsWithTimeRange(timeRange) {
    console.log('Updating charts for time range:', timeRange);
    
    // In a real implementation, you would fetch new data based on the time range
    // For now, we'll simulate different data sets
    
    const timeRangeData = {
        '7': {
            labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
            activeUsers: [120, 135, 150, 140, 160, 175, 180]
        },
        '30': {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            activeUsers: [1200, 1350, 1500, 1600]
        },
        '90': {
            labels: ['Month 1', 'Month 2', 'Month 3'],
            activeUsers: [4500, 4800, 5200]
        },
        '365': {
            labels: ['Q1', 'Q2', 'Q3', 'Q4'],
            activeUsers: [12000, 13500, 15000, 16500]
        }
    };
    
    // Update charts with new data
    // This would typically involve destroying and recreating charts
    // or updating existing chart data
    
    showLoadingState();
    
    setTimeout(() => {
        hideLoadingState();
        console.log('Charts updated for time range:', timeRange);
    }, 1000);
}

function showLoadingState() {
    const charts = document.querySelectorAll('canvas');
    charts.forEach(chart => {
        chart.style.opacity = '0.5';
    });
}

function hideLoadingState() {
    const charts = document.querySelectorAll('canvas');
    charts.forEach(chart => {
        chart.style.opacity = '1';
    });
} 