document.addEventListener('DOMContentLoaded', function () {
    const metrics = JSON.parse(document.getElementById('metricsData').textContent);
    
    // Initialize all charts
    initializeInfluencerCharts(metrics);
    
    // Handle time range changes
    document.getElementById('timeRange')?.addEventListener('change', function (e) {
        updateInfluencerChartsWithTimeRange(e.target.value);
    });
});

function initializeInfluencerCharts(metrics) {
    if (!metrics) {
        console.warn('No influencer metrics data available');
        return;
    }
    
    // Initialize all chart types
    initializeCategoryBreakdownChart(metrics);
    initializePerformanceChart(metrics);
    initializeTopInfluencersChart(metrics);
    initializeEngagementTrendsChart(metrics);
    initializeFollowerGrowthChart(metrics);
}

function initializeCategoryBreakdownChart(metrics) {
    const categoryCtx = document.getElementById('categoryBreakdownChart');
    if (!categoryCtx) return;
    
    const categoryData = metrics.categoryBreakdown || [
        { name: 'Fashion & Beauty', percentage: 35, count: 450 },
        { name: 'Technology', percentage: 25, count: 320 },
        { name: 'Lifestyle', percentage: 20, count: 260 },
        { name: 'Food & Travel', percentage: 15, count: 195 },
        { name: 'Fitness', percentage: 5, count: 65 }
    ];
    
    new Chart(categoryCtx, {
        type: 'doughnut',
        data: {
            labels: categoryData.map(cat => cat.name),
            datasets: [{
                data: categoryData.map(cat => cat.percentage),
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
                    position: 'right',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const category = categoryData[context.dataIndex];
                            return `${context.label}: ${context.parsed}% (${category.count} influencers)`;
                        }
                    }
                }
            },
            cutout: '60%'
        }
    });
}

