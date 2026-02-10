import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../../services/api';
import CustomerNavbar from '../../components/customer/CustomerNavbar';
import '../../styles/customer/cart.module.css'; // Reusing cart styles for consistency

const OrderHistory = () => {
    const [orders, setOrders] = useState([]);
    const [purchasedBrands, setPurchasedBrands] = useState([]);
    const [purchasedInfluencers, setPurchasedInfluencers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrderHistory = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/customer/orders`, {
                    headers: {
                        'Accept': 'application/json'
                    },
                    credentials: 'include'
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch order history');
                }

                const data = await response.json();
                if (data.success) {
                    setOrders(data.orders || []);
                    setPurchasedBrands(data.purchasedBrands || []);
                    setPurchasedInfluencers(data.purchasedInfluencers || []);
                } else {
                    setError(data.message || 'Failed to load data');
                }
            } catch (err) {
                console.error("Error fetching order history:", err);
                setError('Failed to load order history. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchOrderHistory();
    }, []);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            <CustomerNavbar />

            <div className="container py-5">
                <div className="row mb-4">
                    <div className="col-12 text-center">
                        <h1 className="display-5 fw-bold mb-3">My Account</h1>
                        <p className="lead text-muted">Track your orders and connections</p>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : error ? (
                    <div className="alert alert-danger text-center">{error}</div>
                ) : (
                    <div className="row">
                        {/* Left Column: Order History */}
                        <div className="col-lg-8">
                            <h3 className="mb-4 pb-2 border-bottom">
                                <i className="fas fa-box-open me-2 text-primary"></i> Order History
                            </h3>

                            {orders.length === 0 ? (
                                <div className="text-center py-5 bg-white rounded shadow-sm">
                                    <i className="fas fa-shopping-basket fa-3x text-muted mb-3"></i>
                                    <h4>No orders yet</h4>
                                    <p className="text-muted">Start shopping from active campaigns!</p>
                                    <Link to="/customer" className="btn btn-primary mt-2">Browse Campaigns</Link>
                                </div>
                            ) : (
                                <div className="d-flex flex-column gap-3">
                                    {orders.map(order => (
                                        <div key={order._id} className="card border-0 shadow-sm">
                                            <div className="card-header bg-white border-bottom-0 d-flex justify-content-between align-items-center pt-3">
                                                <div>
                                                    <span className="text-muted small">Order #{order._id.toString().slice(-6).toUpperCase()}</span>
                                                    <div className="fw-bold">{formatDate(order.created_at)}</div>
                                                </div>
                                                <div className="text-end">
                                                    <span className={`badge bg-${order.status === 'delivered' ? 'success' : order.status === 'shipped' ? 'info' : 'warning'} rounded-pill px-3 py-2`}>
                                                        {order.status || 'Pending'}
                                                    </span>
                                                    <div className="fw-bold mt-1">${order.total_amount}</div>
                                                </div>
                                            </div>
                                            <div className="card-body">
                                                {order.items && order.items.map((item, idx) => (
                                                    <div key={idx} className="d-flex align-items-center mb-2">
                                                        <img
                                                            src={(item.product_id?.images?.[0]?.url) || '/images/default-product.png'}
                                                            alt={item.product_id?.name || 'Product'}
                                                            style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }}
                                                            className="me-3"
                                                            onError={(e) => { e.target.src = '/images/default-product.png'; }}
                                                        />
                                                        <div>
                                                            <div className="fw-bold">{item.product_id?.name || 'Unknown Product'}</div>
                                                            <div className="small text-muted">Qty: {item.quantity}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Right Column: Connections */}
                        <div className="col-lg-4 mt-4 mt-lg-0">
                            <h3 className="mb-4 pb-2 border-bottom">
                                <i className="fas fa-link me-2 text-primary"></i> My Connections
                            </h3>

                            {/* Brands */}
                            <h5 className="text-muted mb-3 small text-uppercase fw-bold">Brands You Support</h5>
                            <div className="row g-2 mb-4">
                                {purchasedBrands.length > 0 ? purchasedBrands.map((brand, idx) => (
                                    <div key={idx} className="col-6">
                                        <div className="card h-100 border-0 shadow-sm text-center p-3">
                                            <img
                                                src={brand.logoUrl || '/images/default-brand.png'}
                                                alt={brand.brandName}
                                                className="mx-auto mb-2 rounded-circle"
                                                style={{ width: '60px', height: '60px', objectFit: 'cover', border: '2px solid #f8f9fa' }}
                                                onError={(e) => { e.target.src = '/images/default-brand.png'; }}
                                            />
                                            <div className="fw-bold small text-truncate">{brand.brandName}</div>
                                            <small className="text-muted" style={{ fontSize: '0.75rem' }}>{brand.industry || 'Brand'}</small>
                                            {brand.website && (
                                                <a href={brand.website} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-secondary mt-2 py-0" style={{ fontSize: '0.7rem' }}>Visit</a>
                                            )}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="col-12"><p className="text-muted small">No brands connected yet.</p></div>
                                )}
                            </div>

                            {/* Influencers */}
                            <h5 className="text-muted mb-3 small text-uppercase fw-bold">Influencers You Supported</h5>
                            <div className="row g-2">
                                {purchasedInfluencers.length > 0 ? purchasedInfluencers.map((inf, idx) => (
                                    <div key={idx} className="col-6">
                                        <div className="card h-100 border-0 shadow-sm text-center p-3">
                                            <img
                                                src={inf.profilePicUrl || '/images/default-avatar.png'}
                                                alt={inf.displayName}
                                                className="mx-auto mb-2 rounded-circle"
                                                style={{ width: '60px', height: '60px', objectFit: 'cover', border: '2px solid #f8f9fa' }}
                                                onError={(e) => { e.target.src = '/images/default-avatar.png'; }}
                                            />
                                            <div className="fw-bold small text-truncate">{inf.displayName || inf.fullName}</div>
                                            <small className="text-muted" style={{ fontSize: '0.75rem' }}>{inf.niche || 'Influencer'}</small>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="col-12"><p className="text-muted small">No influencers connected yet.</p></div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderHistory;
