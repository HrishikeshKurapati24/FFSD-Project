import React, { useState } from 'react';

const ContentReviewModal = ({ modalRef, modalInstanceRef, isOpen, campaignName, content, loading, onClose, onReview }) => {
  // Separate submitted and approved content
  const submittedContent = content?.filter(c => c.status === 'submitted') || [];
  const approvedContent = content?.filter(c => c.status === 'approved' && c.status !== 'published') || [];

  const [activeTab, setActiveTab] = useState('submitted');

  const renderContentItem = (contentItem, showApproveButtons = true) => (
    <div key={contentItem._id} className="content-item" data-content-id={contentItem._id}>
      <div className="content-header">
        <div className="influencer-info">
          <img
            src={contentItem.influencer_id?.profilePicUrl || '/images/default-avatar.jpg'}
            alt={contentItem.influencer_id?.fullName || 'Influencer'}
            className="influencer-avatar"
          />
          <div>
            <h4>{contentItem.influencer_id?.fullName || 'Unknown'}</h4>
            <span className="content-date">
              {new Date(contentItem.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="status-badges">
          <span className={`content-status ${contentItem.status === 'submitted' ? 'status-submitted' :
            contentItem.status === 'approved' ? 'status-approved' :
              contentItem.status === 'rejected' ? 'status-rejected' :
                'status-submitted'
            }`}>
            {contentItem.status}
          </span>
          {contentItem.status === 'approved' && (
            <span className="badge bg-warning text-dark ms-2">
              <i className="fas fa-clock"></i> Awaiting Publication
            </span>
          )}
        </div>
      </div>

      {/* Deliverable Link Info */}
      {contentItem.deliverable_title && (
        <div className="deliverable-link-info alert alert-info py-2 px-3 mb-3">
          <i className="fas fa-link me-2"></i>
          <strong>Linked to Deliverable:</strong> {contentItem.deliverable_title}
        </div>
      )}

      <div className="content-body">
        <div className="content-meta mb-2">
          <span className="badge bg-secondary me-2">
            <i className="fas fa-tag"></i> {contentItem.content_type || 'Post'}
          </span>
          <span className="badge bg-primary">
            <i className="fas fa-hashtag"></i> {contentItem.platforms || 'Social Media'}
          </span>
        </div>

        <div className="content-caption mb-3">
          <strong>Caption:</strong>
          <p>{contentItem.caption || contentItem.description}</p>
        </div>

        {contentItem.media_urls && contentItem.media_urls.length > 0 && (
          <div className="content-media mb-3">
            {contentItem.media_urls.map((media, idx) => (
              <div key={idx} className="media-item">
                {media.type === 'image' ? (
                  <img src={media.url} alt="Content media" className="content-image" />
                ) : (
                  <video controls className="content-video">
                    <source src={media.url} type="video/mp4" />
                  </video>
                )}
              </div>
            ))}
          </div>
        )}

        {contentItem.special_instructions && (
          <div className="special-instructions alert alert-secondary py-2 px-3">
            <strong><i className="fas fa-info-circle me-2"></i>Special Instructions:</strong>
            <p className="mb-0 mt-1">{contentItem.special_instructions}</p>
          </div>
        )}
      </div>

      <div className="content-actions mt-3">
        {showApproveButtons && contentItem.status === 'submitted' ? (
          <>
            <button className="btn btn-success me-2" onClick={() => onReview(contentItem._id, 'approve')}>
              <i className="fas fa-check"></i> Approve
              {contentItem.deliverable_title && (
                <span className="small d-block mt-1" style={{ fontSize: '0.75rem' }}>
                  Will mark deliverable as complete
                </span>
              )}
            </button>
            <button className="btn btn-danger" onClick={() => onReview(contentItem._id, 'reject')}>
              <i className="fas fa-times"></i> Reject
            </button>
          </>
        ) : contentItem.status === 'approved' ? (
          <div className="text-muted">
            <i className="fas fa-check-circle text-success me-2"></i>
            Approved - Waiting for influencer to publish
          </div>
        ) : contentItem.status === 'rejected' ? (
          <span className="text-danger">
            <i className="fas fa-times-circle me-2"></i> Rejected
          </span>
        ) : null}
      </div>
    </div>
  );

  return (
    <div className="modal fade" ref={modalRef} id="contentReviewModal" tabIndex="-1" aria-labelledby="contentReviewModalLabel" aria-hidden="true">
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="contentReviewModalTitle">
              Review Content - {campaignName}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <>
                {/* Tabs for Submitted vs Approved */}
                <ul className="nav nav-tabs mb-3">
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 'submitted' ? 'active' : ''}`}
                      onClick={() => setActiveTab('submitted')}
                    >
                      <i className="fas fa-paper-plane me-2"></i>
                      Submitted ({submittedContent.length})
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 'approved' ? 'active' : ''}`}
                      onClick={() => setActiveTab('approved')}
                    >
                      <i className="fas fa-check-circle me-2"></i>
                      Approved - Awaiting Publication ({approvedContent.length})
                    </button>
                  </li>
                </ul>

                {/* Content Display */}
                <div className="content-list">
                  {activeTab === 'submitted' ? (
                    submittedContent.length > 0 ? (
                      submittedContent.map(contentItem => renderContentItem(contentItem, true))
                    ) : (
                      <div className="no-content alert alert-info">
                        <i className="fas fa-info-circle me-2"></i>
                        No content awaiting review.
                      </div>
                    )
                  ) : (
                    approvedContent.length > 0 ? (
                      approvedContent.map(contentItem => renderContentItem(contentItem, false))
                    ) : (
                      <div className="no-content alert alert-info">
                        <i className="fas fa-info-circle me-2"></i>
                        No approved content waiting for publication.
                      </div>
                    )
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentReviewModal;
