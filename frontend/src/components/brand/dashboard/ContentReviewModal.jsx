import React from 'react';

const ContentReviewModal = ({ modalRef, modalInstanceRef, isOpen, campaignName, content, loading, onClose, onReview }) => {
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
            <div className="content-list">
              {loading ? (
                <p>Loading content...</p>
              ) : content && content.length > 0 ? (
                content.map(contentItem => (
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
                      <span className={`content-status ${contentItem.status === 'submitted' ? 'status-submitted' :
                        contentItem.status === 'approved' ? 'status-approved' :
                          contentItem.status === 'rejected' ? 'status-rejected' :
                            'status-submitted'
                        }`}>
                        {contentItem.status}
                      </span>
                    </div>
                    <div className="content-body">
                      <div className="content-caption">
                        <p>{contentItem.caption}</p>
                      </div>
                      {contentItem.media_urls && contentItem.media_urls.length > 0 && (
                        <div className="content-media">
                          {contentItem.media_urls.map((media, idx) => (
                            <div key={idx}>
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
                        <div className="special-instructions">
                          <strong>Special Instructions:</strong>
                          <p>{contentItem.special_instructions}</p>
                        </div>
                      )}
                    </div>
                    <div className="content-actions">
                      {contentItem.status === 'submitted' ? (
                        <>
                          <button className="btn-approve" onClick={() => onReview(contentItem._id, 'approve')}>
                            <i className="fas fa-check"></i> Approve
                          </button>
                          <button className="btn-reject" onClick={() => onReview(contentItem._id, 'reject')}>
                            <i className="fas fa-times"></i> Reject
                          </button>
                        </>
                      ) : contentItem.status === 'approved' ? (
                        <span className="status-approved">
                          <i className="fas fa-check-circle"></i> Approved
                        </span>
                      ) : contentItem.status === 'rejected' ? (
                        <span className="status-rejected">
                          <i className="fas fa-times-circle"></i> Rejected
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-content">
                  <p>No content submitted for this campaign yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentReviewModal;
