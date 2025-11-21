import React from 'react';

const DashboardOverview = ({ stats }) => {
  if (!stats) {
    return null;
  }

  const dashboardItems = [
    {
      title: 'Active Collaborations',
      value: stats.activeCollaborations || 0,
      content: (
        <>
          <div className="progress-bar">
            <div className="progress" style={{ '--progress': `${stats?.completionPercentage || 0}%` }}></div>
          </div>
          <small>{stats?.nearingCompletion || 0} nearing completion</small>
        </>
      )
    },
    {
      title: 'Performance Score',
      value: (stats.performanceScore || 0).toFixed(1),
      content: (
        <>
          <div className="rating-stars">
            {Array.from({ length: 5 }).map((_, i) => (
              <i
                key={i}
                className={`fas fa-star ${i < Math.floor(stats?.avgRating || 0) ? 'active' : ''}`}
              ></i>
            ))}
          </div>
          <small>Average Rating: {(stats?.avgRating || 0).toFixed(1)}</small>
        </>
      )
    },
    {
      title: 'Earnings Overview',
      value: `$${(stats.monthlyEarnings || 0).toLocaleString()}`,
      content: (
        <>
          <small className={stats?.earningsChange >= 0 ? 'positive' : 'negative'}>
            {stats?.earningsChange >= 0 ? '+' : ''}
            {stats?.earningsChange || 0}% from last month
          </small>
          <div className="total-earnings">
            <span>Total Earnings:</span>
            <span>${(stats?.totalEarnings || 0).toLocaleString()}</span>
          </div>
        </>
      )
    },
    {
      title: 'Audience & Engagement',
      value: (stats.totalFollowers || 0).toLocaleString(),
      content: (
        <div className="engagement-rate">
          <span>Avg. Engagement:</span>
          <span>{(stats?.avgEngagementRate || 0).toFixed(1)}%</span>
        </div>
      )
    }
  ];

  return (
    <section className="dashboard">
      <h2>Dashboard Overview</h2>
      <div className="dashboard-items">
        {dashboardItems.map((item) => (
          <div key={item.title} className="dashboard-item">
            <h3>{item.title}</h3>
            <p className={item.title === 'Performance Score' ? 'performance-score' : 'active-collabs-count'}>
              {item.value}
            </p>
            {item.content}
          </div>
        ))}
      </div>
    </section>
  );
};

export default DashboardOverview;


