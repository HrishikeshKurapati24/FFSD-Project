import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import styles from '../../../styles/admin/CampaignAnalytics.module.css';
import { API_BASE_URL } from '../../../services/api';

const CampaignAnalytics = () => {
  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.href = '/admin/dashboard';
  };

  const goBackButtonStyle = {
    padding: '0.5rem 1rem',
    border: '1px solid #ddd',
    borderRadius: '6px',
    backgroundColor: '#fff',
    color: '#2c3e50',
    cursor: 'pointer',
    marginBottom: '1rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem'
  };

  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const campaignTypesChartRef = useRef(null);
  const engagementTrendsChartRef = useRef(null);
  const timeRangeRef = useRef(null);
  const chartsInitializedRef = useRef(false);

  // Fetch campaign analytics data
  useEffect(() => {
    const fetchCampaignAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/admin/campaign-analytics`, {
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
          const errorData = await response.json().catch(() => ({ message: 'Failed to fetch campaign analytics' }));
          setError(errorData.message || 'Failed to load campaign analytics');
        }
      } catch (err) {
        console.error('Error fetching campaign analytics:', err);
        setError('Failed to load campaign analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaignAnalytics();
  }, []);

  // Cleanup charts on unmount
  useEffect(() => {
    return () => {
      [campaignTypesChartRef, engagementTrendsChartRef].forEach(ref => {
        if (ref.current?.chart) ref.current.chart.destroy();
      });
    };
  }, []);

  // Initialize charts
  useEffect(() => {
    if (!metrics) return;

    // Cleanup function to destroy all charts before creating new ones
    const cleanup = () => {
      if (campaignTypesChartRef.current?.chart) {
        campaignTypesChartRef.current.chart.destroy();
        campaignTypesChartRef.current = null;
      }
      if (engagementTrendsChartRef.current?.chart) {
        engagementTrendsChartRef.current.chart.destroy();
        engagementTrendsChartRef.current = null;
      }
    };

    // Clean up any existing charts first
    cleanup();
    chartsInitializedRef.current = false;

    // Set Chart.js defaults
    Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
    Chart.defaults.font.size = 12;
    Chart.defaults.plugins.legend.labels.usePointStyle = true;

    // Small delay to ensure DOM is ready and prevent multiple initializations
    const timer = setTimeout(() => {
      if (chartsInitializedRef.current) return; // Prevent multiple initializations
      chartsInitializedRef.current = true;

      initializeCampaignTypesChart(metrics);
      initializeEngagementTrendsChart(metrics);
    }, 100);

    // Return cleanup function
    return () => {
      clearTimeout(timer);
      cleanup();
      chartsInitializedRef.current = false;
    };
  }, [metrics]);

  // Time range change handler
  useEffect(() => {
    const el = timeRangeRef.current;
    if (!el) return;

    const handleChange = (e) => {
      console.log('Updating campaign analytics for time range:', e.target.value);
      // Backend should handle this via API
    };

    el.addEventListener('change', handleChange);
    return () => el.removeEventListener('change', handleChange);
  }, []);

  const initializeCampaignTypesChart = (metrics) => {
    const ctx = document.getElementById('campaignTypesChart')?.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (campaignTypesChartRef.current?.chart) {
      campaignTypesChartRef.current.chart.destroy();
    }

    const labels = metrics.campaignTypesData?.labels || ['Product Launch', 'Brand Awareness', 'Influencer Collab', 'Event', 'Giveaway'];
    const counts = metrics.campaignTypesData?.counts || [45, 38, 29, 22, 18];

    const chart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          data: counts,
          backgroundColor: ['#4CAF50', '#2196F3', '#FFC107', '#F44336', '#9C27B0'],
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        resizeDelay: 0,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              generateLabels: function(chart) {
                const data = chart.data;
                if (data.labels.length && data.datasets.length) {
                  return data.labels.map((label, i) => {
                    const truncatedLabel = label && label.length > 15 ? label.substring(0, 15) + '...' : label;
                    return {
                      text: truncatedLabel,
                      fillStyle: data.datasets[0].backgroundColor[i],
                      hidden: false,
                      index: i
                    };
                  });
                }
                return [];
              }
            }
          }
        }
      }
    });

    campaignTypesChartRef.current = { chart };
  };

  const initializeEngagementTrendsChart = (metrics) => {
    const ctx = document.getElementById('engagementTrendsChart')?.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (engagementTrendsChartRef.current?.chart) {
      engagementTrendsChartRef.current.chart.destroy();
    }

    const rawEngagementTrendsData = metrics.engagementTrendsData || {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      engagementRates: [4.2, 4.8, 5.1, 4.9, 5.6, 6.1],
      reach: [125000, 142000, 158000, 165000, 178000, 195000]
    };

    // Limit data points to prevent infinite growth (max 12 months)
    const MAX_DATA_POINTS = 12;
    const labels = Array.isArray(rawEngagementTrendsData.labels)
      ? rawEngagementTrendsData.labels.slice(-MAX_DATA_POINTS)
      : rawEngagementTrendsData.labels;
    const engagementRates = Array.isArray(rawEngagementTrendsData.engagementRates)
      ? rawEngagementTrendsData.engagementRates.slice(-MAX_DATA_POINTS)
      : rawEngagementTrendsData.engagementRates;
    const reach = Array.isArray(rawEngagementTrendsData.reach)
      ? rawEngagementTrendsData.reach.slice(-MAX_DATA_POINTS)
      : rawEngagementTrendsData.reach;

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Engagement Rate (%)',
            data: engagementRates,
            borderColor: '#3e95cd',
            backgroundColor: '#3e95cd',
            tension: 0.4,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'Reach',
            data: reach,
            borderColor: '#8e5ea2',
            backgroundColor: '#8e5ea2',
            tension: 0.4,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6,
            yAxisID: 'y1'
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
            callbacks: {
              label: (context) => {
                if (context.datasetIndex === 1) {
                  return `${context.dataset.label}: ${context.parsed.y.toLocaleString()}`;
                }
                return `${context.dataset.label}: ${context.parsed.y}%`;
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
              callback: function(value, index) {
                const label = this.getLabelForValue(value);
                return label && label.length > 10 ? label.substring(0, 10) + '...' : label;
              }
            }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: { display: true, text: 'Engagement Rate (%)' },
            beginAtZero: true
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: { display: true, text: 'Reach' },
            grid: { drawOnChartArea: false },
            ticks: {
              callback: (value) => value.toLocaleString()
            }
          }
        }
      }
    });

    engagementTrendsChartRef.current = { chart };
  };

  if (loading) {
    return (
      <div className={styles.campaignAnalyticsPage}>
        <button type="button" onClick={handleGoBack} style={goBackButtonStyle}>
          ← Go Back
        </button>
        <div className={styles.loadingMessage}>Loading campaign analytics...</div>
      </div>
    );
  }

  return (
    <div className={styles.campaignAnalyticsPage}>
      <button type="button" onClick={handleGoBack} style={goBackButtonStyle}>
        ← Go Back
      </button>
      {error && <div className={styles.errorAlert}>{error}</div>}

      <div className={styles.analyticsHeader}>
        <h1>Campaign Analytics</h1>
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
              <h3>Total Campaigns</h3>
              <div className={styles.metricValue}>
                {metrics.totalCampaigns != null ? metrics.totalCampaigns.toLocaleString() : 'N/A'}
              </div>
            </div>

            <div className={styles.metricCard}>
              <h3>Active Campaigns</h3>
              <div className={styles.metricValue}>
                {metrics.activeCampaigns != null ? metrics.activeCampaigns.toLocaleString() : 'N/A'}
              </div>
              <div className={`${styles.metricChange} ${metrics.campaignGrowth >= 0 ? styles.positive : styles.negative}`}>
                <i className={`fas fa-${metrics.campaignGrowth >= 0 ? 'arrow-up' : 'arrow-down'}`}></i>
                {Math.abs(metrics.campaignGrowth)}% from last month
              </div>
            </div>

            <div className={styles.metricCard}>
              <h3>Campaign Success Rate</h3>
              <div className={styles.metricValue}>
                {metrics.successRate != null ? `${metrics.successRate}%` : 'N/A'}
              </div>
            </div>
          </div>

          <div className={styles.chartsContainer}>
            <div className={styles.chartCard}>
              <h3>Campaign Types Distribution</h3>
              <div style={{ position: 'relative', height: '400px', width: '100%' }}>
                <canvas id="campaignTypesChart"></canvas>
              </div>
            </div>

            <div className={styles.chartCard}>
              <h3>Engagement Trends</h3>
              <div style={{ position: 'relative', height: '400px', width: '100%' }}>
                <canvas id="engagementTrendsChart"></canvas>
              </div>
            </div>
          </div>

          <div className={styles.campaignsTableContainer}>
            <h3>Top Performing Campaigns</h3>
            <table className={styles.campaignsTable}>
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Brand</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                  <th>Engagement Rate</th>
                </tr>
              </thead>
              <tbody>
                {metrics.topCampaigns && metrics.topCampaigns.length > 0 ? (
                  metrics.topCampaigns.map((campaign, i) => (
                    <tr key={i}>
                      <td>{campaign.name || 'N/A'}</td>
                      <td>{campaign.brand || 'N/A'}</td>
                      <td>{campaign.startDate || 'N/A'}</td>
                      <td>{campaign.endDate || 'N/A'}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[campaign.status?.toLowerCase() || 'pending']}`}>
                          {campaign.status || 'N/A'}
                        </span>
                      </td>
                      <td>{campaign.engagementRate != null ? `${campaign.engagementRate}%` : 'N/A'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className={styles.noDataCell}>
                      No top campaigns data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className={styles.noDataMessage}>
          <p>No campaign analytics data available</p>
        </div>
      )}
    </div>
  );
};

export default CampaignAnalytics;