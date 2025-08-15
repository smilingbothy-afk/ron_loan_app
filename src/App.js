import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import EmailVerification from './components/EmailVerification';
import OTPVerification from './components/OTPVerification';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const [email, setEmail] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isOTPVerified, setIsOTPVerified] = useState(false);

  // Check for email in URL parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const emailFromUrl = urlParams.get('email');
    
    if (emailFromUrl) {
      console.log('📧 Email found in URL:', emailFromUrl);
      setEmail(emailFromUrl);
      setIsEmailVerified(true); // Skip email verification for loan officers
    }
  }, []);

  const handleEmailVerified = (verifiedEmail) => {
    setEmail(verifiedEmail);
    setIsEmailVerified(true);
  };

  const handleOTPVerified = () => {
    setIsOTPVerified(true);
  };

  return (
    <div className="app-container">
      
      <Router>
        <Routes>
          <Route 
            path="/" 
            element={
              !isEmailVerified ? (
                <EmailVerification onEmailVerified={handleEmailVerified} />
              ) : !isOTPVerified ? (
                <OTPVerification email={email} onOTPVerified={handleOTPVerified} />
              ) : (
                <Dashboard email={email} />
              )
            } 
          />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
