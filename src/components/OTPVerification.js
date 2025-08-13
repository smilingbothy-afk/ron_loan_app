import React, { useState, useEffect, useRef } from 'react';
import { sendOTP, verifyOTP } from '../services/googleSheetsService';

const OTPVerification = ({ email, onOTPVerified }) => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [canResend, setCanResend] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef([]);

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

  const sendOTPToUser = async () => {
    try {
      setIsSendingOTP(true);
      setError('');
      
      await sendOTP(email);
      setSuccess('OTP sent to your email!');
      setCanResend(false);
      setCountdown(60); // 60 second cooldown
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
      console.error('OTP send error:', err);
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleOTPChange = (index, value) => {
    if (value.length <= 1) {
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
      
      const isValid = await verifyOTP(email, otpString);
      
      if (isValid) {
        setSuccess('OTP verified successfully!');
        setTimeout(() => {
          onOTPVerified();
        }, 1000);
      } else {
        setError('Invalid OTP. Please try again.');
        setOtp(['', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError('Error verifying OTP. Please try again.');
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
        <p>We've sent a 4-digit OTP to {email}</p>
        
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
            />
          ))}
        </div>
        
        <button 
          className="btn" 
          onClick={handleSubmit}
          disabled={isLoading || otp.join('').length !== 4}
        >
          {isLoading ? 'Verifying...' : 'Verify OTP'}
        </button>
        
        <div className="resend-otp" onClick={handleResendOTP}>
          {canResend ? (
            'Resend OTP'
          ) : (
            `Resend OTP in ${countdown}s`
          )}
        </div>
        
        {isSendingOTP && (
          <div className="loading">Sending OTP...</div>
        )}
      </div>
    </div>
  );
};

export default OTPVerification;
