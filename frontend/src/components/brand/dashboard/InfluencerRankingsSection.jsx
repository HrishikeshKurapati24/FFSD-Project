import React from 'react';

const InfluencerRankingsSection = ({ rankings }) => {
  if (!rankings || rankings.length === 0) {
    return (
      <div className="card mb-4 mt-5">
        <div className="card-header">
          <h5 className="card-title mb-0">
            <i className="fas fa-trophy me-2"></i>
            Influencer Rankings
          </h5>
        </div>
        <div className="card-body">
          <p className="text-muted mb-0">No influencer rankings available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card mb-4 mt-5">
      <div className="card-header">
        <h5 className="card-title mb-0">
          <i className="fas fa-trophy me-2"></i>
          Influencer Rankings
        </h5>
      </div>
      <div className="card-body">
        <p className="text-muted">Ranked by revenue generated from their links across campaigns.</p>
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Influencer Name</th>
                <th>Total Revenue</th>
                <th>Campaigns</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((influencer, index) => (
                <tr key={influencer._id}>
                  <td>{index + 1}</td>
                  <td>{influencer.name}</td>
                  <td>${influencer.totalRevenue.toFixed(2)}</td>
                  <td>{influencer.campaignCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InfluencerRankingsSection;
