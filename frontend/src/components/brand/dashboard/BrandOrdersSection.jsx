import React, { useState } from 'react';
import Toast from '../../shared/Toast';
import OrderDetailsModal from '../../shared/OrderDetailsModal';
import styles from '../../../styles/brand/dashboard.module.css';

const BrandOrdersSection = ({ activeOrders = [], completedOrders = [], onStatusUpdate, campaigns = [] }) => {
    const [filter, setFilter] = useState('all');
    const [copyStatus, setCopyStatus] = useState(null);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const handleCopy = (text, type) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopyStatus(`${type} copied!`);
        setTimeout(() => setCopyStatus(null), 2000);
    };

    // Filter orders based on status tab and search/date filters
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [selectedCampaignId, setSelectedCampaignId] = useState('all');
    const [loading, setLoading] = useState(false);
    const [updatingOrderId, setUpdatingOrderId] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    // Local state for optimistic updates
    const [localActiveOrders, setLocalActiveOrders] = useState(activeOrders);
    const [localCompletedOrders, setLocalCompletedOrders] = useState(completedOrders);

    // Update local state when props change
    React.useEffect(() => {
        setLocalActiveOrders(activeOrders);
        setLocalCompletedOrders(completedOrders);
    }, [activeOrders, completedOrders]);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 5000);
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        const friendlyStatusName = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);

        if (!window.confirm(`Are you sure you want to mark this order as ${friendlyStatusName}?`)) {
            return;
        }

        setUpdatingOrderId(orderId);
        setLoading(true);

        // Find the order to update
        const orderToUpdate = [...localActiveOrders, ...localCompletedOrders].find(o => o._id === orderId);
        if (!orderToUpdate) {
            showToast('Order not found', 'error');
            setLoading(false);
            setUpdatingOrderId(null);
            return;
        }

        // Save original state for rollback
        const originalStatus = orderToUpdate.status;
        const wasInActive = localActiveOrders.some(o => o._id === orderId);

        // Optimistic update - update local state immediately
        const updatedOrder = { ...orderToUpdate, status: newStatus };

        // Move between active/completed based on new status
        if (['paid', 'shipped'].includes(newStatus)) {
            setLocalActiveOrders(prev => {
                const filtered = prev.filter(o => o._id !== orderId);
                return [...filtered, updatedOrder];
            });
            setLocalCompletedOrders(prev => prev.filter(o => o._id !== orderId));
        } else {
            setLocalCompletedOrders(prev => {
                const filtered = prev.filter(o => o._id !== orderId);
                return [...filtered, updatedOrder];
            });
            setLocalActiveOrders(prev => prev.filter(o => o._id !== orderId));
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/brand/orders/${orderId}/status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ newStatus })
            });

            const data = await response.json();

            if (data.success) {
                showToast(`Order status updated to ${friendlyStatusName} successfully!`, 'success');
                // Refresh from server to ensure consistency
                if (onStatusUpdate) {
                    onStatusUpdate();
                }
            } else {
                // Rollback on error
                const rolledBackOrder = { ...orderToUpdate, status: originalStatus };
                if (wasInActive) {
                    setLocalActiveOrders(prev => {
                        const filtered = prev.filter(o => o._id !== orderId);
                        return [...filtered, rolledBackOrder];
                    });
                    setLocalCompletedOrders(prev => prev.filter(o => o._id !== orderId));
                } else {
                    setLocalCompletedOrders(prev => {
                        const filtered = prev.filter(o => o._id !== orderId);
                        return [...filtered, rolledBackOrder];
                    });
                    setLocalActiveOrders(prev => prev.filter(o => o._id !== orderId));
                }
                showToast(data.message || 'Failed to update order status', 'error');
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            // Rollback on error
            const rolledBackOrder = { ...orderToUpdate, status: originalStatus };
            if (wasInActive) {
                setLocalActiveOrders(prev => {
                    const filtered = prev.filter(o => o._id !== orderId);
                    return [...filtered, rolledBackOrder];
                });
                setLocalCompletedOrders(prev => prev.filter(o => o._id !== orderId));
            } else {
                setLocalCompletedOrders(prev => {
                    const filtered = prev.filter(o => o._id !== orderId);
                    return [...filtered, rolledBackOrder];
                });
                setLocalActiveOrders(prev => prev.filter(o => o._id !== orderId));
            }
            showToast('Network error. Please try again.', 'error');
        } finally {
            setLoading(false);
            setUpdatingOrderId(null);
        }
    };

    const getFilteredOrders = () => {
        let orders = [...localActiveOrders, ...localCompletedOrders];

        // 1. Filter by Status Tab
        if (filter === 'pending') {
            orders = localActiveOrders.filter(o => o.status === 'paid');
        } else if (filter === 'shipped') {
            orders = localActiveOrders.filter(o => o.status === 'shipped');
        } else if (filter === 'completed') {
            orders = localCompletedOrders;
        }

        // 2. Filter by Search Term (Tracking ID, Customer Name, Email, Order ID)
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            orders = orders.filter(o =>
                (o.tracking_number && o.tracking_number.toLowerCase().includes(term)) ||
                (o._id.toLowerCase().includes(term)) ||
                (o.customer_id && (
                    (o.customer_id.name && o.customer_id.name.toLowerCase().includes(term)) ||
                    (o.customer_id.email && o.customer_id.email.toLowerCase().includes(term))
                )) ||
                (o.guest_info && (
                    (o.guest_info.name && o.guest_info.name.toLowerCase().includes(term)) ||
                    (o.guest_info.email && o.guest_info.email.toLowerCase().includes(term))
                ))
            );
        }

        // 3. Filter by Campaign
        if (selectedCampaignId !== 'all') {
            orders = orders.filter(o =>
                o.items.some(item => item.product_id && item.product_id.campaign_id === selectedCampaignId)
            );
        }

        // 4. Filter by Date Range
        if (dateRange.start) {
            const start = new Date(dateRange.start);
            start.setHours(0, 0, 0, 0);
            orders = orders.filter(o => new Date(o.createdAt) >= start);
        }
        if (dateRange.end) {
            const end = new Date(dateRange.end);
            end.setHours(23, 59, 59, 999);
            orders = orders.filter(o => new Date(o.createdAt) <= end);
        }

        return orders;
    };

    const resetFilters = () => {
        setSearchTerm('');
        setDateRange({ start: '', end: '' });
        setSelectedCampaignId('all');
        setFilter('all');
    };

    const filteredOrders = getFilteredOrders();

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'paid':
                return 'bg-warning text-dark';
            case 'shipped':
                return 'bg-info';
            case 'delivered':
                return 'bg-success';
            case 'cancelled':
                return 'bg-danger';
            default:
                return 'bg-secondary';
        }
    };

    return (
        <>
            <Toast
                message={toast.message}
                type={toast.type}
                show={toast.show}
                onClose={() => setToast({ show: false, message: '', type: 'success' })}
            />

            <div className="mt-5 position-relative">
                {copyStatus && (
                    <div className="position-absolute top-0 start-50 translate-middle-x badge bg-success p-2 shadow-sm" style={{ zIndex: 1050, transition: 'opacity 0.3s' }}>
                        <i className="fas fa-check-circle me-1"></i> {copyStatus}
                    </div>
                )}

                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h3>Orders ({filteredOrders.length})</h3>
                    <div className="btn-group" role="group">
                        <button
                            type="button"
                            className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setFilter('all')}
                        >
                            All ({localActiveOrders.length + localCompletedOrders.length})
                        </button>
                        <button
                            type="button"
                            className={`btn btn-sm ${filter === 'pending' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setFilter('pending')}
                        >
                            Pending ({localActiveOrders.filter(o => o.status === 'paid').length})
                        </button>
                        <button
                            type="button"
                            className={`btn btn-sm ${filter === 'shipped' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setFilter('shipped')}
                        >
                            Shipped ({localActiveOrders.filter(o => o.status === 'shipped').length})
                        </button>
                        <button
                            type="button"
                            className={`btn btn-sm ${filter === 'completed' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setFilter('completed')}
                        >
                            Completed ({localCompletedOrders.length})
                        </button>
                    </div>
                </div>

                {/* Search and Advanced Filters */}
                <div className="card mb-4 bg-light border-0 shadow-sm">
                    <div className="card-body p-3">
                        <div className="row g-3">
                            {/* Search Bar */}
                            <div className="col-md-4">
                                <label className="form-label small fw-bold mb-1">Search Orders</label>
                                <div className="input-group input-group-sm">
                                    <span className="input-group-text bg-white border-end-0">
                                        <i className="fas fa-search text-muted"></i>
                                    </span>
                                    <input
                                        type="text"
                                        className="form-control border-start-0"
                                        placeholder="Tracking ID, Name, Email..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Campaign Filter */}
                            <div className="col-md-3">
                                <label className="form-label small fw-bold mb-1">Filter by Campaign</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={selectedCampaignId}
                                    onChange={(e) => setSelectedCampaignId(e.target.value)}
                                >
                                    <option value="all">All Campaigns</option>
                                    {campaigns.map(c => (
                                        <option key={c._id} value={c._id}>
                                            {c.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Date Filter */}
                            <div className="col-md-4">
                                <label className="form-label small fw-bold mb-1">Date Range</label>
                                <div className="d-flex gap-2">
                                    <input
                                        type="date"
                                        className="form-control form-control-sm"
                                        value={dateRange.start}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                    />
                                    <span className="align-self-center text-muted small">to</span>
                                    <input
                                        type="date"
                                        className="form-control form-control-sm"
                                        value={dateRange.end}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                    />
                                </div>
                            </div>

                            {/* Reset Button */}
                            <div className="col-md-1 d-flex align-items-end">
                                <button
                                    className="btn btn-outline-secondary btn-sm w-100"
                                    onClick={resetFilters}
                                    title="Reset All Filters"
                                >
                                    <i className="fas fa-undo"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {filteredOrders.length === 0 ? (
                    <div className="text-center py-5 bg-light rounded text-muted">
                        <i className="fas fa-search-minus fa-3x mb-3"></i>
                        <p>No orders found matching your criteria.</p>
                        <button className="btn btn-link btn-sm" onClick={resetFilters}>Clear all filters</button>
                    </div>
                ) : (
                    <div className="row">
                        {filteredOrders.map((order) => (
                            <div key={order._id} className="col-12 mb-3">
                                <div className="card shadow-sm hover-shadow transition">
                                    <div className="card-body">
                                        <div className="row">
                                            <div className="col-md-9 border-end">
                                                <div className="d-flex justify-content-between align-items-start mb-3">
                                                    <div>
                                                        <h6 className="mb-0 fw-bold">
                                                            Order {order.tracking_number ? <span className="text-primary">{order.tracking_number}</span> : `#${order._id.substring(0, 8)}`}
                                                        </h6>
                                                        <small className="text-muted">
                                                            Placed on {formatDate(order.createdAt)}
                                                        </small>
                                                    </div>
                                                    <span className={`badge ${getStatusBadgeClass(order.status)} px-3 py-2 rounded-pill`}>
                                                        {order.status.toUpperCase()}
                                                    </span>
                                                </div>

                                                {/* Customer Info Section */}
                                                {(order.customer_id || order.guest_info) && (
                                                    <div className="mb-3 d-flex flex-wrap gap-2">
                                                        {/* Name */}
                                                        <div className="d-flex align-items-center bg-light rounded px-2 py-1 border small shadow-xs">
                                                            <i className="fas fa-user me-2 text-primary"></i>
                                                            <span className="fw-bold me-2">{(order.customer_id?.name || order.guest_info?.name) || 'N/A'}</span>
                                                            <button
                                                                className="btn btn-link btn-sm p-0 text-muted hover-primary"
                                                                onClick={() => handleCopy(order.customer_id?.name || order.guest_info?.name, 'Name')}
                                                                title="Copy Name"
                                                            >
                                                                <i className="far fa-copy"></i>
                                                            </button>
                                                        </div>

                                                        {/* Email */}
                                                        <div className="d-flex align-items-center bg-light rounded px-2 py-1 border small shadow-xs">
                                                            <i className="fas fa-envelope me-2 text-primary"></i>
                                                            <span className="me-2">{order.customer_id?.email || order.guest_info?.email}</span>
                                                            <button
                                                                className="btn btn-link btn-sm p-0 text-muted hover-primary"
                                                                onClick={() => handleCopy(order.customer_id?.email || order.guest_info?.email, 'Email')}
                                                                title="Copy Email"
                                                            >
                                                                <i className="far fa-copy"></i>
                                                            </button>
                                                        </div>

                                                        {/* Phone */}
                                                        {(order.customer_id?.phone || order.guest_info?.phone) && (
                                                            <div className="d-flex align-items-center bg-light rounded px-2 py-1 border small shadow-xs">
                                                                <i className="fas fa-phone me-2 text-primary"></i>
                                                                <span className="me-2">{order.customer_id?.phone || order.guest_info?.phone}</span>
                                                                <button
                                                                    className="btn btn-link btn-sm p-0 text-muted hover-primary"
                                                                    onClick={() => handleCopy(order.customer_id?.phone || order.guest_info?.phone, 'Phone')}
                                                                    title="Copy Phone"
                                                                >
                                                                    <i className="far fa-copy"></i>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="row mt-3">
                                                    <div className="col-md-7">
                                                        <strong className="small text-muted d-block mb-1">Products:</strong>
                                                        <ul className="list-unstyled mb-0">
                                                            {order.items.map((item, idx) => (
                                                                <li key={idx} className="small mb-1 d-flex align-items-center">
                                                                    <i className="fas fa-tag me-2 text-muted x-small"></i>
                                                                    <span>{item.product_id?.name || 'Unknown Product'} <span className="text-muted">× {item.quantity}</span></span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                        {/* Shipping Address Section */}
                                                        {order.shipping_address && (
                                                            <div className="mb-3 p-2 bg-light rounded border small">
                                                                <div className="fw-bold text-muted mb-1">
                                                                    <i className="fas fa-map-marker-alt me-1"></i> Shipping Address:
                                                                </div>
                                                                <div className="ms-3">
                                                                    <div>{order.shipping_address.name}</div>
                                                                    <div>{order.shipping_address.address_line1}</div>
                                                                    {order.shipping_address.address_line2 && <div>{order.shipping_address.address_line2}</div>}
                                                                    {(order.shipping_address.city || order.shipping_address.state || order.shipping_address.zip_code) && (
                                                                        <div>
                                                                            {[
                                                                                order.shipping_address.city,
                                                                                order.shipping_address.state,
                                                                                order.shipping_address.zip_code
                                                                            ].filter(Boolean).join(', ')}
                                                                        </div>
                                                                    )}
                                                                    {order.shipping_address.country && <div>{order.shipping_address.country}</div>}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="col-md-5 text-md-end d-flex flex-column justify-content-end">
                                                        <div className="small text-muted mb-1">Brand Total:</div>
                                                        <div className="fs-5 fw-bold text-dark">
                                                            ${order.brand_total ? order.brand_total.toFixed(2) : order.total_amount.toFixed(2)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="col-md-3 d-flex flex-column justify-content-center p-3">
                                                {order.status === 'paid' && (
                                                    <button
                                                        className="btn btn-primary btn-sm mb-2 w-100 shadow-sm"
                                                        onClick={() => handleStatusUpdate(order._id, 'shipped')}
                                                        disabled={loading && updatingOrderId === order._id}
                                                    >
                                                        {loading && updatingOrderId === order._id ? (
                                                            <><span className="spinner-border spinner-border-sm me-2"></span>Updating...</>
                                                        ) : (
                                                            <><i className="fas fa-shipping-fast me-2"></i>Mark as Shipped</>
                                                        )}
                                                    </button>
                                                )}
                                                {order.status === 'shipped' && (
                                                    <button
                                                        className="btn btn-success btn-sm mb-2 w-100 shadow-sm"
                                                        onClick={() => handleStatusUpdate(order._id, 'delivered')}
                                                        disabled={loading && updatingOrderId === order._id}
                                                    >
                                                        {loading && updatingOrderId === order._id ? (
                                                            <><span className="spinner-border spinner-border-sm me-2"></span>Updating...</>
                                                        ) : (
                                                            <><i className="fas fa-check-circle me-2"></i>Mark as Delivered</>
                                                        )}
                                                    </button>
                                                )}

                                                <button
                                                    className="btn btn-outline-primary btn-sm mb-2 w-100"
                                                    onClick={() => {
                                                        setSelectedOrder(order);
                                                        setShowOrderModal(true);
                                                    }}
                                                >
                                                    <i className="fas fa-eye me-2"></i> View Details
                                                </button>

                                                {['paid', 'shipped'].includes(order.status) && (
                                                    <button
                                                        className="btn btn-outline-danger btn-sm w-100"
                                                        onClick={() => handleStatusUpdate(order._id, 'cancelled')}
                                                        disabled={loading && updatingOrderId === order._id}
                                                    >
                                                        <i className="fas fa-times me-2"></i>Cancel Order
                                                    </button>
                                                )}

                                                {['delivered', 'cancelled'].includes(order.status) && (
                                                    <div className="text-center p-2 rounded bg-light small fw-bold text-muted">
                                                        {order.status === 'delivered' ? (
                                                            <><i className="fas fa-check-double text-success me-1"></i> Fulfilled</>
                                                        ) : (
                                                            <><i className="fas fa-ban text-danger me-1"></i> Cancelled</>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {selectedOrder && (
                <OrderDetailsModal
                    show={showOrderModal}
                    onClose={() => setShowOrderModal(false)}
                    order={selectedOrder}
                    userRole="brand"
                />
            )}
        </>
    );
};

export default BrandOrdersSection;
