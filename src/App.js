import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import EmailVerification from './components/EmailVerification';
import OTPVerification from './components/OTPVerification';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const [userEmail, setUserEmail] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  useEffect(() => {
    // Extract email from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    
    console.log('🔍 App mounted, checking URL parameters...');
    console.log('📧 Email from URL:', email);
    
    if (email) {
      setUserEmail(email);
      console.log('✅ Email set from URL:', email);
    } else {
      console.log('⚠️ No email parameter found in URL');
    }
  }, []);

  const handleEmailVerified = () => {
    console.log('✅ Email verified, proceeding to OTP verification');
    setIsEmailVerified(true);
  };

  const handleOTPVerified = () => {
    console.log('✅ OTP verified, proceeding to dashboard');
    setIsAuthenticated(true);
  };

  // Debug current state
  console.log('🔄 App State:', {
    userEmail,
    isEmailVerified,
    isAuthenticated
  });

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/" 
            element={
              !userEmail ? (
                <div className="container">
                  <div className="card">
                    <h1>Thinkific Alert App</h1>
                    <p>Please access this app with a valid email parameter in the URL.</p>
                    <p>Example: ?email=user@example.com</p>
                    <p>Current URL: {window.location.href}</p>
                  </div>
                </div>
              ) : !isEmailVerified ? (
                <EmailVerification 
                  email={userEmail} 
                  onEmailVerified={handleEmailVerified} 
                />
              ) : !isAuthenticated ? (
                <OTPVerification 
                  email={userEmail} 
                  onOTPVerified={handleOTPVerified} 
                />
              ) : (
                <Dashboard email={userEmail} />
              )
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
