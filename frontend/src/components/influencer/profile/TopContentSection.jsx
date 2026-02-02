import React from 'react';

const TopContentSection = ({ bestPosts = [] }) => (
  <div className="content-section">
    <h2>Top Performing Content</h2>
    {bestPosts.length > 0 ? (
      <div className="content-grid">
        {bestPosts.map((post, index) => (
          <div key={`${post.platform}-${index}`} className="content-card">
            <div className={`content-platform ${post.platform?.toLowerCase()}`}>
              <i className={`fab fa-${post.platform?.toLowerCase()}`}></i>
              {post.platform}
            </div>

            <h3 className="post-title">
              {post.title || "Untitled Post"}
            </h3>

            <div className="content-stats">
              <div className="stat">
                <i className="fas fa-heart"></i>
                <span>{post.likes?.toLocaleString() || 0}</span>
              </div>
              <div className="stat">
                <i className="fas fa-comment"></i>
                <span>{post.comments?.toLocaleString() || 0}</span>
              </div>
              <div className="stat">
                <i className="fas fa-eye"></i>
                <span>{post.views?.toLocaleString() || 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <p className="no-data-message">No content available to display.</p>
    )}
  </div>
);

export default TopContentSection;


