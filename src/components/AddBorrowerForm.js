import React, { useState, useEffect } from 'react';
import { addBorrowerData, fetchFreddieMacRates } from '../services/googleSheetsService';

const AddBorrowerForm = ({ userEmail, onBorrowerAdded, onCancel }) => {
  const [formData, setFormData] = useState({
    borrowerName: '',
    currentLoanAmount: '',
    currentInterestRate: '',
    desiredMonthlySavings: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
        "Current Interest Rate": parseFloat(formData.currentInterestRate), // Store as raw percentage (e.g., 6.5 for 6.5%)
        "Desired Monthly Savings": parseFloat(formData.desiredMonthlySavings || 0),
        "User Email": userEmail
        // All other fields will be auto-calculated by Google Sheets
      };

      await addBorrowerData(borrowerData);
      
      setSuccess('Borrower added successfully!');
      setFormData({
        borrowerName: '',
        currentLoanAmount: '',
        currentInterestRate: '',
        desiredMonthlySavings: ''
      });
      
      // Close modal after 1.5 seconds
      setTimeout(() => {
        onBorrowerAdded();
      }, 1500);
      
    } catch (err) {
      console.error('Error adding borrower:', err);
      setError('Failed to add borrower. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>➕ Add New Borrower</h3>
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
                type="number"
                id="currentInterestRate"
                name="currentInterestRate"
                value={formData.currentInterestRate}
                onChange={handleInputChange}
                placeholder="Enter current interest rate"
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
              />
            </div>
          </div>

          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="loading-spinner"></span>
                  Adding Borrower...
                </>
              ) : (
                'Add Borrower'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBorrowerForm;
