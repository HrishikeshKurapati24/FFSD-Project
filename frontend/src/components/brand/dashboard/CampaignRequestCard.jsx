import React from 'react';

const CampaignRequestCard = ({ request, onActivate, onViewDetails }) => {
  return (
    <div className="campaign-request-card">
      <div className="request-header">
        <h3>{request.title}</h3>
        <span className={`request-status ${request.status}`}>
          {request.status}
        </span>
      </div>
      <p className="request-description">{request.description}</p>
      <div className="request-details">
        <div className="meta-item">
          <i className="fas fa-calendar"></i>
          <span>Start: {new Date(request.start_date).toLocaleDateString()}</span>
        </div>
        <div className="meta-item">
          <i className="fas fa-clock"></i>
          <span>Duration: {request.duration} days</span>
        </div>
        <div className="meta-item">
          <i className="fas fa-dollar-sign"></i>
          <span>Budget: ${request.budget}</span>
        </div>
        <div className="meta-item">
          <i className="fas fa-users"></i>
          <span>Accepted Influencers: {request.influencers_count || 0}</span>
        </div>
        <div className="meta-item">
          <i className="fas fa-bullseye"></i>
          <span>Target: {request.target_audience}</span>
        </div>
        <div className="meta-item">
          <i className="fas fa-hashtag"></i>
          <span>Min Followers: {(request.min_followers || 0).toLocaleString()}</span>
        </div>
      </div>

      {request.products && request.products.length > 0 && (
        <div className="request-products mt-3">
          <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#666', marginBottom: '8px' }}>Products</h4>
          <div className="d-flex flex-wrap gap-2">
            {request.products.map(product => (
              <div key={product._id} className="request-product-tag d-flex align-items-center p-1 px-2 border rounded-pill bg-light" style={{ fontSize: '0.8rem' }}>
                <img
                  src={product.images?.[0]?.url || '/images/default-product.png'}
                  alt={product.name}
                  style={{ width: '20px', height: '20px', borderRadius: '50%', marginRight: '6px', objectFit: 'cover' }}
                />
                <span className="text-truncate" style={{ maxWidth: '100px' }}>{product.name}</span>
                <span className="ms-1 fw-bold text-primary">${product.campaign_price}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="request-actions">
        {request.status === 'request' && request._id && (
          <button className="btn-activate" onClick={() => onActivate(request._id)}>
            Activate Campaign
          </button>
        )}
        {request._id && (
          <button className="btn-view" onClick={() => onViewDetails(request._id)}>
            View Details
          </button>
        )}
      </div>
    </div>
  );
};

export default CampaignRequestCard;
