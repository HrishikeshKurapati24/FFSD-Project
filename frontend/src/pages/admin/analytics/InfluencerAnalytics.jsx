import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import styles from '../../../styles/admin/InfluencerAnalytics.module.css';
import { API_BASE_URL } from '../../../services/api';

const InfluencerAnalytics = () => {
  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.href = '/admin/dashboard';
  };


  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('followers'); // default sort
  const categoryBreakdownChartRef = useRef(null);
  const performanceChartRef = useRef(null);
  const topInfluencersChartRef = useRef(null);
  const engagementTrendsChartRef = useRef(null);
  const followerGrowthChartRef = useRef(null);
  const timeRangeRef = useRef(null);
  const chartsInitializedRef = useRef(false);

  // Fetch influencer analytics data
  useEffect(() => {
    const fetchInfluencerAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/admin/influencer-analytics`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (response.status === 401) {
          window.location.href = '/admin/login';
          return;
        }

        if (response.ok) {
          const data = await response.json();
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            setMetrics(data);
          } else {
            setError('Unable to load analytics data. Please try again.');
          }
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Failed to fetch influencer analytics' }));
          setError(errorData.message || 'Failed to load influencer analytics');
        }
      } catch (err) {
        console.error('Error fetching influencer analytics:', err);
        setError('Failed to load influencer analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchInfluencerAnalytics();
  }, []);

  // Cleanup all charts on unmount
  useEffect(() => {
    return () => {
      [
        categoryBreakdownChartRef,
        performanceChartRef,
        topInfluencersChartRef,
        engagementTrendsChartRef,
        followerGrowthChartRef
      ].forEach(ref => {
        if (ref.current?.chart) ref.current.chart.destroy();
      });
    };
  }, []);

  // Initialize charts
  useEffect(() => {
    if (!metrics) return;

    // Cleanup function to destroy all charts before creating new ones
    const cleanup = () => {
      if (categoryBreakdownChartRef.current?.chart) {
        categoryBreakdownChartRef.current.chart.destroy();
        categoryBreakdownChartRef.current = null;
      }
      if (performanceChartRef.current?.chart) {
        performanceChartRef.current.chart.destroy();
        performanceChartRef.current = null;
      }
      if (topInfluencersChartRef.current?.chart) {
        topInfluencersChartRef.current.chart.destroy();
      }
      if (topInfluencersChartRef.current?.container && topInfluencersChartRef.current.container.parentNode) {
        topInfluencersChartRef.current.container.remove();
      }
      topInfluencersChartRef.current = null;
      if (engagementTrendsChartRef.current?.chart) {
        engagementTrendsChartRef.current.chart.destroy();
      }
      if (engagementTrendsChartRef.current?.container && engagementTrendsChartRef.current.container.parentNode) {
        engagementTrendsChartRef.current.container.remove();
      }
      engagementTrendsChartRef.current = null;
      if (followerGrowthChartRef.current?.chart) {
        followerGrowthChartRef.current.chart.destroy();
      }
      if (followerGrowthChartRef.current?.container && followerGrowthChartRef.current.container.parentNode) {
        followerGrowthChartRef.current.container.remove();
      }
      followerGrowthChartRef.current = null;
    };

    // Clean up any existing charts first
    cleanup();
    chartsInitializedRef.current = false;

    Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
    Chart.defaults.font.size = 12;
    Chart.defaults.plugins.legend.labels.usePointStyle = true;

    // Small delay to ensure DOM is ready and prevent multiple initializations
    const timer = setTimeout(() => {
      if (chartsInitializedRef.current) return; // Prevent multiple initializations
      chartsInitializedRef.current = true;

      initializeCategoryBreakdownChart(metrics);
      initializePerformanceChart(metrics);
      initializeTopInfluencersChart(metrics);
      initializeEngagementTrendsChart(metrics);
      initializeFollowerGrowthChart(metrics);
    }, 100);

    // Return cleanup function
    return () => {
      clearTimeout(timer);
      cleanup();
      chartsInitializedRef.current = false;
    };
  }, [metrics]);

  // Time range handler
  useEffect(() => {
    const el = timeRangeRef.current;
    if (!el) return;

    const handleChange = (e) => {
      updateInfluencerChartsWithTimeRange(e.target.value);
    };

    el.addEventListener('change', handleChange);
    return () => el.removeEventListener('change', handleChange);
  }, []);

  const initializeCategoryBreakdownChart = (metrics) => {
    const ctx = document.getElementById('categoryBreakdownChart')?.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (categoryBreakdownChartRef.current?.chart) {
      categoryBreakdownChartRef.current.chart.destroy();
    }

    const categoryData = metrics.categoryBreakdown || [
      { name: 'Fashion & Beauty', percentage: 35, count: 450 },
      { name: 'Technology', percentage: 25, count: 320 },
      { name: 'Lifestyle', percentage: 20, count: 260 },
      { name: 'Food & Travel', percentage: 15, count: 195 },
      { name: 'Fitness', percentage: 5, count: 65 }
    ];

    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: categoryData.map(cat => cat.name),
        datasets: [{
          data: categoryData.map(cat => cat.percentage),
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        resizeDelay: 0,
        plugins: {
          legend: { position: 'right', labels: { padding: 20, usePointStyle: true } },
          tooltip: {
            callbacks: {
              label: (context) => {
                const category = categoryData[context.dataIndex];
                return `${context.label}: ${context.parsed}% (${category.count} influencers)`;
              }
            }
          }
        },
        cutout: '60%'
      }
    });

    categoryBreakdownChartRef.current = { chart };
  };

  const initializePerformanceChart = (metrics) => {
    const ctx = document.getElementById('performanceChart')?.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (performanceChartRef.current?.chart) {
      performanceChartRef.current.chart.destroy();
    }

    const rawPerformanceData = metrics.performanceData || {
      labels: (() => {
        const rawLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const MAX_DATA_POINTS = 12;
        return Array.isArray(rawLabels) ? rawLabels.slice(-MAX_DATA_POINTS) : rawLabels;
      })(),
      engagement: [4.2, 4.5, 4.8, 4.3, 5.1, 5.4],
      collaborations: [45, 52, 48, 61, 58, 67],
      reach: [125000, 142000, 138000, 156000, 162000, 178000]
    };

    // Limit data points to prevent infinite growth (max 12 months)
    const MAX_DATA_POINTS = 12;
    const performanceData = {
      labels: Array.isArray(rawPerformanceData.labels)
        ? rawPerformanceData.labels.slice(-MAX_DATA_POINTS)
        : rawPerformanceData.labels,
      engagement: Array.isArray(rawPerformanceData.engagement)
        ? rawPerformanceData.engagement.slice(-MAX_DATA_POINTS)
        : rawPerformanceData.engagement,
      collaborations: Array.isArray(rawPerformanceData.collaborations)
        ? rawPerformanceData.collaborations.slice(-MAX_DATA_POINTS)
        : rawPerformanceData.collaborations,
      reach: Array.isArray(rawPerformanceData.reach)
        ? rawPerformanceData.reach.slice(-MAX_DATA_POINTS)
        : rawPerformanceData.reach
    };

    const chart = new Chart(ctx, {
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
        resizeDelay: 0,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: (context) => {
                let label = context.dataset.label || '';
                if (label) label += ': ';
                if (context.datasetIndex === 2) return `${label}${context.parsed.y}K`;
                if (context.datasetIndex === 0) return `${label}${context.parsed.y}%`;
                return `${label}${context.parsed.y}`;
              }
            }
          }
        },
        scales: {
          x: {
            display: true,
            title: { display: true, text: 'Month' },
            ticks: {
              maxRotation: 45,
              minRotation: 0,
              callback: function (value, index) {
                const label = this.getLabelForValue(value);
                return label && label.length > 10 ? label.substring(0, 10) + '...' : label;
              }
            }
          },
          y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Engagement Rate (%)' } },
          y1: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'Collaborations' }, grid: { drawOnChartArea: false } },
          y2: { type: 'linear', display: false, position: 'right' }
        }
      }
    });

    performanceChartRef.current = { chart };
  };

  const initializeTopInfluencersChart = (metrics) => {
    const container = document.querySelector(`.${styles.chartsContainer}:nth-of-type(2)`);
    if (!container) return;

    // Destroy existing chart and remove container if it exists
    if (topInfluencersChartRef.current?.chart) {
      topInfluencersChartRef.current.chart.destroy();
    }
    if (topInfluencersChartRef.current?.container && topInfluencersChartRef.current.container.parentNode) {
      topInfluencersChartRef.current.container.remove();
    }

    // Check if canvas already exists to prevent duplicates
    const existingCanvas = document.getElementById('topInfluencersChart');
    if (existingCanvas) {
      existingCanvas.remove();
    }

    const div = document.createElement('div');
    div.className = styles.chartCard;
    div.innerHTML = `<h3>Top Influencers Performance</h3><div style="position: relative; height: 400px; width: 100%;"><canvas id="topInfluencersChart"></canvas></div>`;
    container.appendChild(div);

    const topInfluencersData = metrics.topInfluencers || [
      { name: 'Sarah Johnson', engagement: 8.5, followers: 125000 },
      { name: 'Mike Chen', engagement: 7.2, followers: 98000 },
      { name: 'Emma Davis', engagement: 6.8, followers: 156000 },
      { name: 'Alex Rodriguez', engagement: 9.1, followers: 87000 },
      { name: 'Lisa Wang', engagement: 7.9, followers: 142000 }
    ];

    const ctx = document.getElementById('topInfluencersChart')?.getContext('2d');
    if (!ctx) return;

    const chart = new Chart(ctx, {
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
        resizeDelay: 0,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                return context.datasetIndex === 1
                  ? `${label}: ${context.parsed.y}K followers`
                  : `${label}: ${context.parsed.y}% engagement`;
              }
            }
          }
        },
        scales: {
          x: {
            display: true,
            title: { display: true, text: 'Influencers' },
            ticks: {
              maxRotation: 45,
              minRotation: 0,
              callback: function (value, index) {
                const label = this.getLabelForValue(value);
                return label && label.length > 10 ? label.substring(0, 10) + '...' : label;
              }
            }
          },
          y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Engagement Rate (%)' } },
          y1: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'Followers (K)' }, grid: { drawOnChartArea: false } }
        }
      }
    });

    topInfluencersChartRef.current = { chart, container: div };
  };

  const initializeEngagementTrendsChart = (metrics) => {
    const container = document.querySelector(`.${styles.chartsContainer}:nth-of-type(2)`);
    if (!container) return;

    // Destroy existing chart and remove container if it exists
    if (engagementTrendsChartRef.current?.chart) {
      engagementTrendsChartRef.current.chart.destroy();
    }
    if (engagementTrendsChartRef.current?.container && engagementTrendsChartRef.current.container.parentNode) {
      engagementTrendsChartRef.current.container.remove();
    }

    // Check if canvas already exists to prevent duplicates
    const existingCanvas = document.getElementById('engagementTrendsChart');
    if (existingCanvas) {
      existingCanvas.remove();
    }

    const div = document.createElement('div');
    div.className = styles.chartCard;
    div.innerHTML = `<h3>Engagement Trends by Platform</h3><div style="position: relative; height: 400px; width: 100%;"><canvas id="engagementTrendsChart"></canvas></div>`;
    container.appendChild(div);

    const engagementTrends = metrics.engagementTrends || {
      labels: (() => {
        const rawLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const MAX_DATA_POINTS = 12;
        return Array.isArray(rawLabels) ? rawLabels.slice(-MAX_DATA_POINTS) : rawLabels;
      })(),
      instagram: [4.2, 4.5, 4.8, 4.3, 5.1, 5.4],
      youtube: [3.8, 4.1, 3.9, 4.4, 4.7, 4.9],
      tiktok: [6.5, 7.2, 7.8, 7.1, 8.2, 8.6]
    };

    const ctx = document.getElementById('engagementTrendsChart')?.getContext('2d');
    if (!ctx) return;

    const chart = new Chart(ctx, {
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
        resizeDelay: 0,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: (context) => `${context.dataset.label}: ${context.parsed.y}% engagement`
            }
          }
        },
        scales: {
          x: {
            display: true,
            title: { display: true, text: 'Month' },
            ticks: {
              maxRotation: 45,
              minRotation: 0,
              callback: function (value, index) {
                const label = this.getLabelForValue(value);
                return label && label.length > 10 ? label.substring(0, 10) + '...' : label;
              }
            }
          },
          y: { display: true, title: { display: true, text: 'Engagement Rate (%)' } }
        }
      }
    });

    engagementTrendsChartRef.current = { chart, container: div };
  };

  const initializeFollowerGrowthChart = (metrics) => {
    const container = document.querySelector(`.${styles.chartsContainer}:nth-of-type(2)`);
    if (!container) return;

    // Destroy existing chart and remove container if it exists
    if (followerGrowthChartRef.current?.chart) {
      followerGrowthChartRef.current.chart.destroy();
    }
    if (followerGrowthChartRef.current?.container && followerGrowthChartRef.current.container.parentNode) {
      followerGrowthChartRef.current.container.remove();
    }

    // Check if canvas already exists to prevent duplicates
    const existingCanvas = document.getElementById('followerGrowthChart');
    if (existingCanvas) {
      existingCanvas.remove();
    }

    const div = document.createElement('div');
    div.className = styles.chartCard;
    div.innerHTML = `<h3>Average Follower Growth</h3><div style="position: relative; height: 400px; width: 100%;"><canvas id="followerGrowthChart"></canvas></div>`;
    container.appendChild(div);

    const followerGrowth = metrics.followerGrowth || {
      labels: (() => {
        const rawLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const MAX_DATA_POINTS = 12;
        return Array.isArray(rawLabels) ? rawLabels.slice(-MAX_DATA_POINTS) : rawLabels;
      })(),
      totalFollowers: [2.1, 2.3, 2.5, 2.7, 2.9, 3.2],
      monthlyGrowth: [8.5, 12.3, 9.8, 11.2, 7.4, 10.1]
    };

    const ctx = document.getElementById('followerGrowthChart')?.getContext('2d');
    if (!ctx) return;

    const chart = new Chart(ctx, {
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
        resizeDelay: 0,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                return context.datasetIndex === 0
                  ? `${label}: ${context.parsed.y}M followers`
                  : `${label}: ${context.parsed.y}% growth`;
              }
            }
          }
        },
        scales: {
          x: {
            display: true,
            title: { display: true, text: 'Month' },
            ticks: {
              maxRotation: 45,
              minRotation: 0,
              callback: function (value, index) {
                const label = this.getLabelForValue(value);
                return label && label.length > 10 ? label.substring(0, 10) + '...' : label;
              }
            }
          },
          y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Total Followers (M)' } },
          y1: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'Growth Rate (%)' }, grid: { drawOnChartArea: false } }
        }
      }
    });

    followerGrowthChartRef.current = { chart, container: div };
  };

  const updateInfluencerChartsWithTimeRange = (timeRange) => {
    console.log('Updating influencer charts for time range:', timeRange);
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

  if (loading) {
    return (
      <div className={styles.influencerAnalyticsPage}>
        <button type="button" onClick={handleGoBack} className={styles.backButton}>
          ← Go Back
        </button>
        <div className={styles.loadingMessage}>Loading influencer analytics...</div>
      </div>
    );
  }

  return (
    <div className={styles.influencerAnalyticsPage}>
      <button type="button" onClick={handleGoBack} className={styles.backButton}>
        ← Go Back
      </button>
      {error && <div className={styles.errorAlert}>{error}</div>}

      <div className={styles.analyticsHeader}>
        <h1>Influencer Analytics</h1>
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
              <h3>Total Influencers</h3>
              <div className={styles.metricValue}>
                {metrics.totalInfluencers != null ? metrics.totalInfluencers.toLocaleString() : 'N/A'}
              </div>
            </div>

            <div className={styles.metricCard}>
              <h3>Active Influencers</h3>
              <div className={styles.metricValue}>
                {metrics.activeInfluencers != null ? metrics.activeInfluencers.toLocaleString() : 'N/A'}
              </div>
            </div>

            <div className={styles.metricCard}>
              <h3>Average Engagement</h3>
              <div className={styles.metricValue}>
                {metrics.averageEngagement != null ? `${metrics.averageEngagement}%` : 'N/A'}
              </div>
            </div>

            <div className={styles.metricCard}>
              <h3>Top Performing Influencer</h3>
              <div className={styles.metricValue}>
                {metrics.topInfluencer?.name || 'N/A'} with{' '}
                {metrics.topInfluencer?.engagementRate != null ? `${metrics.topInfluencer.engagementRate}%` : 'N/A'} engagement
              </div>
            </div>
          </div>

          <div className={styles.chartsContainer}>
            <div className={styles.chartCard}>
              <h3>Influencer Category Breakdown</h3>
              <div style={{ position: 'relative', height: '400px', width: '100%' }}>
                <canvas id="categoryBreakdownChart"></canvas>
              </div>
            </div>
            <div className={styles.chartCard}>
              <h3>Performance Metrics</h3>
              <div style={{ position: 'relative', height: '400px', width: '100%' }}>
                <canvas id="performanceChart"></canvas>
              </div>
            </div>
          </div>

          <div className={styles.chartsContainer}>
            {/* The following charts will be appended here by initializeTopInfluencersChart, etc. */}
          </div>

          <div className={styles.categoryDistribution}>
            <h3>Influencer Categories</h3>
            <div className={styles.categoryGrid}>
              {metrics.categoryBreakdown && metrics.categoryBreakdown.length > 0 ? (
                metrics.categoryBreakdown.map((category, i) => (
                  <div key={i} className={styles.categoryCard}>
                    <h4>{category.name || 'N/A'}</h4>
                    <div className={styles.categoryStats}>
                      <div className={styles.stat}>
                        <span className={styles.label}>Count:</span>
                        <span className={styles.value}>{category.count != null ? category.count : 'N/A'}</span>
                      </div>
                      <div className={styles.stat}>
                        <span className={styles.label}>Percentage:</span>
                        <span className={styles.value}>{category.percentage != null ? `${category.percentage}%` : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p>No category breakdown data available</p>
              )}
            </div>
          </div>

          <div className={styles.topInfluencersTableContainer}>
            <div className={styles.tableHeader}>
              <h3>Top Performing Influencers</h3>
              <div className={styles.sortControls}>
                <button
                  className={`${styles.sortButton} ${sortBy === 'engagement' ? styles.active : ''}`}
                  onClick={() => setSortBy('engagement')}
                >
                  Sort by Engagement
                </button>
                <button
                  className={`${styles.sortButton} ${sortBy === 'followers' ? styles.active : ''}`}
                  onClick={() => setSortBy('followers')}
                >
                  Sort by Followers
                </button>
              </div>
            </div>

            <table className={styles.influencersTable}>
              <thead>
                <tr>
                  <th>Influencer</th>
                  <th>Category</th>
                  <th>Total Followers</th>
                  <th>Engagement Rate</th>
                </tr>
              </thead>
              <tbody>
                {metrics.topInfluencers && [...metrics.topInfluencers]
                  .sort((a, b) => {
                    if (sortBy === 'followers') return (b.followers || 0) - (a.followers || 0);
                    return (b.engagement || 0) - (a.engagement || 0);
                  })
                  .map((influencer, index) => (
                    <tr key={index}>
                      <td>
                        <div className={styles.influencerInfo}>
                          <img
                            src={influencer.logo || '/images/default-profile.png'}
                            alt={influencer.name}
                            className={styles.influencerLogo}
                          />
                          <span>{influencer.name || 'N/A'}</span>
                        </div>
                      </td>
                      <td>{influencer.category || 'N/A'}</td>
                      <td>{influencer.followers != null ? influencer.followers.toLocaleString() : 'N/A'}</td>
                      <td>{influencer.engagement != null ? `${influencer.engagement}%` : 'N/A'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className={styles.noDataMessage}>
          <p>No influencer analytics data available</p>
        </div>
      )}
    </div>
  );
};

export default InfluencerAnalytics;