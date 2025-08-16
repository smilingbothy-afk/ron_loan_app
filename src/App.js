import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import EmailVerification from './components/EmailVerification';
// import OTPVerification from './components/OTPVerification'; // OTP commented out
import Dashboard from './components/Dashboard';
import AccessDenied from './components/AccessDenied';
import { enforceThinkificAccess } from './utils/thinkificCheck';
import './App.css';

function App() {
  const [email, setEmail] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  // const [isOTPVerified, setIsOTPVerified] = useState(false); // OTP state commented out
  const [hasAccess, setHasAccess] = useState(true);

  // Check for Thinkific access and email in URL parameters on component mount
  useEffect(() => {
    // Check if we have access to the app
    const accessGranted = enforceThinkificAccess();
    setHasAccess(accessGranted);
    
    if (!accessGranted) {
      return; // Don't proceed with email check if access denied
    }

    const urlParams = new URLSearchParams(window.location.search);
    const emailFromUrl = urlParams.get('email');
    
    if (emailFromUrl) {
      console.log('📧 Email found in URL:', emailFromUrl);
      setEmail(emailFromUrl);
      setIsEmailVerified(true); // Skip email verification for loan officers
      
      // OTP verification is completely skipped now
      // setIsOTPVerified(true);
    }
  }, []);

  const handleEmailVerified = (verifiedEmail) => {
    setEmail(verifiedEmail);
    setIsEmailVerified(true);
    
    // OTP verification is completely skipped now
    // setIsOTPVerified(true);
  };

  // const handleOTPVerified = () => { // OTP handler commented out
  //   setIsOTPVerified(true);
  // };

  // If access is denied, show access denied screen
  if (!hasAccess) {
    return <AccessDenied />;
  }

  return (
    <div className="app-container">
      
      <Router>
        <Routes>
          <Route 
            path="/" 
            element={
              !isEmailVerified ? (
                <EmailVerification onEmailVerified={handleEmailVerified} />
              ) : (
                // OTP verification is completely commented out
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
