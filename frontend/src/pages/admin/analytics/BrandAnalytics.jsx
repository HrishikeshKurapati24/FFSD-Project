import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import styles from '../../../styles/admin/BrandAnalytics.module.css';
import { API_BASE_URL } from '../../../services/api';

const BrandAnalytics = () => {
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const brandGrowthChartRef = useRef(null);
  const revenueChartRef = useRef(null);
  const categoryChartRef = useRef(null);
  const performanceChartRef = useRef(null);
  const collabTrendsChartRef = useRef(null);
  const brandComparisonChartRef = useRef(null);
  const timeRangeRef = useRef(null);
  const chartsInitializedRef = useRef(false);

  // Fetch brand analytics data
  useEffect(() => {
    const fetchBrandAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/admin/brand-analytics`, {
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
          // The backend returns HTML for EJS, but we need JSON
          // Check if it's JSON or HTML
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            setMetrics(data);
          } else {
            // If HTML, try to parse or use default
            setError('Unable to load analytics data. Please try again.');
          }
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Failed to fetch brand analytics' }));
          setError(errorData.message || 'Failed to load brand analytics');
        }
      } catch (err) {
        console.error('Error fetching brand analytics:', err);
        setError('Failed to load brand analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchBrandAnalytics();
  }, []);

  // Destroy charts on unmount
  useEffect(() => {
    return () => {
      [brandGrowthChartRef, revenueChartRef, categoryChartRef, performanceChartRef, collabTrendsChartRef, brandComparisonChartRef]
        .forEach(ref => ref.current?.chart?.destroy());
    };
  }, []);

  // Initialize all charts
  useEffect(() => {
    if (!metrics) return;

    // Cleanup function to destroy all charts before creating new ones
    const cleanup = () => {
      // Destroy static charts
      if (brandGrowthChartRef.current?.chart) {
        brandGrowthChartRef.current.chart.destroy();
        brandGrowthChartRef.current = null;
      }
      if (revenueChartRef.current?.chart) {
        revenueChartRef.current.chart.destroy();
        revenueChartRef.current = null;
      }
      if (categoryChartRef.current?.chart) {
        categoryChartRef.current.chart.destroy();
        categoryChartRef.current = null;
      }

      // Destroy dynamic charts and remove their containers
      if (performanceChartRef.current?.chart) {
        performanceChartRef.current.chart.destroy();
      }
      if (performanceChartRef.current?.container && performanceChartRef.current.container.parentNode) {
        performanceChartRef.current.container.remove();
      }
      performanceChartRef.current = null;

      if (collabTrendsChartRef.current?.chart) {
        collabTrendsChartRef.current.chart.destroy();
      }
      if (collabTrendsChartRef.current?.container && collabTrendsChartRef.current.container.parentNode) {
        collabTrendsChartRef.current.container.remove();
      }
      collabTrendsChartRef.current = null;

      if (brandComparisonChartRef.current?.chart) {
        brandComparisonChartRef.current.chart.destroy();
      }
      if (brandComparisonChartRef.current?.container && brandComparisonChartRef.current.container.parentNode) {
        brandComparisonChartRef.current.container.remove();
      }
      brandComparisonChartRef.current = null;
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

      initializeBrandGrowthChart(metrics);
      initializeRevenueChart(metrics);
      initializeCategoryChart(metrics);
      initializeBrandPerformanceChart(metrics);
      initializeCollaborationTrendsChart(metrics);
      initializeBrandComparisonChart(metrics);
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
    const timeRangeEl = timeRangeRef.current;
    if (!timeRangeEl) return;

    const handleChange = (e) => {
      updateBrandChartsWithTimeRange(e.target.value);
    };

    timeRangeEl.addEventListener('change', handleChange);
    return () => timeRangeEl.removeEventListener('change', handleChange);
  }, []);

  const initializeBrandGrowthChart = (metrics) => {
    const ctx = document.getElementById('brandGrowthChart')?.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (brandGrowthChartRef.current?.chart) {
      brandGrowthChartRef.current.chart.destroy();
    }

    const rawGrowthData = metrics.monthlyGrowth || {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      data: [120, 135, 142, 158, 167, 185],
      newBrands: [15, 18, 12, 22, 19, 25]
    };

    // Limit data points to prevent infinite growth (max 12 months)
    const MAX_DATA_POINTS = 12;
    const growthData = {
      labels: Array.isArray(rawGrowthData.labels)
        ? rawGrowthData.labels.slice(-MAX_DATA_POINTS)
        : rawGrowthData.labels,
      data: Array.isArray(rawGrowthData.data)
        ? rawGrowthData.data.slice(-MAX_DATA_POINTS)
        : rawGrowthData.data,
      newBrands: Array.isArray(rawGrowthData.newBrands)
        ? rawGrowthData.newBrands.slice(-MAX_DATA_POINTS)
        : rawGrowthData.newBrands
    };

    const chart = new Chart(ctx, {
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
        resizeDelay: 0,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top', align: 'end' },
          tooltip: { mode: 'index', intersect: false }
        },
        scales: {
          x: {
            display: true,
            title: { display: true, text: 'Month' },
            grid: { display: false },
            ticks: {
              padding: 10,
              maxRotation: 45,
              minRotation: 0,
              callback: function (value, index) {
                const label = this.getLabelForValue(value);
                return label && label.length > 10 ? label.substring(0, 10) + '...' : label;
              }
            }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: { display: true, text: 'Total Active Brands' },
            beginAtZero: true,
            grid: { color: 'rgba(0, 0, 0, 0.05)', drawBorder: false },
            ticks: { padding: 10 }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: { display: true, text: 'New Brands' },
            grid: { drawOnChartArea: false }
          }
        }
      }
    });

    brandGrowthChartRef.current = { chart };
  };

  const initializeRevenueChart = (metrics) => {
    const ctx = document.getElementById('revenueChart')?.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (revenueChartRef.current?.chart) {
      revenueChartRef.current.chart.destroy();
    }

    const rawRevenueData = metrics.revenueData || {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      data: [125000, 142000, 138000, 165000, 178000, 195000],
      expenses: [85000, 95000, 92000, 108000, 115000, 125000]
    };

    // Limit data points to prevent infinite growth (max 12 months)
    const MAX_DATA_POINTS = 12;
    const revenueData = {
      labels: Array.isArray(rawRevenueData.labels)
        ? rawRevenueData.labels.slice(-MAX_DATA_POINTS)
        : rawRevenueData.labels,
      data: Array.isArray(rawRevenueData.data)
        ? rawRevenueData.data.slice(-MAX_DATA_POINTS)
        : rawRevenueData.data,
      expenses: Array.isArray(rawRevenueData.expenses)
        ? rawRevenueData.expenses.slice(-MAX_DATA_POINTS)
        : rawRevenueData.expenses
    };

    const chart = new Chart(ctx, {
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
        resizeDelay: 0,
        plugins: {
          legend: { position: 'top', align: 'end' },
          tooltip: {
            callbacks: {
              label: (context) => `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`,
              afterLabel: (context) => {
                if (context.datasetIndex === 0) {
                  const profit = context.parsed.y - revenueData.expenses[context.dataIndex];
                  return `Profit: $${profit.toLocaleString()}`;
                }
              }
            }
          }
        },
        scales: {
          x: {
            display: true,
            title: { display: true, text: 'Month' },
            grid: { display: false },
            ticks: {
              padding: 10,
              maxRotation: 45,
              minRotation: 0,
              callback: function (value, index) {
                const label = this.getLabelForValue(value);
                return label && label.length > 10 ? label.substring(0, 10) + '...' : label;
              }
            }
          },
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Amount ($)' },
            grid: { color: 'rgba(0, 0, 0, 0.05)', drawBorder: false },
            ticks: {
              callback: (value) => `$${value / 1000}K`,
              padding: 10
            }
          }
        }
      }
    });

    revenueChartRef.current = { chart };
  };

  const initializeCategoryChart = (metrics) => {
    const ctx = document.getElementById('categoryChart')?.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (categoryChartRef.current?.chart) {
      categoryChartRef.current.chart.destroy();
    }

    const categoryData = metrics.topCategories || [
      { name: 'Fashion & Beauty', percentage: 28, count: 45 },
      { name: 'Technology', percentage: 22, count: 35 },
      { name: 'Food & Beverage', percentage: 18, count: 29 },
      { name: 'Lifestyle', percentage: 16, count: 26 },
      { name: 'Health & Fitness', percentage: 16, count: 25 }
    ];

    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: categoryData.map(cat => cat.name),
        datasets: [{
          data: categoryData.map(cat => cat.percentage),
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
          borderWidth: 2,
          borderColor: '#fff',
          hoverBorderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        resizeDelay: 0,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              padding: 20,
              usePointStyle: true,
              pointStyle: 'circle',
              generateLabels: function (chart) {
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
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const category = categoryData[context.dataIndex];
                return `${context.label}: ${context.parsed}% (${category.count} brands)`;
              }
            }
          }
        },
        cutout: '60%'
      }
    });

    categoryChartRef.current = { chart };
  };

  const initializeBrandPerformanceChart = (metrics) => {
    const container = document.querySelector(`.${styles.chartsContainer}`);
    if (!container) return;

    // Destroy existing chart and remove container if it exists
    if (performanceChartRef.current?.chart) {
      performanceChartRef.current.chart.destroy();
    }
    if (performanceChartRef.current?.container && performanceChartRef.current.container.parentNode) {
      performanceChartRef.current.container.remove();
    }

    // Check if canvas already exists to prevent duplicates
    const existingCanvas = document.getElementById('brandPerformanceChart');
    if (existingCanvas) {
      existingCanvas.remove();
    }

    const div = document.createElement('div');
    div.className = styles.chartCard;
    div.innerHTML = `<h3>Brand Performance Metrics</h3><div style="position: relative; height: 400px; width: 100%;"><canvas id="brandPerformanceChart"></canvas></div>`;
    container.appendChild(div);

    const rawPerformanceData = metrics.brandPerformance || {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      avgEngagement: [4.2, 4.5, 4.8, 4.3, 5.1, 5.4],
      avgROI: [2.1, 2.3, 2.7, 2.5, 2.9, 3.2],
      campaignSuccess: [78, 82, 85, 80, 88, 92]
    };

    // Limit data points to prevent infinite growth (max 12 months)
    const MAX_DATA_POINTS = 12;
    const performanceData = {
      labels: Array.isArray(rawPerformanceData.labels)
        ? rawPerformanceData.labels.slice(-MAX_DATA_POINTS)
        : rawPerformanceData.labels,
      avgEngagement: Array.isArray(rawPerformanceData.avgEngagement)
        ? rawPerformanceData.avgEngagement.slice(-MAX_DATA_POINTS)
        : rawPerformanceData.avgEngagement,
      avgROI: Array.isArray(rawPerformanceData.avgROI)
        ? rawPerformanceData.avgROI.slice(-MAX_DATA_POINTS)
        : rawPerformanceData.avgROI,
      campaignSuccess: Array.isArray(rawPerformanceData.campaignSuccess)
        ? rawPerformanceData.campaignSuccess.slice(-MAX_DATA_POINTS)
        : rawPerformanceData.campaignSuccess
    };

    const ctx = document.getElementById('brandPerformanceChart')?.getContext('2d');
    if (!ctx) return;

    const chart = new Chart(ctx, {
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
                return context.datasetIndex === 1 ? `${label}${context.parsed.y}x ROI` : `${label}${context.parsed.y}%`;
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
          y1: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'ROI (x)' }, grid: { drawOnChartArea: false } },
          y2: { type: 'linear', display: false, position: 'right' }
        }
      }
    });

    performanceChartRef.current = { chart, container: div };
  };

  const initializeCollaborationTrendsChart = (metrics) => {
    const container = document.querySelector(`.${styles.chartsContainer}`);
    if (!container) return;

    // Destroy existing chart and remove container if it exists
    if (collabTrendsChartRef.current?.chart) {
      collabTrendsChartRef.current.chart.destroy();
    }
    if (collabTrendsChartRef.current?.container && collabTrendsChartRef.current.container.parentNode) {
      collabTrendsChartRef.current.container.remove();
    }

    // Check if canvas already exists to prevent duplicates
    const existingCanvas = document.getElementById('collaborationTrendsChart');
    if (existingCanvas) {
      existingCanvas.remove();
    }

    const div = document.createElement('div');
    div.className = styles.chartCard;
    div.innerHTML = `<h3>Collaboration Trends</h3><div style="position: relative; height: 400px; width: 100%;"><canvas id="collaborationTrendsChart"></canvas></div>`;
    container.appendChild(div);

    const rawCollabData = metrics.collaborationTrends || {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      totalCollabs: [145, 162, 178, 195, 210, 235],
      completedCollabs: [120, 138, 152, 168, 185, 205],
      avgDuration: [14, 16, 15, 18, 17, 19]
    };

    // Limit data points to prevent infinite growth (max 12 months)
    const MAX_DATA_POINTS = 12;
    const collabData = {
      labels: Array.isArray(rawCollabData.labels)
        ? rawCollabData.labels.slice(-MAX_DATA_POINTS)
        : rawCollabData.labels,
      totalCollabs: Array.isArray(rawCollabData.totalCollabs)
        ? rawCollabData.totalCollabs.slice(-MAX_DATA_POINTS)
        : rawCollabData.totalCollabs,
      completedCollabs: Array.isArray(rawCollabData.completedCollabs)
        ? rawCollabData.completedCollabs.slice(-MAX_DATA_POINTS)
        : rawCollabData.completedCollabs,
      avgDuration: Array.isArray(rawCollabData.avgDuration)
        ? rawCollabData.avgDuration.slice(-MAX_DATA_POINTS)
        : rawCollabData.avgDuration
    };

    const ctx = document.getElementById('collaborationTrendsChart')?.getContext('2d');
    if (!ctx) return;

    const chart = new Chart(ctx, {
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
        resizeDelay: 0,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                return context.datasetIndex === 2
                  ? `${label}: ${context.parsed.y} days`
                  : `${label}: ${context.parsed.y} collaborations`;
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
          y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Number of Collaborations' }, beginAtZero: true },
          y1: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'Duration (days)' }, grid: { drawOnChartArea: false } }
        }
      }
    });

    collabTrendsChartRef.current = { chart, container: div };
  };

  const initializeBrandComparisonChart = (metrics) => {
    const container = document.querySelector(`.${styles.chartsContainer}`);
    if (!container) return;

    // Destroy existing chart and remove container if it exists
    if (brandComparisonChartRef.current?.chart) {
      brandComparisonChartRef.current.chart.destroy();
    }
    if (brandComparisonChartRef.current?.container && brandComparisonChartRef.current.container.parentNode) {
      brandComparisonChartRef.current.container.remove();
    }

    // Check if canvas already exists to prevent duplicates
    const existingCanvas = document.getElementById('brandComparisonChart');
    if (existingCanvas) {
      existingCanvas.remove();
    }

    const div = document.createElement('div');
    div.className = styles.chartCard;
    div.innerHTML = `<h3>Top Brands Comparison</h3><div style="position: relative; height: 400px; width: 100%;"><canvas id="brandComparisonChart"></canvas></div>`;
    container.appendChild(div);

    const topBrands = (metrics.topBrands || []).slice(0, 5).length > 0 ? metrics.topBrands.slice(0, 5) : [
      { name: 'Nike', revenue: 125000, engagementRate: 7.2, activeCampaigns: 12 },
      { name: 'Adidas', revenue: 98000, engagementRate: 6.8, activeCampaigns: 9 },
      { name: 'Apple', revenue: 156000, engagementRate: 8.1, activeCampaigns: 15 },
      { name: 'Samsung', revenue: 87000, engagementRate: 5.9, activeCampaigns: 8 },
      { name: 'Coca-Cola', revenue: 142000, engagementRate: 6.5, activeCampaigns: 11 }
    ];

    const ctx = document.getElementById('brandComparisonChart')?.getContext('2d');
    if (!ctx) return;

    const chart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Revenue (K)', 'Engagement Rate', 'Active Campaigns', 'Brand Score', 'Market Reach'],
        datasets: topBrands.slice(0, 3).map((brand, i) => ({
          label: brand.name,
          data: [
            brand.revenue / 1000,
            brand.engagementRate,
            brand.activeCampaigns,
            brand.engagementRate * 10,
            brand.revenue / 2000
          ],
          borderColor: ['#FF6384', '#36A2EB', '#FFCE56'][i],
          backgroundColor: [`rgba(255, 99, 132, 0.2)`, `rgba(54, 162, 235, 0.2)`, `rgba(255, 206, 86, 0.2)`][i],
          borderWidth: 2,
          pointBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'][i],
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        resizeDelay: 0,
        plugins: { legend: { position: 'top' } },
        scales: {
          r: {
            beginAtZero: true,
            grid: { color: 'rgba(0, 0, 0, 0.1)' },
            pointLabels: {
              font: { size: 12 },
              callback: function (label) {
                return label && label.length > 10 ? label.substring(0, 10) + '...' : label;
              }
            }
          }
        }
      }
    });

    brandComparisonChartRef.current = { chart, container: div };
  };

  const updateBrandChartsWithTimeRange = (timeRange) => {
    console.log('Updating brand charts for time range:', timeRange);
    showLoadingState();
    setTimeout(() => {
      hideLoadingState();
      console.log('Brand charts updated');
    }, 1000);
  };

  const showLoadingState = () => {
    document.querySelectorAll('canvas').forEach(c => c.style.opacity = '0.5');
  };

  const hideLoadingState = () => {
    document.querySelectorAll('canvas').forEach(c => c.style.opacity = '1');
  };

  // Hover effect on metric cards
  useEffect(() => {
    const cards = document.querySelectorAll(`.${styles.metricCard}`);
    cards.forEach(card => {
      const enter = () => {
        card.style.transform = 'translateY(-5px)';
        card.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.1)';
        card.style.transition = 'all 0.3s ease';
      };
      const leave = () => {
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = 'none';
      };
      card.addEventListener('mouseenter', enter);
      card.addEventListener('mouseleave', leave);
      return () => {
        card.removeEventListener('mouseenter', enter);
        card.removeEventListener('mouseleave', leave);
      };
    });
  }, [metrics]);

  if (loading) {
    return (
      <div className={styles.brandAnalyticsPage}>
        <div className={styles.loadingMessage}>Loading brand analytics...</div>
      </div>
    );
  }

  return (
    <div className={styles.brandAnalyticsPage}>
      {error && <div className={styles.errorAlert}>{error}</div>}

      <div className={styles.analyticsHeader}>
        <h1>Brand Analytics</h1>
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
              <h3>Total Brands</h3>
              <div className={styles.metricValue}>
                {metrics.totalBrands != null ? metrics.totalBrands.toLocaleString() : 'N/A'}
              </div>
              <div className={`${styles.metricChange} ${metrics.brandGrowth >= 0 ? styles.positive : styles.negative}`}>
                <i className={`fas fa-${metrics.brandGrowth >= 0 ? 'arrow-up' : 'arrow-down'}`}></i>
                {Math.abs(metrics.brandGrowth)}% from last month
              </div>
            </div>

            <div className={styles.metricCard}>
              <h3>Active Brands</h3>
              <div className={styles.metricValue}>
                {metrics.activeBrands != null ? metrics.activeBrands.toLocaleString() : 'N/A'}
              </div>
              <div className={`${styles.metricChange} ${metrics.activeGrowth >= 0 ? styles.positive : styles.negative}`}>
                <i className={`fas fa-${metrics.activeGrowth >= 0 ? 'arrow-up' : 'arrow-down'}`}></i>
                {Math.abs(metrics.activeGrowth)}% from last month
              </div>
            </div>

            <div className={`${styles.metricCard} ${styles.highlightCard}`}>
              <h3>Highest Collaboration Value</h3>
              <div className={styles.metricValue}>
                ${metrics.highestCollabBrand?.value != null ? metrics.highestCollabBrand.value.toLocaleString() : 'N/A'}
              </div>
              <div className={styles.brandDetail}>
                <img
                  src={metrics.highestCollabBrand?.logo || '/images/default-brand-logo.jpg'}
                  alt={metrics.highestCollabBrand?.name || 'N/A'}
                  className={styles.brandMiniLogo}
                />
                <span>{metrics.highestCollabBrand?.name || 'N/A'}</span>
              </div>
            </div>

            <div className={`${styles.metricCard} ${styles.highlightCard}`}>
              <h3>Most Active Brand</h3>
              <div className={styles.metricValue}>
                {metrics.mostActiveBrand?.totalCollabs != null ? metrics.mostActiveBrand.totalCollabs : 'N/A'} collabs
              </div>
              <div className={styles.brandDetail}>
                <img
                  src={metrics.mostActiveBrand?.logo || '/images/default-brand-logo.jpg'}
                  alt={metrics.mostActiveBrand?.name || 'N/A'}
                  className={styles.brandMiniLogo}
                />
                <span>{metrics.mostActiveBrand?.name || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className={styles.chartsContainer}>
            <div className={styles.chartCard}>
              <h3>Brand Growth Trend</h3>
              <div style={{ position: 'relative', height: '400px', width: '100%' }}>
                <canvas id="brandGrowthChart"></canvas>
              </div>
            </div>

            <div className={styles.chartCard}>
              <h3>Revenue Overview</h3>
              <div style={{ position: 'relative', height: '400px', width: '100%' }}>
                <canvas id="revenueChart"></canvas>
              </div>
            </div>

            <div className={styles.chartCard}>
              <h3>Category Distribution</h3>
              <div style={{ position: 'relative', height: '400px', width: '100%' }}>
                <canvas id="categoryChart"></canvas>
              </div>
            </div>
          </div>

          <div className={styles.brandsTableContainer}>
            <h3>Top Performing Brands</h3>
            <table className={styles.brandsTable}>
              <thead>
                <tr>
                  <th>Brand</th>
                  <th>Category</th>
                  <th>Active Campaigns</th>
                  <th>Revenue</th>
                  <th>Engagement Rate</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {metrics.topBrands && metrics.topBrands.length > 0 ? (
                  metrics.topBrands.map((brand, i) => (
                    <tr key={i}>
                      <td>
                        <div className={styles.brandInfo}>
                          <img
                            src={brand.logo || '/images/default-brand-logo.jpg'}
                            alt={brand.name || 'N/A'}
                            className={styles.brandLogo}
                          />
                          <span>{brand.name || 'N/A'}</span>
                        </div>
                      </td>
                      <td>{brand.category || 'N/A'}</td>
                      <td>{brand.activeCampaigns ?? 0}</td>
                      <td>${brand.revenue != null ? brand.revenue.toLocaleString() : '0'}</td>
                      <td>{brand.engagementRate != null ? `${brand.engagementRate}%` : '0%'}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[brand.status?.toLowerCase() || 'pending']}`}>
                          {brand.status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                      <i className="fas fa-info-circle" style={{ marginRight: '0.5rem' }}></i>
                      No brand data available. Brands will appear here once they register and start campaigns.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className={styles.noDataMessage}>
          <p>No brand analytics data available</p>
        </div>
      )}
    </div>
  );
};

export default BrandAnalytics;