function initializePerformanceChart(metrics) {
    const performanceCtx = document.getElementById('performanceChart');
    if (!performanceCtx) return;
    
    const performanceData = metrics.performanceData || {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        engagement: [4.2, 4.5, 4.8, 4.3, 5.1, 5.4],
        collaborations: [45, 52, 48, 61, 58, 67],
        reach: [125000, 142000, 138000, 156000, 162000, 178000]
    };
    
    new Chart(performanceCtx, {
        type: 'line',
        data: {
            labels: performanceData.labels,
            datasets: [
                {
                    label: 'Avg Engagement Rate (%)',
                    data: performanceData.engagement,
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Active Collaborations',
                    data: performanceData.collaborations,
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'y1'
                },
                {
                    label: 'Total Reach (K)',
                    data: performanceData.reach.map(r => r / 1000),
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
                            if (context.datasetIndex === 2) {
                                label += context.parsed.y + 'K';
                            } else if (context.datasetIndex === 0) {
                                label += context.parsed.y + '%';
                            } else {
                                label += context.parsed.y;
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
                        text: 'Collaborations'
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

function initializeTopInfluencersChart(metrics) {
    // Create top influencers performance chart
    const topInfluencersContainer = document.createElement('div');
    topInfluencersContainer.className = 'chart-card';
    topInfluencersContainer.innerHTML = `
        <h3>Top Influencers Performance</h3>
        <canvas id="topInfluencersChart"></canvas>
    `;
    
    const chartsContainer = document.querySelector('.charts-container');
    if (chartsContainer) {
        chartsContainer.appendChild(topInfluencersContainer);
        
        const topInfluencersData = metrics.topInfluencers || [
            { name: 'Sarah Johnson', engagement: 8.5, followers: 125000 },
            { name: 'Mike Chen', engagement: 7.2, followers: 98000 },
            { name: 'Emma Davis', engagement: 6.8, followers: 156000 },
            { name: 'Alex Rodriguez', engagement: 9.1, followers: 87000 },
            { name: 'Lisa Wang', engagement: 7.9, followers: 142000 }
        ];
        
        new Chart(document.getElementById('topInfluencersChart'), {
            type: 'bar',
            data: {
                labels: topInfluencersData.map(inf => inf.name),
                datasets: [
                    {
                        label: 'Engagement Rate (%)',
                        data: topInfluencersData.map(inf => inf.engagement),
                        backgroundColor: 'rgba(33, 150, 243, 0.8)',
                        borderColor: '#2196F3',
                        borderWidth: 1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Followers (K)',
                        data: topInfluencersData.map(inf => inf.followers / 1000),
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
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.datasetIndex === 1) {
                                    label += context.parsed.y + 'K followers';
                                } else {
                                    label += context.parsed.y + '% engagement';
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
                            text: 'Influencers'
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
                            text: 'Followers (K)'
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

function initializeEngagementTrendsChart(metrics) {
    // Create engagement trends chart
    const engagementContainer = document.createElement('div');
    engagementContainer.className = 'chart-card';
    engagementContainer.innerHTML = `
        <h3>Engagement Trends by Platform</h3>
        <canvas id="engagementTrendsChart"></canvas>
    `;
    
    const chartsContainer = document.querySelector('.charts-container');
    if (chartsContainer) {
        chartsContainer.appendChild(engagementContainer);
        
        const engagementTrends = metrics.engagementTrends || {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            instagram: [4.2, 4.5, 4.8, 4.3, 5.1, 5.4],
            youtube: [3.8, 4.1, 3.9, 4.4, 4.7, 4.9],
            tiktok: [6.5, 7.2, 7.8, 7.1, 8.2, 8.6]
        };
        
        new Chart(document.getElementById('engagementTrendsChart'), {
            type: 'line',
            data: {
                labels: engagementTrends.labels,
                datasets: [
                    {
                        label: 'Instagram',
                        data: engagementTrends.instagram,
                        borderColor: '#E1306C',
                        backgroundColor: 'rgba(225, 48, 108, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'YouTube',
                        data: engagementTrends.youtube,
                        borderColor: '#FF0000',
                        backgroundColor: 'rgba(255, 0, 0, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'TikTok',
                        data: engagementTrends.tiktok,
                        borderColor: '#000000',
                        backgroundColor: 'rgba(0, 0, 0, 0.1)',
                        fill: true,
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
                                return context.dataset.label + ': ' + context.parsed.y + '% engagement';
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
                            text: 'Engagement Rate (%)'
                        }
                    }
                }
            }
        });
    }
}

function initializeFollowerGrowthChart(metrics) {
    // Create follower growth chart
    const followerContainer = document.createElement('div');
    followerContainer.className = 'chart-card';
    followerContainer.innerHTML = `
        <h3>Average Follower Growth</h3>
        <canvas id="followerGrowthChart"></canvas>
    `;
    
    const chartsContainer = document.querySelector('.charts-container');
    if (chartsContainer) {
        chartsContainer.appendChild(followerContainer);
        
        const followerGrowth = metrics.followerGrowth || {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            totalFollowers: [2.1, 2.3, 2.5, 2.7, 2.9, 3.2], // in millions
            monthlyGrowth: [8.5, 12.3, 9.8, 11.2, 7.4, 10.1] // percentage
        };
        
        new Chart(document.getElementById('followerGrowthChart'), {
            type: 'bar',
            data: {
                labels: followerGrowth.labels,
                datasets: [
                    {
                        label: 'Total Followers (M)',
                        data: followerGrowth.totalFollowers,
                        backgroundColor: 'rgba(156, 39, 176, 0.8)',
                        borderColor: '#9C27B0',
                        borderWidth: 1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Monthly Growth (%)',
                        data: followerGrowth.monthlyGrowth,
                        type: 'line',
                        borderColor: '#FF5722',
                        backgroundColor: 'rgba(255, 87, 34, 0.2)',
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
                                if (context.datasetIndex === 0) {
                                    label += context.parsed.y + 'M followers';
                                } else {
                                    label += context.parsed.y + '% growth';
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
                            text: 'Total Followers (M)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Growth Rate (%)'
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

function updateInfluencerChartsWithTimeRange(timeRange) {
    console.log('Updating influencer charts for time range:', timeRange);
    
    // Show loading state
    showLoadingState();
    
    // Simulate API call delay
    setTimeout(() => {
        hideLoadingState();
        console.log('Influencer charts updated for time range:', timeRange);
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