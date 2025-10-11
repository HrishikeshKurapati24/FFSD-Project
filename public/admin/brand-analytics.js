document.addEventListener('DOMContentLoaded', function () {
    // Set chart defaults
    Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
    Chart.defaults.font.size = 12;
    Chart.defaults.plugins.legend.labels.usePointStyle = true;

    const metrics = JSON.parse(document.getElementById('metricsData').textContent);
    
    // Initialize all brand analytics charts
    initializeBrandCharts(metrics);
    
    // Handle time range changes
    document.getElementById('timeRange')?.addEventListener('change', function (e) {
        updateBrandChartsWithTimeRange(e.target.value);
    });
});

function initializeBrandCharts(metrics) {
    if (!metrics) {
        console.warn('No brand metrics data available');
        return;
    }
    
    // Initialize all chart types
    initializeBrandGrowthChart(metrics);
    initializeRevenueChart(metrics);
    initializeCategoryChart(metrics);
    initializeBrandPerformanceChart(metrics);
    initializeCollaborationTrendsChart(metrics);
    initializeBrandComparisonChart(metrics);
}

function initializeBrandGrowthChart(metrics) {
    const brandGrowthCtx = document.getElementById('brandGrowthChart');
    if (!brandGrowthCtx) return;
    
    const growthData = metrics.monthlyGrowth || {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        data: [120, 135, 142, 158, 167, 185],
        newBrands: [15, 18, 12, 22, 19, 25]
    };

    new Chart(brandGrowthCtx, {
        type: 'line',
        data: {
            labels: growthData.labels,
            datasets: [
                {
                    label: 'Total Active Brands',
                    data: growthData.data,
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#2196F3',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                },
                {
                    label: 'New Brands (Monthly)',
                    data: growthData.newBrands,
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: false,
                    pointBackgroundColor: '#4CAF50',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
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
                    position: 'top',
                    align: 'end'
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
                    },
                    grid: {
                        display: false
                    },
                    ticks: {
                        padding: 10
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Total Active Brands'
                    },
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        padding: 10
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'New Brands'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

function initializeRevenueChart(metrics) {
    const revenueCtx = document.getElementById('revenueChart');
    if (!revenueCtx) return;
    
    const revenueData = metrics.revenueData || {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        data: [125000, 142000, 138000, 165000, 178000, 195000],
        expenses: [85000, 95000, 92000, 108000, 115000, 125000]
    };

    new Chart(revenueCtx, {
        type: 'bar',
        data: {
            labels: revenueData.labels,
            datasets: [
                {
                    label: 'Revenue',
                    data: revenueData.data,
                    backgroundColor: 'rgba(76, 175, 80, 0.8)',
                    borderColor: '#4CAF50',
                    borderWidth: 1,
                    borderRadius: 6,
                    maxBarThickness: 40
                },
                {
                    label: 'Expenses',
                    data: revenueData.expenses,
                    backgroundColor: 'rgba(255, 87, 34, 0.8)',
                    borderColor: '#FF5722',
                    borderWidth: 1,
                    borderRadius: 6,
                    maxBarThickness: 40
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    align: 'end'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': $' + context.parsed.y.toLocaleString();
                        },
                        afterLabel: function(context) {
                            if (context.datasetIndex === 0) {
                                const profit = context.parsed.y - revenueData.expenses[context.dataIndex];
                                return 'Profit: $' + profit.toLocaleString();
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
                        text: 'Month'
                    },
                    grid: {
                        display: false
                    },
                    ticks: {
                        padding: 10
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Amount ($)'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        callback: function (value) {
                            return '$' + (value / 1000) + 'K';
                        },
                        padding: 10
                    }
                }
            }
        }
    });
}

function initializeCategoryChart(metrics) {
    const categoryCtx = document.getElementById('categoryChart');
    if (!categoryCtx) return;
    
    const categoryData = metrics.topCategories || [
        { name: 'Fashion & Beauty', percentage: 28, count: 45 },
        { name: 'Technology', percentage: 22, count: 35 },
        { name: 'Food & Beverage', percentage: 18, count: 29 },
        { name: 'Lifestyle', percentage: 16, count: 26 },
        { name: 'Health & Fitness', percentage: 16, count: 25 }
    ];

    new Chart(categoryCtx, {
        type: 'doughnut',
        data: {
            labels: categoryData.map(cat => cat.name),
            datasets: [{
                data: categoryData.map(cat => cat.percentage),
                backgroundColor: [
                    '#FF6384',   // Pink
                    '#36A2EB',   // Blue
                    '#FFCE56',   // Yellow
                    '#4BC0C0',   // Teal
                    '#9966FF'    // Purple
                ],
                borderWidth: 2,
                borderColor: '#fff',
                hoverBorderWidth: 3
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
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const category = categoryData[context.dataIndex];
                            return `${context.label}: ${context.parsed}% (${category.count} brands)`;
                        }
                    }
                }
            },
            cutout: '60%'
        }
    });
}

function initializeBrandPerformanceChart(metrics) {
    // Create brand performance comparison chart
    const performanceContainer = document.createElement('div');
    performanceContainer.className = 'chart-card';
    performanceContainer.innerHTML = `
        <h3>Brand Performance Metrics</h3>
        <canvas id="brandPerformanceChart"></canvas>
    `;
    
    const chartsContainer = document.querySelector('.charts-container');
    if (chartsContainer) {
        chartsContainer.appendChild(performanceContainer);
        
        const performanceData = metrics.brandPerformance || {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            avgEngagement: [4.2, 4.5, 4.8, 4.3, 5.1, 5.4],
            avgROI: [2.1, 2.3, 2.7, 2.5, 2.9, 3.2],
            campaignSuccess: [78, 82, 85, 80, 88, 92]
        };
        
        new Chart(document.getElementById('brandPerformanceChart'), {
            type: 'line',
            data: {
                labels: performanceData.labels,
                datasets: [
                    {
                        label: 'Avg Engagement Rate (%)',
                        data: performanceData.avgEngagement,
                        borderColor: '#2196F3',
                        backgroundColor: 'rgba(33, 150, 243, 0.1)',
                        fill: true,
                        tension: 0.4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Avg ROI',
                        data: performanceData.avgROI,
                        borderColor: '#4CAF50',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        fill: true,
                        tension: 0.4,
                        yAxisID: 'y1'
                    },
                    {
                        label: 'Campaign Success Rate (%)',
                        data: performanceData.campaignSuccess,
                        borderColor: '#FF9800',
                        backgroundColor: 'rgba(255, 152, 0, 0.1)',
                        fill: false,
                        tension: 0.4,
                        yAxisID: 'y2'
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
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.datasetIndex === 1) {
                                    label += context.parsed.y + 'x ROI';
                                } else {
                                    label += context.parsed.y + '%';
                                }
                                return label;
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
                            text: 'Engagement Rate (%)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'ROI (x)'
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    },
                    y2: {
                        type: 'linear',
                        display: false,
                        position: 'right'
                    }
                }
            }
        });
    }
}

function initializeCollaborationTrendsChart(metrics) {
    // Create collaboration trends chart
    const collabContainer = document.createElement('div');
    collabContainer.className = 'chart-card';
    collabContainer.innerHTML = `
        <h3>Collaboration Trends</h3>
        <canvas id="collaborationTrendsChart"></canvas>
    `;
    
    const chartsContainer = document.querySelector('.charts-container');
    if (chartsContainer) {
        chartsContainer.appendChild(collabContainer);
        
        const collabData = metrics.collaborationTrends || {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            totalCollabs: [145, 162, 178, 195, 210, 235],
            completedCollabs: [120, 138, 152, 168, 185, 205],
            avgDuration: [14, 16, 15, 18, 17, 19] // days
        };
        
        new Chart(document.getElementById('collaborationTrendsChart'), {
            type: 'bar',
            data: {
                labels: collabData.labels,
                datasets: [
                    {
                        label: 'Total Collaborations',
                        data: collabData.totalCollabs,
                        backgroundColor: 'rgba(33, 150, 243, 0.8)',
                        borderColor: '#2196F3',
                        borderWidth: 1
                    },
                    {
                        label: 'Completed Collaborations',
                        data: collabData.completedCollabs,
                        backgroundColor: 'rgba(76, 175, 80, 0.8)',
                        borderColor: '#4CAF50',
                        borderWidth: 1
                    },
                    {
                        label: 'Avg Duration (days)',
                        data: collabData.avgDuration,
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
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.datasetIndex === 2) {
                                    label += context.parsed.y + ' days';
                                } else {
                                    label += context.parsed.y + ' collaborations';
                                }
                                return label;
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
                            text: 'Number of Collaborations'
                        },
                        beginAtZero: true
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Duration (days)'
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

function initializeBrandComparisonChart(metrics) {
    // Create top brands comparison chart
    const comparisonContainer = document.createElement('div');
    comparisonContainer.className = 'chart-card';
    comparisonContainer.innerHTML = `
        <h3>Top Brands Comparison</h3>
        <canvas id="brandComparisonChart"></canvas>
    `;
    
    const chartsContainer = document.querySelector('.charts-container');
    if (chartsContainer) {
        chartsContainer.appendChild(comparisonContainer);
        
        const topBrands = metrics.topBrands?.slice(0, 5) || [
            { name: 'Nike', revenue: 125000, engagementRate: 7.2, activeCampaigns: 12 },
            { name: 'Adidas', revenue: 98000, engagementRate: 6.8, activeCampaigns: 9 },
            { name: 'Apple', revenue: 156000, engagementRate: 8.1, activeCampaigns: 15 },
            { name: 'Samsung', revenue: 87000, engagementRate: 5.9, activeCampaigns: 8 },
            { name: 'Coca-Cola', revenue: 142000, engagementRate: 6.5, activeCampaigns: 11 }
        ];
        
        new Chart(document.getElementById('brandComparisonChart'), {
            type: 'radar',
            data: {
                labels: ['Revenue (K)', 'Engagement Rate', 'Active Campaigns', 'Brand Score', 'Market Reach'],
                datasets: topBrands.slice(0, 3).map((brand, index) => ({
                    label: brand.name,
                    data: [
                        brand.revenue / 1000,
                        brand.engagementRate,
                        brand.activeCampaigns,
                        (brand.engagementRate * 10), // Brand score
                        (brand.revenue / 2000) // Market reach approximation
                    ],
                    borderColor: ['#FF6384', '#36A2EB', '#FFCE56'][index],
                    backgroundColor: [`rgba(255, 99, 132, 0.2)`, `rgba(54, 162, 235, 0.2)`, `rgba(255, 206, 86, 0.2)`][index],
                    borderWidth: 2,
                    pointBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'][index],
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }))
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
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        pointLabels: {
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });
    }
}

function updateBrandChartsWithTimeRange(timeRange) {
    console.log('Updating brand charts for time range:', timeRange);
    
    // Show loading state
    showLoadingState();
    
    // Simulate API call delay
    setTimeout(() => {
        hideLoadingState();
        console.log('Brand charts updated for time range:', timeRange);
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

// Add hover effects to metric cards
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        const metricCards = document.querySelectorAll('.metric-card');
        metricCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-5px)';
                card.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.1)';
                card.style.transition = 'all 0.3s ease';
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = 'none';
            });
        });
    }, 100);
}); 