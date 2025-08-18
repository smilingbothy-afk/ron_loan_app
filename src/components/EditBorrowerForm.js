import React, { useState, useEffect } from 'react';
import { updateBorrowerData } from '../services/googleSheetsService';

const EditBorrowerForm = ({ borrower, userEmail, onBorrowerUpdated, onCancel }) => {
  const [formData, setFormData] = useState({
    borrowerName: '',
    currentLoanAmount: '',
    currentInterestRate: '',
    desiredMonthlySavings: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Initialize form data when borrower prop changes
  useEffect(() => {
    if (borrower) {
      setFormData({
        borrowerName: borrower['Borrower Name'] || borrower['Borrower Last Name'] || '',
        currentLoanAmount: borrower['Current Loan Amount'] || '',
        currentInterestRate: formatInterestRateForInput(borrower['Current Interest Rate'] || ''),
        desiredMonthlySavings: borrower['Desired Monthly Savings'] || ''
      });
    }
  }, [borrower]);

  // Helper function to format interest rate for input field (remove % and convert to number)
  const formatInterestRateForInput = (rate) => {
    if (!rate) return '';
    // Remove % symbol and convert to number
    const cleanRate = rate.toString().replace('%', '');
    return cleanRate;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.borrowerName || !formData.currentLoanAmount || !formData.currentInterestRate) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const borrowerData = {
        "Borrower Name": formData.borrowerName,
        "Current Loan Amount": formData.currentLoanAmount,
        "Current Interest Rate": parseFloat(formData.currentInterestRate.replace('%', '') || 0),
        "Desired Monthly Savings": parseFloat(formData.desiredMonthlySavings || 0),
        "User Email": userEmail
      };

      // Use the unique ID from the borrower data, or fallback to borrower name
      const uniqueId = borrower['Unique ID'] || borrower['ID'] || borrower[0] || borrower['Borrower Name'] || borrower['Borrower Last Name'];
      
      await updateBorrowerData(uniqueId, borrowerData);
      
      setSuccess('Borrower updated successfully!');
      
      // Close modal after 1.5 seconds
      setTimeout(() => {
        onBorrowerUpdated();
      }, 1500);
      
    } catch (err) {
      console.error('Error updating borrower:', err);
      setError('Failed to update borrower. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>✏️ Edit Borrower</h3>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="borrower-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="borrowerName">Borrower Name *</label>
              <input
                type="text"
                id="borrowerName"
                name="borrowerName"
                value={formData.borrowerName}
                onChange={handleInputChange}
                placeholder="Enter borrower name"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="currentLoanAmount">Current Loan Amount *</label>
              <input
                type="text"
                id="currentLoanAmount"
                name="currentLoanAmount"
                value={formData.currentLoanAmount}
                onChange={handleInputChange}
                placeholder="Enter current loan amount"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="currentInterestRate">Current Interest Rate (%) *</label>
              <input
                type="text"
                id="currentInterestRate"
                name="currentInterestRate"
                value={formData.currentInterestRate}
                onChange={handleInputChange}
                placeholder="Enter current interest rate (e.g., 6.50)"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="desiredMonthlySavings">Desired Monthly Savings</label>
              <input
                type="number"
                id="desiredMonthlySavings"
                name="desiredMonthlySavings"
                value={formData.desiredMonthlySavings}
                onChange={handleInputChange}
                placeholder="Enter desired monthly savings"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}

          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading-spinner"></span>
                  Updating...
                </>
              ) : (
                'Update Borrower'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBorrowerForm;
