import React from 'react';

const TopContentSection = ({ collaborations = [] }) => (
  <div className="content-section">
    <h2>Previous Collaborations</h2>
    {collaborations.length > 0 ? (
      <div className="content-grid">
        {collaborations.map((collab, index) => (
          <div key={`${collab._id}-${index}`} className="content-card">
            <div className="content-platform">
              <i className="fas fa-handshake"></i>
              {collab.title}
            </div>

            <h3 className="post-title">
              {post.title || "Untitled Post"}
            </h3>

            <div className="content-stats">
              <div className="stat">
                <i className="fas fa-chart-line"></i>
                <span>{collab.roi ? `${collab.roi.toFixed(1)}%` : 'N/A'}</span>
                <label>ROI</label>
              </div>
              <div className="stat">
                <i className="fas fa-calendar-alt"></i>
                <span>{collab.end_date ? new Date(collab.end_date).toLocaleDateString() : 'N/A'}</span>
                <label>Ended</label>
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <p className="no-data-message">No previous collaborations found.</p>
    )}
  </div>
);

export default TopContentSection;


