import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sendOTP, verifyOTP } from '../services/googleSheetsService';

const OTPVerification = ({ email, onOTPVerified }) => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const inputRefs = useRef([]);

  const sendOTPToUser = useCallback(async () => {
    if (!canResend) return;

    setIsSendingOTP(true);
    setError('');
    setSuccess('');

    try {
      const result = await sendOTP(email);
      setSuccess(`✅ OTP sent successfully! Check your email for the code.`);
      setCountdown(60); // 1 minute countdown
      setCanResend(false);
      setAttempts(0);
      setOtp(['', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (error) {
      setError(`Failed to send OTP: ${error.message}`);
    } finally {
      setIsSendingOTP(false);
    }
  }, [email, canResend]);

  useEffect(() => {
    // Send OTP automatically when component mounts
    sendOTPToUser();
  }, [sendOTPToUser]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleOTPChange = (index, value) => {
    if (value.length > 1) return; // Prevent multiple characters
    
    const newOTP = [...otp];
    newOTP[index] = value;
    setOtp(newOTP);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async () => {
    const otpString = otp.join('');
    
    if (otpString.length !== 4) {
      setError('Please enter the complete 4-digit OTP');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      const response = await verifyOTP(email, otpString);
      
      if (response.valid) {
        setSuccess('🎉 OTP verified successfully! Redirecting to dashboard...');
        setTimeout(() => {
          onOTPVerified();
        }, 1500);
      } else {
        setAttempts(prev => prev + 1);
        setError(response.message || 'Invalid OTP. Please try again.');
        setOtp(['', '', '', '']);
        inputRefs.current[0]?.focus();
        
        // Lock out after 5 failed attempts
        if (attempts >= 4) {
          setError('🚫 Too many failed attempts. Please request a new OTP.');
          setCanResend(false);
          setCountdown(300); // 5 minute lockout
        }
      }
    } catch (err) {
      setError(`Error verifying OTP: ${err.message}`);
      console.error('OTP verification error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = () => {
    if (canResend) {
      sendOTPToUser();
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>🔐 Verify Your Identity</h2>
        <p>We've sent a 4-digit OTP to <strong>{email}</strong></p>
        
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}
        
        <div className="otp-input">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              maxLength="1"
              value={digit}
              onChange={(e) => handleOTPChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              placeholder="0"
              disabled={isLoading}
              style={{
                opacity: isLoading ? 0.6 : 1,
                cursor: isLoading ? 'not-allowed' : 'text'
              }}
            />
          ))}
        </div>
        
        <button 
          className="btn" 
          onClick={handleSubmit}
          disabled={isLoading || otp.join('').length !== 4}
        >
          {isLoading ? (
            <>
              <span className="loading-spinner"></span>
              Verifying...
            </>
          ) : (
            'Verify OTP'
          )}
        </button>
        
        <div className="resend-otp" onClick={handleResendOTP}>
          {canResend ? (
            '🔄 Resend OTP'
          ) : (
            `⏰ Resend OTP in ${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, '0')}`
          )}
        </div>
        
        {isSendingOTP && (
          <div className="loading">
            <span className="loading-spinner"></span>
            Sending OTP...
          </div>
        )}
      
      </div>
    </div>
  );
};

export default OTPVerification;
