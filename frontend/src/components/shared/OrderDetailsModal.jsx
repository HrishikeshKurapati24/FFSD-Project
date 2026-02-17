import React from 'react';

const OrderDetailsModal = ({ order, show, onClose }) => {
    if (!show || !order) return null;

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
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

    const statusOrder = ['paid', 'shipped', 'delivered'];
    const currentStatusIndex = statusOrder.indexOf(order.status);

    return (
        <>
            {/* Bootstrap Modal Backdrop */}
            <div
                className={`modal-backdrop fade ${show ? 'show' : ''}`}
                style={{ display: show ? 'block' : 'none' }}
                onClick={onClose}
            ></div>

            {/* Bootstrap Modal */}
            <div
                className={`modal fade ${show ? 'show' : ''}`}
                style={{ display: show ? 'block' : 'none' }}
                tabIndex="-1"
                role="dialog"
            >
                <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" role="document">
                    <div className="modal-content">
                        {/* Header */}
                        <div className="modal-header bg-primary text-white">
                            <h5 className="modal-title">
                                <i className="fas fa-file-invoice me-2"></i>
                                Order Details
                            </h5>
                            <button
                                type="button"
                                className="btn-close btn-close-white"
                                onClick={onClose}
                                aria-label="Close"
                            ></button>
                        </div>

                        {/* Body */}
                        <div className="modal-body">
                            {/* Order Header */}
                            <div className="mb-4 pb-3 border-bottom">
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="mb-2">
                                            <strong className="text-muted small">Tracking Number</strong>
                                            <div className="fs-5 fw-bold text-primary">
                                                {order.tracking_number || `#${order._id.substring(0, 8).toUpperCase()}`}
                                            </div>
                                        </div>
                                        <div>
                                            <strong className="text-muted small">Order Date</strong>
                                            <div>{formatDate(order.createdAt)}</div>
                                        </div>
                                    </div>
                                    <div className="col-md-6 text-md-end">
                                        <div className="mb-2">
                                            <strong className="text-muted small">Status</strong>
                                            <div>
                                                <span className={`badge ${getStatusBadgeClass(order.status)} px-3 py-2 fs-6`}>
                                                    {order.status?.toUpperCase() || 'PENDING'}
                                                </span>
                                            </div>
                                        </div>
                                        {order.estimated_delivery_date && ['paid', 'shipped'].includes(order.status) && (
                                            <div>
                                                <strong className="text-muted small">Estimated Delivery</strong>
                                                <div>{formatDate(order.estimated_delivery_date)}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Status Timeline */}
                            {order.status !== 'cancelled' && (
                                <div className="mb-4 pb-3 border-bottom">
                                    <h6 className="fw-bold mb-3">
                                        <i className="fas fa-shipping-fast me-2 text-primary"></i>
                                        Order Progress
                                    </h6>
                                    <div className="position-relative">
                                        <div className="d-flex justify-content-between">
                                            {statusOrder.map((status, idx) => (
                                                <div key={status} className="d-flex flex-column align-items-center" style={{ flex: 1 }}>
                                                    <div
                                                        className={`rounded-circle d-flex align-items-center justify-content-center mb-2`}
                                                        style={{
                                                            width: '40px',
                                                            height: '40px',
                                                            backgroundColor: idx <= currentStatusIndex ? '#0d6efd' : '#dee2e6',
                                                            color: 'white',
                                                            position: 'relative',
                                                            zIndex: 1
                                                        }}
                                                    >
                                                        <i className={`fas ${idx < currentStatusIndex ? 'fa-check' :
                                                            idx === currentStatusIndex ? 'fa-circle' :
                                                                'fa-circle'
                                                            }`}></i>
                                                    </div>
                                                    <small className={`text-center ${idx <= currentStatusIndex ? 'fw-bold' : 'text-muted'}`}>
                                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                                    </small>
                                                    {order.status_history && order.status_history.find(h => h.status === status) && (
                                                        <small className="text-muted">
                                                            {new Date(order.status_history.find(h => h.status === status).timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                        </small>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: '20px',
                                                left: '5%',
                                                right: '5%',
                                                height: '2px',
                                                backgroundColor: '#dee2e6',
                                                zIndex: 0
                                            }}
                                        >
                                            <div
                                                style={{
                                                    height: '100%',
                                                    backgroundColor: '#0d6efd',
                                                    width: `${(currentStatusIndex / (statusOrder.length - 1)) * 100}%`,
                                                    transition: 'width 0.3s ease'
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Status History */}
                            {order.status_history && order.status_history.length > 0 && (
                                <div className="mb-4 pb-3 border-bottom">
                                    <h6 className="fw-bold mb-3">
                                        <i className="fas fa-history me-2 text-primary"></i>
                                        Status History
                                    </h6>
                                    <div className="list-group">
                                        {[...order.status_history].reverse().map((history, idx) => (
                                            <div key={idx} className="list-group-item">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <span className={`badge ${getStatusBadgeClass(history.status)} me-2`}>
                                                            {history.status.toUpperCase()}
                                                        </span>
                                                        {history.notes && <span className="text-muted small">{history.notes}</span>}
                                                    </div>
                                                    <small className="text-muted">{formatDate(history.timestamp)}</small>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Products */}
                            <div className="mb-4 pb-3 border-bottom">
                                <h6 className="fw-bold mb-3">
                                    <i className="fas fa-box me-2 text-primary"></i>
                                    Items Ordered
                                </h6>
                                {order.items && order.items.map((item, idx) => (
                                    <div key={idx} className="d-flex align-items-center mb-3 pb-3 border-bottom">
                                        <img
                                            src={item.product_id?.images?.[0]?.url || '/images/default-product.png'}
                                            alt={item.product_id?.name || 'Product'}
                                            style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }}
                                            className="me-3"
                                            onError={(e) => { e.target.src = '/images/default-product.png'; }}
                                        />
                                        <div className="flex-grow-1">
                                            <div className="fw-bold">{item.product_id?.name || 'Unknown Product'}</div>
                                            <div className="text-muted small">Quantity: {item.quantity}</div>
                                            {item.product_id?.description && (
                                                <div className="text-muted small mt-1">{item.product_id.description.substring(0, 100)}...</div>
                                            )}
                                        </div>
                                        <div className="text-end">
                                            <div className="fw-bold">${item.subtotal ? item.subtotal.toFixed(2) : (item.price_at_purchase * item.quantity).toFixed(2)}</div>
                                            {item.price_at_purchase && (
                                                <div className="text-muted small">${item.price_at_purchase.toFixed(2)} each</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Order Summary & Logistics */}
                            <div className="row mb-3">
                                <div className="col-md-6">
                                    <h6 className="fw-bold mb-3">
                                        <i className="fas fa-dollar-sign me-2 text-primary"></i>
                                        Order Summary
                                    </h6>
                                    <div className="d-flex justify-content-between mb-1 small">
                                        <span>Subtotal</span>
                                        <span>${(order.total_amount - (order.shipping_cost || 0)).toFixed(2)}</span>
                                    </div>
                                    {order.shipping_cost > 0 && (
                                        <div className="d-flex justify-content-between mb-1 small">
                                            <span>Shipping</span>
                                            <span>${order.shipping_cost.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="d-flex justify-content-between pt-2 border-top fw-bold">
                                        <span>Total</span>
                                        <span className="text-primary">${order.total_amount.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 border-end">
                                    <h6 className="fw-bold mb-3">
                                        <i className="fas fa-user me-2 text-primary"></i>
                                        Customer Details
                                    </h6>
                                    {(() => {
                                        const name = order.customer_id?.name || order.guest_info?.name || 'N/A';
                                        const email = order.customer_id?.email || order.guest_info?.email || 'N/A';
                                        const phone = order.customer_id?.phone || order.guest_info?.phone;

                                        return (
                                            <div className="small">
                                                <div className="mb-1"><strong>Name:</strong> {name}</div>
                                                <div className="mb-1"><strong>Email:</strong> {email}</div>
                                                {phone && <div className="mb-1"><strong>Phone:</strong> {phone}</div>}
                                            </div>
                                        );
                                    })()}
                                </div>
                                <div className="col-md-6">
                                    <h6 className="fw-bold mb-3">
                                        <i className="fas fa-map-marker-alt me-2 text-primary"></i>
                                        Shipping Address
                                    </h6>
                                    {order.shipping_address ? (
                                        <div className="small">
                                            <div className="fw-bold mb-1">{order.shipping_address.name || (order.customer_id?.name || order.guest_info?.name)}</div>
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
                                    ) : (
                                        <div className="text-muted small">No shipping address recorded</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default OrderDetailsModal;
