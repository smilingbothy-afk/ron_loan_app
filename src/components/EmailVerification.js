import React, { useState, useCallback } from 'react';
import { checkUserEmail } from '../services/googleSheetsService';

const EmailVerification = ({ onEmailVerified }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const exists = await checkUserEmail(email);
      
      if (exists) {
        setSuccess('Email verified successfully!');
        // Wait a moment before proceeding to show success message
        setTimeout(() => {
          onEmailVerified(email);
        }, 1000);
      } else {
        setError('Email not found in our system. Please contact support.');
      }
    } catch (err) {
      console.error('Error verifying email:', err);
      setError('Failed to verify email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [email, onEmailVerified]);

  const handleInputChange = (e) => {
    setEmail(e.target.value);
    // Clear error when user starts typing
    if (error) setError('');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>🔐 Email Verification</h2>
        <p>Please enter your email address to access your loan portfolio</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={handleInputChange}
              placeholder="Enter your email address"
              required
              disabled={isLoading}
            />
          </div>

          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}

          <button 
            type="submit" 
            className="btn" 
            disabled={isLoading || !email.trim()}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                Verifying Email...
              </>
            ) : (
              'Verify Email'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EmailVerification;
