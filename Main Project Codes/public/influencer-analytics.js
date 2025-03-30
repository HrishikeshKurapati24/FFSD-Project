document.addEventListener('DOMContentLoaded', function () {
    const metrics = JSON.parse(document.getElementById('metricsData').textContent);

    // Category Breakdown Chart
    new Chart(document.getElementById('categoryBreakdownChart'), {
        type: 'doughnut',
        data: {
            labels: metrics.categoryBreakdown.map(cat => cat.name),
            datasets: [{
                data: metrics.categoryBreakdown.map(cat => cat.percentage),
                backgroundColor: [
                    'rgba(33, 150, 243, 0.8)',
                    'rgba(76, 175, 80, 0.8)',
                    'rgba(255, 193, 7, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                }
            },
            cutout: '65%'
        }
    });

    // Performance Metrics Chart
    new Chart(document.getElementById('performanceChart'), {
        type: 'line',
        data: {
            labels: metrics.performanceData.labels,
            datasets: [
                {
                    label: 'Engagement Rate',
                    data: metrics.performanceData.engagement,
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    yAxisID: 'y1'
                },
                {
                    label: 'Collaborations',
                    data: metrics.performanceData.collaborations,
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    yAxisID: 'y2'
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
                y1: {
                    type: 'linear',
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Engagement Rate (%)'
                    }
                },
                y2: {
                    type: 'linear',
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Number of Collaborations'
                    }
                }
            }
        }
    });

    // Handle time range changes
    document.getElementById('timeRange').addEventListener('change', function (e) {
        console.log('Time range changed to:', e.target.value);
        // Implement time range filtering logic here
    });
}); 