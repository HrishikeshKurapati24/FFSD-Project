import React from 'react';

const TopCampaigns = ({ posts = [], formatNumber }) => (
  <div className="detail-card">
    <h2 className="card-title">Top Campaigns</h2>
    {posts.length > 0 ? (
      <div className="best-posts">
        {posts.map((post) => (
          <div className="post-card" key={post.id || post.title}>
            <img
              src={post.thumbnail || '/images/default-campaign.jpg'}
              alt={post.title || 'Campaign thumbnail'}
              className="post-image"
            />
            <div className="post-details">
              <div className="post-platform">
                <i className={`fab fa-${(post.platform || 'link').toLowerCase()}`} aria-hidden="true"></i>
                {post.title}
              </div>
              <div className="post-stats">
                <span>
                  <i className="fas fa-heart" aria-hidden="true"></i> {formatNumber(post.likes || 0)}
                </span>
                <span>
                  <i className="fas fa-comment" aria-hidden="true"></i> {formatNumber(post.comments || 0)}
                </span>
                {post.views !== undefined && (
                  <span>
                    <i className="fas fa-eye" aria-hidden="true"></i> {formatNumber(post.views || 0)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <p className="empty-state">No campaigns available to display.</p>
    )}
  </div>
);

export default TopCampaigns;

