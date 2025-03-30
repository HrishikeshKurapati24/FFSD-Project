document.addEventListener('DOMContentLoaded', function () {
    const metrics = JSON.parse(document.getElementById('metricsData').textContent);

    // Demographics Chart
    new Chart(document.getElementById('demographicsChart'), {
        type: 'bar',
        data: {
            labels: metrics.demographics.age.map(d => d.range),
            datasets: [{
                label: 'Age Distribution',
                data: metrics.demographics.age.map(d => d.percentage),
                backgroundColor: 'rgba(33, 150, 243, 0.8)'
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
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Percentage (%)'
                    }
                }
            }
        }
    });

    // Engagement Chart
    new Chart(document.getElementById('engagementChart'), {
        type: 'line',
        data: {
            labels: metrics.engagementData.labels,
            datasets: [
                {
                    label: 'Interactions',
                    data: metrics.engagementData.interactions,
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    yAxisID: 'y1'
                },
                {
                    label: 'Conversions',
                    data: metrics.engagementData.conversions,
                    borderColor: '#FFC107',
                    backgroundColor: 'rgba(255, 193, 7, 0.1)',
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
                        text: 'Interactions'
                    }
                },
                y2: {
                    type: 'linear',
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Conversions'
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