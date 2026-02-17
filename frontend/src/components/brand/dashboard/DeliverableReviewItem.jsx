import React, { useState } from 'react';

const DeliverableReviewItem = ({ deliverable, onReview, index }) => {
    const [feedback, setFeedback] = useState('');
    const [showRejectInput, setShowRejectInput] = useState(false);

    const {
        task_description,
        platform,
        num_posts,
        num_reels,
        num_videos,
        status,
        content_url,
        submitted_at,
        review_feedback
    } = deliverable;

    const deliverableId = deliverable.id || deliverable._id || deliverable.deliverable_id || deliverable._doc?._id;

    const isSubmitted = status === 'submitted';
    const isApproved = status === 'approved';
    const isRejected = status === 'rejected';

    const handleApprove = () => {
        if (onReview) {
            onReview(deliverableId, 'approve', feedback);
        }
    };

    const handleReject = () => {
        if (!showRejectInput) {
            setShowRejectInput(true);
            return;
        }
        if (!feedback.trim()) {
            alert('Please provide a reason for rejection.');
            return;
        }
        if (onReview) {
            onReview(deliverableId, 'reject', feedback);
        }
    };

    return (
        <div className="card mb-3 border-light shadow-sm">
            <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
                <div>
                    <h6 className="mb-0">Deliverable {index + 1}</h6>
                    {/* <small className="text-muted">{platform || 'Platform not specified'}</small> */}
                </div>
                <div>
                    <span className={`badge ${isApproved ? 'bg-success' :
                        isRejected ? 'bg-danger' :
                            isSubmitted ? 'bg-info text-dark' :
                                'bg-secondary'
                        }`}>
                        {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending'}
                    </span>
                </div>
            </div>
            <div className="card-body">
                {/* Requirements Section */}
                <div className="row mb-3">
                    <div className="col-md-12">
                        <strong>Task:</strong>
                        <p className="text-muted mb-0">{task_description || 'No description provided.'}</p>
                    </div>
                </div>
                {/* <div className="row mb-3">
                    <div className="col-4">
                        <small className="text-muted d-block">Posts</small>
                        <span>{num_posts || 0}</span>
                    </div>
                    <div className="col-4">
                        <small className="text-muted d-block">Reels</small>
                        <span>{num_reels || 0}</span>
                    </div>
                    <div className="col-4">
                        <small className="text-muted d-block">Videos</small>
                        <span>{num_videos || 0}</span>
                    </div>
                </div> */}

                {/* Submission Section */}
                {content_url ? (
                    <div className="submission-box p-3 bg-light rounded mt-3">
                        <h6 className="border-bottom pb-2 mb-2">Submission</h6>
                        <div className="mb-2">
                            <span className="text-muted small">Submitted on: {submitted_at ? new Date(submitted_at).toLocaleDateString() : 'Unknown date'}</span>
                        </div>
                        <div className="mb-3">
                            {/* Simple link for now, could be enhanced to embed if it's an image/video */}
                            <a href={content_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm">
                                <i className="fas fa-external-link-alt me-1"></i> View Content
                            </a>
                        </div>

                        {(isApproved || isRejected) && review_feedback && (
                            <div className={`alert ${isApproved ? 'alert-success' : 'alert-danger'} p-2 mt-2 mb-0`}>
                                <strong>Feedback:</strong> {review_feedback}
                            </div>
                        )}

                        {/* Review Controls - Only show if submitted (or explicitly pending if we allow manual override) */}
                        {onReview && (isSubmitted || isRejected) && (
                            <div className="review-actions mt-3 pt-3 border-top">
                                {showRejectInput && (
                                    <div className="mb-3">
                                        <label className="form-label small">Rejection Reason:</label>
                                        <textarea
                                            className="form-control form-control-sm"
                                            rows="2"
                                            value={feedback}
                                            onChange={(e) => setFeedback(e.target.value)}
                                            placeholder="Explain why this is rejected..."
                                        ></textarea>
                                    </div>
                                )}
                                <div className="d-flex gap-2">
                                    {!showRejectInput && (
                                        <button className="btn btn-success btn-sm" onClick={handleApprove}>
                                            <i className="fas fa-check me-1"></i> Approve
                                        </button>
                                    )}
                                    <button className="btn btn-danger btn-sm" onClick={handleReject}>
                                        <i className="fas fa-times me-1"></i> {showRejectInput ? 'Confirm Reject' : 'Reject'}
                                    </button>
                                    {showRejectInput && (
                                        <button className="btn btn-link btn-sm text-secondary" onClick={() => setShowRejectInput(false)}>
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="alert alert-secondary mt-3 mb-0">
                        <i className="fas fa-hourglass-half me-2"></i> No content submitted yet.
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeliverableReviewItem;
