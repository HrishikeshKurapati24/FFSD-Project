import React from 'react';

const ProductsByRevenueSection = ({ productsByRevenue = { high: [], medium: [], low: [], noRevenue: [] } }) => {
  const { high = [], medium = [], low = [], noRevenue = [] } = productsByRevenue;
  
  const hasProducts = high.length > 0 || medium.length > 0 || low.length > 0 || noRevenue.length > 0;
  
  // Styles object for consistent white background styling
  const styles = {
    section: {
      margin: '2rem auto',
      maxWidth: '1400px',
      padding: '0 1rem'
    },
    card: {
      background: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e9ecef',
      overflow: 'hidden'
    },
    header: {
      background: 'linear-gradient(135deg, #4285f4 0%, #1a73e8 100%)',
      color: 'white',
      padding: '1.25rem 1.5rem',
      borderBottom: 'none'
    },
    headerTitle: {
      margin: 0,
      fontSize: '1.1rem',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    body: {
      padding: '1.5rem',
      background: '#ffffff'
    },
    description: {
      color: '#666',
      fontSize: '0.95rem',
      marginBottom: '1.5rem'
    },
    categoryTitle: {
      fontSize: '0.95rem',
      fontWeight: '700',
      marginBottom: '1rem',
      paddingBottom: '0.5rem',
      borderBottom: '2px solid',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    highRevenueTitle: {
      color: '#28a745',
      borderColor: '#28a745'
    },
    mediumRevenueTitle: {
      color: '#ffc107',
      borderColor: '#ffc107'
    },
    lowRevenueTitle: {
      color: '#17a2b8',
      borderColor: '#17a2b8'
    },
    noRevenueTitle: {
      color: '#6c757d',
      borderColor: '#6c757d'
    },
    productCard: {
      background: '#ffffff',
      borderRadius: '10px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      border: '1px solid #e9ecef',
      padding: '1rem',
      height: '100%',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease'
    },
    productImage: {
      width: '60px',
      height: '60px',
      objectFit: 'cover',
      borderRadius: '6px',
      flexShrink: 0
    },
    productName: {
      fontSize: '0.95rem',
      fontWeight: '600',
      color: '#333',
      marginBottom: '0.25rem'
    },
    brandName: {
      fontSize: '0.8rem',
      color: '#666',
      marginBottom: '0.5rem'
    },
    revenueBadge: {
      padding: '0.35rem 0.75rem',
      borderRadius: '20px',
      fontSize: '0.8rem',
      fontWeight: '600'
    },
    soldCount: {
      fontSize: '0.75rem',
      color: '#888'
    },
    emptyMessage: {
      textAlign: 'center',
      padding: '2rem',
      color: '#888'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '1rem'
    }
  };

  const renderProductCard = (product, badgeColor, badgeBg) => (
    <div key={product._id} style={styles.productCard}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        {product.images && product.images.length > 0 && (
          <img
            src={product.images[0].url || product.images[0]}
            alt={product.name}
            style={styles.productImage}
            onError={(e) => {
              e.target.src = '/images/default-product.jpg';
            }}
          />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h6 style={styles.productName}>{product.name}</h6>
          <p style={styles.brandName}>{product.brandName || 'Unknown Brand'}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ ...styles.revenueBadge, background: badgeBg, color: badgeColor === '#ffc107' ? '#333' : '#fff' }}>
              ${product.revenue?.toFixed(2) || '0.00'}
            </span>
            <span style={styles.soldCount}>
              {product.soldQuantity || 0} sold
            </span>
          </div>
          {product.campaignTitle && (
            <small style={{ color: '#888', fontSize: '0.75rem', display: 'block', marginTop: '0.5rem' }}>
              Campaign: {product.campaignTitle}
            </small>
          )}
        </div>
      </div>
    </div>
  );

  if (!hasProducts) {
    return (
      <div style={styles.section}>
        <div style={styles.card}>
          <div style={styles.header}>
            <h5 style={styles.headerTitle}>
              <i className="fas fa-shopping-bag"></i>
              Products Promoted
            </h5>
          </div>
          <div style={styles.body}>
            <p style={styles.emptyMessage}>No products promoted yet.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.section}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h5 style={styles.headerTitle}>
            <i className="fas fa-shopping-bag"></i>
            Products Promoted (By Revenue)
          </h5>
        </div>
        <div style={styles.body}>
          <p style={styles.description}>Products you've promoted, organized by revenue generated.</p>
          
          {/* High Revenue Products */}
          {high.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h6 style={{ ...styles.categoryTitle, ...styles.highRevenueTitle }}>
                <i className="fas fa-arrow-up"></i>
                High Revenue (&gt; $1000) ({high.length})
              </h6>
              <div style={styles.grid}>
                {high.map(product => renderProductCard(product, '#ffffff', '#28a745'))}
              </div>
            </div>
          )}

          {/* Medium Revenue Products */}
          {medium.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h6 style={{ ...styles.categoryTitle, ...styles.mediumRevenueTitle }}>
                <i className="fas fa-minus"></i>
                Medium Revenue ($100 - $1000) ({medium.length})
              </h6>
              <div style={styles.grid}>
                {medium.map(product => renderProductCard(product, '#333333', '#ffc107'))}
              </div>
            </div>
          )}

          {/* Low Revenue Products */}
          {low.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h6 style={{ ...styles.categoryTitle, ...styles.lowRevenueTitle }}>
                <i className="fas fa-arrow-down"></i>
                Low Revenue ($1 - $100) ({low.length})
              </h6>
              <div style={styles.grid}>
                {low.map(product => renderProductCard(product, '#ffffff', '#17a2b8'))}
              </div>
            </div>
          )}

          {/* No Revenue Products */}
          {noRevenue.length > 0 && (
            <div style={{ marginBottom: '0' }}>
              <h6 style={{ ...styles.categoryTitle, ...styles.noRevenueTitle }}>
                <i className="fas fa-minus-circle"></i>
                No Revenue Yet ({noRevenue.length})
              </h6>
              <div style={styles.grid}>
                {noRevenue.map(product => renderProductCard(product, '#ffffff', '#6c757d'))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsByRevenueSection;
