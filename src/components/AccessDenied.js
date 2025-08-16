import React from 'react';

const AccessDenied = () => {
  return (
    <div className="access-denied-container">
      <div className="access-denied-card">
        <div className="access-denied-icon">🚫</div>
        <h2>Access Restricted</h2>
        <p>This application is only accessible through the Thinkific course platform.</p>
        <p>Please access this app through your Thinkific course dashboard.</p>
        <div className="access-denied-help">
          <p><strong>Need help?</strong></p>
          <p>Contact your course instructor or support team.</p>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
