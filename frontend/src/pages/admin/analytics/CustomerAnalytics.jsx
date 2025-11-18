import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import styles from '../../../styles/admin/CustomerAnalytics.module.css';

const CustomerAnalytics = ({ metrics, error }) => {
  const genderChartRef = useRef(null);
  const engagementChartRef = useRef(null);
  const growthChartRef = useRef(null);
  const retentionChartRef = useRef(null);
  const timeRangeRef = useRef(null);

  // Cleanup all charts on unmount
  useEffect(() => {
    return () => {
      [genderChartRef, engagementChartRef, growthChartRef, retentionChartRef].forEach(ref => {
        if (ref.current?.chart) ref.current.chart.destroy();
      });
    };
  }, []);

  // Initialize charts
  useEffect(() => {
    if (!metrics) return;

    Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
    Chart.defaults.font.size = 12;
    Chart.defaults.plugins.legend.labels.usePointStyle = true;

    initializeGenderChart(metrics);
    initializeEngagementChart(metrics);
    initializeGrowthChart(metrics);
    initializeRetentionChart(metrics);
  }, [metrics]);

  // Time range handler
  useEffect(() => {
    const el = timeRangeRef.current;
    if (!el) return;

    const handleChange = (e) => {
      updateChartsWithTimeRange(e.target.value);
    };

    el.addEventListener('change', handleChange);
    return () => el.removeEventListener('change', handleChange);
  }, []);

  const initializeGenderChart = (metrics) => {
    const ctx = document.getElementById('genderChart')?.getContext('2d');
    if (!ctx) return;

    const genderData = metrics.demographics?.gender || [
      { type: 'Male', percentage: 45 },
      { type: 'Female', percentage: 52 },
      { type: 'Other', percentage: 3 }
    ];

    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: genderData.map(g => g.type),
        datasets: [{
          data: genderData.map(g => g.percentage),
          backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56'],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true } },
          tooltip: {
            callbacks: {
              label: (context) => `${context.label}: ${context.parsed}%`
            }
          }
        }
      }
    });

    genderChartRef.current = { chart };
  };

  const initializeEngagementChart = (metrics) => {
    const ctx = document.getElementById('engagementChart')?.getContext('2d');
    if (!ctx) return;

    const engagementData = metrics.engagementTrends || {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      activeUsers: [1200, 1350, 1500, 1400, 1600, 1750],
      newUsers: [200, 250, 300, 280, 320, 350],
      interactions: [5400, 6200, 7100, 6800, 7500, 8200]
    };

    const chart = new Chart(ctx, {
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
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top' },
          tooltip: { mode: 'index', intersect: false }
        },
        scales: {
          x: { display: true, title: { display: true, text: 'Month' } },
          y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Users' } },
          y1: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'Interactions' }, grid: { drawOnChartArea: false } }
        }
      }
    });

    engagementChartRef.current = { chart };
  };

  const initializeGrowthChart = (metrics) => {
    const container = document.querySelector(`.${styles.chartsContainer}:nth-of-type(2)`);
    if (!container) return;

    const div = document.createElement('div');
    div.className = styles.chartCard;
    div.innerHTML = `<h3>Customer Growth Over Time</h3><canvas id="customerGrowthChart"></canvas>`;
    container.appendChild(div);

    const growthData = metrics.growthData || {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      totalCustomers: [5000, 5200, 5500, 5800, 6100, 6500],
      monthlyGrowth: [200, 300, 300, 300, 400]
    };

    const ctx = document.getElementById('customerGrowthChart')?.getContext('2d');
    if (!ctx) return;

    const chart = new Chart(ctx, {
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
        plugins: { legend: { position: 'top' } },
        scales: {
          y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Total Customers' } },
          y1: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'Monthly Growth' }, grid: { drawOnChartArea: false } }
        }
      }
    });

    growthChartRef.current = { chart, container: div };
  };

  const initializeRetentionChart = (metrics) => {
    const container = document.querySelector(`.${styles.chartsContainer}:nth-of-type(2)`);
    if (!container) return;

    const div = document.createElement('div');
    div.className = styles.chartCard;
    div.innerHTML = `<h3>Customer Retention Rate</h3><canvas id="retentionChart"></canvas>`;
    container.appendChild(div);

    const retentionData = metrics.retentionData || {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Month 2', 'Month 3'],
      retentionRates: [100, 85, 75, 68, 55, 45]
    };

    const ctx = document.getElementById('retentionChart')?.getContext('2d');
    if (!ctx) return;

    const chart = new Chart(ctx, {
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
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: (context) => `${context.dataset.label}: ${context.parsed.y}%`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: { display: true, text: 'Retention Rate (%)' },
            ticks: { callback: (value) => `${value}%` }
          }
        }
      }
    });

    retentionChartRef.current = { chart, container: div };
  };

  const updateChartsWithTimeRange = (timeRange) => {
    console.log('Updating charts for time range:', timeRange);
    showLoadingState();
    setTimeout(() => {
      hideLoadingState();
      console.log('Charts updated');
    }, 1000);
  };

  const showLoadingState = () => {
    document.querySelectorAll('canvas').forEach(c => c.style.opacity = '0.5');
  };

  const hideLoadingState = () => {
    document.querySelectorAll('canvas').forEach(c => c.style.opacity = '1');
  };

  return (
    <div className={styles.customerAnalyticsPage}>
      {error && <div className={styles.errorAlert}>{error}</div>}

      <div className={styles.analyticsHeader}>
        <h1>Customer Analytics</h1>
        <div className={styles.dateFilter}>
          <select ref={timeRangeRef} defaultValue="30">
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      {metrics ? (
        <>
          <div className={styles.metricsOverview}>
            <div className={styles.metricCard}>
              <h3>Total Customers</h3>
              <div className={styles.metricValue}>
                {metrics.totalCustomers?.toLocaleString() || 'N/A'}
              </div>
            </div>

            <div className={styles.metricCard}>
              <h3>Active Customers</h3>
              <div className={styles.metricValue}>
                {metrics.activeCustomers?.toLocaleString() || 'N/A'}
              </div>
              <div className={`${styles.metricChange} ${styles.positive}`}>
                <i className="fas fa-arrow-up"></i>
                {metrics.customerGrowth}% from last month
              </div>
            </div>
          </div>

          {/* Demographics Section */}
          <div className={styles.chartsContainer}>
            <div className={styles.chartCard}>
              <h3>Age Distribution</h3>
              <div className={styles.demographicsGrid}>
                {metrics.demographics?.age?.map((age, i) => (
                  <div key={i} className={styles.demographicItem}>
                    <div className={styles.ageRange}>{age.range}</div>
                    <div className={styles.percentageBar}>
                      <div className={styles.bar} style={{ width: `${age.percentage}%` }}></div>
                    </div>
                    <div className={styles.percentageValue}>{age.percentage}%</div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.chartCard}>
              <h3>Gender Distribution</h3>
              <canvas id="genderChart"></canvas>
              <div className={styles.genderStats}>
                {metrics.demographics?.gender?.map((gender, i) => (
                  <div key={i} className={styles.genderStat}>
                    <span className={styles.label}>{gender.type}</span>
                    <span className={styles.value}>{gender.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Engagement Charts */}
          <div className={styles.chartsContainer}>
            <div className={styles.chartCard}>
              <h3>Customer Engagement Trends</h3>
              <canvas id="engagementChart"></canvas>
            </div>
          </div>
        </>
      ) : (
        <div className={styles.noDataMessage}>
          <p>No customer analytics data available</p>
        </div>
      )}
    </div>
  );
};

export default CustomerAnalytics;