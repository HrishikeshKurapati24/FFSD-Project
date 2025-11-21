import React from 'react';

const ResultsInfo = ({ brandCount, selectedCategory, searchQuery }) => (
  <div className="results-info">
    <p>
      Found {brandCount} brands
      {selectedCategory && selectedCategory !== 'all' && (
        <> in <strong>{selectedCategory}</strong></>
      )}
      {searchQuery && (
        <> matching "<strong>{searchQuery}</strong>"</>
      )}
    </p>
  </div>
);

export default ResultsInfo;


