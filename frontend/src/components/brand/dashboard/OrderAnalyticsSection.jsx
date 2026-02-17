import React, { useState, useEffect } from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const OrderAnalyticsSection = () => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/brand/orders/analytics`, {
                credentials: 'include'
            });

            const data = await response.json();
            if (data.success) {
                setAnalytics(data.analytics);
            } else {
                setError(data.message || 'Failed to fetch analytics');
            }
        } catch (err) {
            console.error('Error fetching order analytics:', err);
            setError('Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading analytics...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-danger" role="alert">
                <i className="fas fa-exclamation-triangle me-2"></i>
                {error}
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="alert alert-info" role="alert">
                <i className="fas fa-info-circle me-2"></i>
                No analytics data available yet.
            </div>
        );
    }

    // Prepare Status Breakdown Chart Data
    const statusChartData = {
        labels: ['Paid', 'Shipped', 'Delivered', 'Cancelled'],
        datasets: [
            {
                label: 'Orders by Status',
                data: [
                    analytics.statusBreakdown.paid,
                    analytics.statusBreakdown.shipped,
                    analytics.statusBreakdown.delivered,
                    analytics.statusBreakdown.cancelled
                ],
                backgroundColor: [
                    'rgba(255, 193, 7, 0.8)',   // Warning yellow for paid
                    'rgba(23, 162, 184, 0.8)',  // Info blue for shipped
                    'rgba(40, 167, 69, 0.8)',   // Success green for delivered
                    'rgba(220, 53, 69, 0.8)'    // Danger red for cancelled
                ],
                borderColor: [
                    'rgba(255, 193, 7, 1)',
                    'rgba(23, 162, 184, 1)',
                    'rgba(40, 167, 69, 1)',
                    'rgba(220, 53, 69, 1)'
                ],
                borderWidth: 2
            }
        ]
    };

    // Prepare Order Trend Chart Data
    const trendChartData = {
        labels: analytics.orderTrend.map(item => {
            const date = new Date(item._id);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }),
        datasets: [
            {
                label: 'Orders',
                data: analytics.orderTrend.map(item => item.count),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.4,
                yAxisID: 'y'
            },
            {
                label: 'Revenue ($)',
                data: analytics.orderTrend.map(item => item.revenue),
                borderColor: 'rgb(153, 102, 255)',
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                tension: 0.4,
                yAxisID: 'y1'
            }
        ]
    };

    const trendChartOptions = {
        responsive: true,
        interaction: {
            mode: 'index',
            intersect: false
        },
        plugins: {
            legend: {
                position: 'top'
            },
            title: {
                display: false
            }
        },
        scales: {
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                    display: true,
                    text: 'Orders'
                }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: {
                    display: true,
                    text: 'Revenue ($)'
                },
                grid: {
                    drawOnChartArea: false
                }
            }
        }
    };

    return (
        <div className="mt-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3>
                    <i className="fas fa-chart-line me-2 text-primary"></i>
                    Order Analytics
                </h3>
                <button onClick={fetchAnalytics} className="btn btn-sm btn-outline-primary">
                    <i className="fas fa-sync-alt me-1"></i>
                    Refresh
                </button>
            </div>

            {/* Revenue Cards */}
            <div className="row g-3 mb-4">
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                    <p className="text-muted small mb-1">Total Revenue</p>
                                    <h4 className="mb-0">${analytics.revenue.allTime.toFixed(2)}</h4>
                                </div>
                                <div className="bg-primary bg-opacity-10 p-2 rounded">
                                    <i className="fas fa-dollar-sign text-primary"></i>
                                </div>
                            </div>
                            <small className="text-success">
                                <i className="fas fa-arrow-up me-1"></i>
                                All time
                            </small>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                    <p className="text-muted small mb-1">This Month</p>
                                    <h4 className="mb-0">${analytics.revenue.thisMonth.toFixed(2)}</h4>
                                </div>
                                <div className="bg-info bg-opacity-10 p-2 rounded">
                                    <i className="fas fa-calendar-alt text-info"></i>
                                </div>
                            </div>
                            <small className="text-muted">
                                {analytics.orders.thisMonth} orders
                            </small>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                    <p className="text-muted small mb-1">Today</p>
                                    <h4 className="mb-0">${analytics.revenue.today.toFixed(2)}</h4>
                                </div>
                                <div className="bg-success bg-opacity-10 p-2 rounded">
                                    <i className="fas fa-chart-line text-success"></i>
                                </div>
                            </div>
                            <small className="text-muted">
                                {analytics.orders.today} orders
                            </small>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                    <p className="text-muted small mb-1">Avg. Order Value</p>
                                    <h4 className="mb-0">${analytics.avgOrderValue.toFixed(2)}</h4>
                                </div>
                                <div className="bg-warning bg-opacity-10 p-2 rounded">
                                    <i className="fas fa-shopping-cart text-warning"></i>
                                </div>
                            </div>
                            <small className="text-muted">
                                {analytics.orders.total} total orders
                            </small>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="row g-4 mb-4">
                {/* Order Trend  Line Chart */}
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white border-0 pt-3">
                            <h5 className="mb-0">
                                <i className="fas fa-chart-area me-2 text-primary"></i>
                                30-Day Order Trend
                            </h5>
                        </div>
                        <div className="card-body">
                            <Line data={trendChartData} options={trendChartOptions} />
                        </div>
                    </div>
                </div>

                {/* Status Breakdown Pie Chart */}
                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white border-0 pt-3">
                            <h5 className="mb-0">
                                <i className="fas fa-chart-pie me-2 text-primary"></i>
                                Status Breakdown
                            </h5>
                        </div>
                        <div className="card-body d-flex align-items-center justify-content-center">
                            <div style={{ maxWidth: '300px', width: '100%' }}>
                                <Pie data={statusChartData} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Products Table */}
            <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-0 pt-3">
                    <h5 className="mb-0">
                        <i className="fas fa-trophy me-2 text-warning"></i>
                        Top 5 Selling Products
                    </h5>
                </div>
                <div className="card-body p-0">
                    {analytics.topProducts && analytics.topProducts.length > 0 ? (
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th className="border-0">#</th>
                                        <th className="border-0">Product</th>
                                        <th className="border-0 text-end">Quantity Sold</th>
                                        <th className="border-0 text-end">Revenue</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analytics.topProducts.map((product, index) => (
                                        <tr key={product.productId}>
                                            <td>
                                                <span className={`badge ${index === 0 ? 'bg-warning' : index === 1 ? 'bg-secondary' : index === 2 ? 'bg-danger' : 'bg-light text-dark'}`}>
                                                    {index + 1}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    {product.image && (
                                                        <img
                                                            src={product.image}
                                                            alt={product.name}
                                                            className="rounded me-2"
                                                            style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                                            onError={(e) => { e.target.src = '/images/default-product.png'; }}
                                                        />
                                                    )}
                                                    <span className="fw-medium">{product.name}</span>
                                                </div>
                                            </td>
                                            <td className="text-end">
                                                <span className="badge bg-primary rounded-pill">
                                                    {product.totalQuantity} units
                                                </span>
                                            </td>
                                            <td className="text-end fw-bold text-success">
                                                ${product.totalRevenue.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-5 text-muted">
                            <i className="fas fa-box-open fa-3x mb-3"></i>
                            <p>No product sales data available yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderAnalyticsSection;
