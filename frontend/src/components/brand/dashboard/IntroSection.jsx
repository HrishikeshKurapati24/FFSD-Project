import React from 'react';
import { Link } from 'react-router-dom';

const IntroSection = ({ brand, stats, subscriptionStatus, subscriptionLimits, activeOrders = [], completedOrders = [] }) => {
  return (
    <div className="intro">
      <h1>Welcome, {brand?.displayName || 'Brand'}</h1>
      <p>Powerful tools and real-time analytics to manage campaigns and grow your business.</p>

      {/* Performance Overview */}
      <section className="dashboard">
        <h2 className="section-header">Performance Overview</h2>
        <div className="dashboard-container">
          <div className="dashboard-card">
            <h3>Active Campaigns</h3>
            <div className="metric-value">
              {stats?.activeCampaigns || 0}
            </div>
            <div className="metric-label">Total running campaigns</div>
            <div className="trend-indicator trend-up">
              <i className="fas fa-arrow-up"></i>
              {stats?.campaignGrowth || 0}% from last month
            </div>
          </div>

          <div className="dashboard-card">
            <h3>Active Orders</h3>
            <div className="metric-value">
              {activeOrders.length || 0}
            </div>
            <div className="metric-label">Orders pending fulfillment</div>
            <div className="trend-indicator trend-neutral">
              <i className="fas fa-shopping-cart"></i>
              {completedOrders.length || 0} completed
            </div>
          </div>

          <div className="dashboard-card">
            <h3>Engagement Rate</h3>
            <div className="metric-value">
              {stats?.avgEngagement ? stats.avgEngagement.toFixed(1) : '0.0'}%
            </div>
            <div className="metric-label">Average across campaigns</div>
            <div className={`trend-indicator ${(stats?.engagementTrend || 0) >= 0 ? 'trend-up' : 'trend-down'}`}>
              <i className={`fas fa-arrow-${(stats?.engagementTrend || 0) >= 0 ? 'up' : 'down'}`}></i>
              {Math.abs(stats?.engagementTrend || 0)}% change
            </div>
          </div>

          <div className="dashboard-card">
            <h3>Total Reach</h3>
            <div className="metric-value">
              {stats?.totalReach ? stats.totalReach.toLocaleString() : '0'}
            </div>
            <div className="metric-label">Potential audience reached</div>
            <div className="trend-indicator trend-up">
              <i className="fas fa-arrow-up"></i>
              {stats?.reachGrowth || 0}% growth
            </div>
          </div>

          <div className="dashboard-card">
            <h3>ROI</h3>
            <div className="metric-value">
              {stats?.roi || 0}%
            </div>
            <div className="metric-label">Return on investment</div>
            <div className={`trend-indicator ${(stats?.roiTrend || 0) >= 0 ? 'trend-up' : 'trend-down'}`}>
              <i className={`fas fa-arrow-${(stats?.roiTrend || 0) >= 0 ? 'up' : 'down'}`}></i>
              {Math.abs(stats?.roiTrend || 0)}% change
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Limits Section */}
      {subscriptionLimits && (
        <section className="dashboard">
          <h2 className="section-header">Your Plan Limits</h2>
          <div className="dashboard-card">
            <h3>Current Plan</h3>
            <div className="metric-value">
              {subscriptionStatus?.subscription?.planId?.name || 'Free'}
            </div>
            <div className="metric-label">Your subscription plan</div>
            <div className="trend-indicator trend-up">
              <i className="fas fa-crown"></i>
              <Link to="/subscription/manage" style={{ color: 'inherit', textDecoration: 'none' }}>Manage Plan</Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default IntroSection;
