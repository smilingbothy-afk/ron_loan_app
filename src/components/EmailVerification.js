import React, { useState, useEffect } from 'react';
import { checkUserEmail } from '../services/googleSheetsService';

const EmailVerification = ({ email, onEmailVerified }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isValidUser, setIsValidUser] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    verifyUserEmail();
  }, [verifyUserEmail]);

  const verifyUserEmail = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const isValid = await checkUserEmail(email);
      
      if (isValid) {
        setIsValidUser(true);
        // Automatically proceed to OTP verification
        setTimeout(() => {
          onEmailVerified();
        }, 1000);
      } else {
        setError('Email not found in our system. Please contact support.');
      }
    } catch (err) {
      setError('Error verifying email. Please try again.');
      console.error('Email verification error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>Verifying Email</h2>
          <div className="loading">Checking if your email is registered...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>Access Denied</h2>
          <div className="error">{error}</div>
          <p>Please contact support if you believe this is an error.</p>
        </div>
      </div>
    );
  }

  if (isValidUser) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>Email Verified!</h2>
          <div className="success">
            Email {email} is verified. Redirecting to OTP verification...
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default EmailVerification;
