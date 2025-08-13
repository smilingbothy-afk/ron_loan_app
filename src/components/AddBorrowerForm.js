import React, { useState, useEffect } from 'react';

const AddBorrowerForm = ({ onSubmit, isLoading, userEmail, freddieMacRates }) => {
  const [formData, setFormData] = useState({
    borrowerLastName: '',
    currentLoanAmount: '',
    currentInterestRate: '',
    desiredMonthlySavings: '',
    currentPayment: ''
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.borrowerLastName.trim()) {
      newErrors.borrowerLastName = 'Borrower last name is required';
    }
    
    if (!formData.currentLoanAmount || parseFloat(formData.currentLoanAmount) <= 0) {
      newErrors.currentLoanAmount = 'Valid loan amount is required';
    }
    
    if (!formData.currentInterestRate || parseFloat(formData.currentInterestRate) <= 0) {
      newErrors.currentInterestRate = 'Valid interest rate is required';
    }
    
    if (!formData.desiredMonthlySavings || parseFloat(formData.desiredMonthlySavings) < 0) {
      newErrors.desiredMonthlySavings = 'Valid monthly savings amount is required';
    }
    
    if (!formData.currentPayment || parseFloat(formData.currentPayment) <= 0) {
      newErrors.currentPayment = 'Valid current payment is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Get the best Freddie Mac rate
    const bestRate = freddieMacRates.length > 0 ? freddieMacRates[0] : { "30-Year Fixed Rate": "6.00%", "Date": "N/A" };
    
    // Calculate derived fields
    const currentMonthlyRate = parseFloat(formData.currentInterestRate) / 100 / 12;
    const freddieMacRate = bestRate["30-Year Fixed Rate"];
    
    // Convert Freddie Mac rate from percentage to decimal for calculations
    const freddieMacRateDecimal = parseFloat(freddieMacRate.replace('%', '')) / 100;
    const freddieMacMonthlyRate = freddieMacRateDecimal / 12;
    
    // Calculate estimated new payment (simplified calculation)
    const loanAmount = parseFloat(formData.currentLoanAmount);
    const currentPayment = parseFloat(formData.currentPayment);
    
    // Simple estimation - in real app, you'd use proper mortgage calculation
    const estimatedNewPayment = currentPayment * (freddieMacMonthlyRate / currentMonthlyRate);
    const estimatedSavings = currentPayment - estimatedNewPayment;
    
    // Determine if refinance opportunity exists
    const refiOpportunity = estimatedSavings >= parseFloat(formData.desiredMonthlySavings);
    
    const newBorrower = {
      "Borrower Last Name": formData.borrowerLastName,
      "Current Loan Amount": parseFloat(formData.currentLoanAmount),
      "Current Interest Rate": parseFloat(formData.currentInterestRate),
      "Current Monthly Rate": currentMonthlyRate,
      "Desired Monthly Savings": parseFloat(formData.desiredMonthlySavings),
      "User Email": userEmail,
      "Current Payment": currentPayment,
      "Freddie Mac Rate": freddieMacRate,
      "Freddie Mac Monthly Rate": freddieMacMonthlyRate,
      "Estimated New Payment": Math.round(estimatedNewPayment),
      "Estimated Savings": Math.round(estimatedSavings),
      "Refi Opportunity": refiOpportunity ? 'TRUE' : 'FALSE'
    };
    
    onSubmit(newBorrower);
  };

  const resetForm = () => {
    setFormData({
      borrowerLastName: '',
      currentLoanAmount: '',
      currentInterestRate: '',
      desiredMonthlySavings: '',
      currentPayment: ''
    });
    setErrors({});
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="input-group">
        <label htmlFor="borrowerLastName">Borrower Last Name *</label>
        <input
          type="text"
          id="borrowerLastName"
          name="borrowerLastName"
          value={formData.borrowerLastName}
          onChange={handleInputChange}
          placeholder="Enter borrower's last name"
        />
        {errors.borrowerLastName && (
          <div className="error" style={{ fontSize: '14px', marginTop: '5px' }}>
            {errors.borrowerLastName}
          </div>
        )}
      </div>
      
      <div className="input-group">
        <label htmlFor="currentLoanAmount">Current Loan Amount *</label>
        <input
          type="number"
          id="currentLoanAmount"
          name="currentLoanAmount"
          value={formData.currentLoanAmount}
          onChange={handleInputChange}
          placeholder="Enter current loan amount"
          min="0"
          step="1000"
        />
        {errors.currentLoanAmount && (
          <div className="error" style={{ fontSize: '14px', marginTop: '5px' }}>
            {errors.currentLoanAmount}
          </div>
        )}
      </div>
      
      <div className="input-group">
        <label htmlFor="currentInterestRate">Current Interest Rate (%) *</label>
        <input
          type="number"
          id="currentInterestRate"
          name="currentInterestRate"
          value={formData.currentInterestRate}
          onChange={handleInputChange}
          placeholder="Enter current interest rate"
          min="0"
          max="20"
          step="0.01"
        />
        {errors.currentInterestRate && (
          <div className="error" style={{ fontSize: '14px', marginTop: '5px' }}>
            {errors.currentInterestRate}
          </div>
        )}
      </div>
      
      <div className="input-group">
        <label htmlFor="desiredMonthlySavings">Desired Monthly Savings *</label>
        <input
          type="number"
          id="desiredMonthlySavings"
          name="desiredMonthlySavings"
          value={formData.desiredMonthlySavings}
          onChange={handleInputChange}
          placeholder="Enter desired monthly savings"
          min="0"
          step="10"
        />
        {errors.desiredMonthlySavings && (
          <div className="error" style={{ fontSize: '14px', marginTop: '5px' }}>
            {errors.desiredMonthlySavings}
          </div>
        )}
      </div>
      
      <div className="input-group">
        <label htmlFor="currentPayment">Current Monthly Payment *</label>
        <input
          type="number"
          id="currentPayment"
          name="currentPayment"
          value={formData.currentPayment}
          onChange={handleInputChange}
          placeholder="Enter current monthly payment"
          min="0"
          step="10"
        />
        {errors.currentPayment && (
          <div className="error" style={{ fontSize: '14px', marginTop: '5px' }}>
            {errors.currentPayment}
          </div>
        )}
      </div>
      
      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button 
          type="submit" 
          className="btn" 
          disabled={isLoading}
        >
          {isLoading ? 'Adding...' : 'Add Borrower'}
        </button>
        
        <button 
          type="button" 
          className="btn" 
          onClick={resetForm}
          style={{ 
            background: '#6c757d',
            opacity: isLoading ? 0.6 : 1
          }}
          disabled={isLoading}
        >
          Reset
        </button>
      </div>
    </form>
  );
};

export default AddBorrowerForm;
