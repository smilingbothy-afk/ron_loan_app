import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sendOTP, verifyOTP } from '../services/googleSheetsService';

const OTPVerification = ({ email, onOTPVerified }) => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [canResend, setCanResend] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const inputRefs = useRef([]);

  const sendOTPToUser = useCallback(async () => {
    try {
      setIsSendingOTP(true);
      setError('');
      setSuccess('');
      
      const response = await sendOTP(email);
      
      if (response.success) {
        setSuccess('OTP sent to your email! Check your inbox.');
        setCanResend(false);
        setCountdown(60); // 60 second cooldown
        setAttempts(0); // Reset attempts when new OTP is sent
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError('Failed to send OTP. Please try again.');
      }
    } catch (err) {
      setError(`Failed to send OTP: ${err.message}`);
      console.error('OTP send error:', err);
    } finally {
      setIsSendingOTP(false);
    }
  }, [email]);

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
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOTP = [...otp];
      newOTP[index] = value;
      setOtp(newOTP);

      // Auto-focus next input
      if (value && index < 3) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 4) {
      setError('Please enter a 4-digit OTP');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      const response = await verifyOTP(email, otpString);
      
      if (response.valid) {
        setSuccess('OTP verified successfully! Redirecting...');
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
          setError('Too many failed attempts. Please request a new OTP.');
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
        <h2>Verify Your Identity</h2>
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
          style={{
            opacity: (isLoading || otp.join('').length !== 4) ? 0.6 : 1,
            cursor: (isLoading || otp.join('').length !== 4) ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? 'Verifying...' : 'Verify OTP'}
        </button>
        
        <div className="resend-otp" onClick={handleResendOTP}>
          {canResend ? (
            'Resend OTP'
          ) : (
            `Resend OTP in ${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, '0')}`
          )}
        </div>
        
        {isSendingOTP && (
          <div className="loading">Sending OTP...</div>
        )}
        
        <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
          <p>📧 Check your email inbox (and spam folder)</p>
          <p>⏰ OTP expires in 10 minutes</p>
          <p>🔒 Maximum 5 attempts allowed</p>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
