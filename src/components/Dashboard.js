import React, { useState, useEffect } from 'react';
import { fetchBorrowerData, addBorrowerData, fetchFreddieMacRates } from '../services/googleSheetsService';
import AddBorrowerForm from './AddBorrowerForm';

const Dashboard = ({ email }) => {
  const [borrowerData, setBorrowerData] = useState([]);
  const [freddieMacRates, setFreddieMacRates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isAddingData, setIsAddingData] = useState(false);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const [borrowers, rates] = await Promise.all([
        fetchBorrowerData(email),
        fetchFreddieMacRates()
      ]);
      
      setBorrowerData(borrowers);
      setFreddieMacRates(rates);
    } catch (err) {
      setError('Error loading data. Please try again.');
      console.error('Data loading error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBorrower = async (newBorrower) => {
    try {
      setIsAddingData(true);
      setError('');
      
      await addBorrowerData(newBorrower);
      
      // Reload data to show the new entry
      await loadData();
      
      setShowAddForm(false);
      setError('');
    } catch (err) {
      setError('Error adding borrower data. Please try again.');
      console.error('Add borrower error:', err);
    } finally {
      setIsAddingData(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    
    // Remove commas and convert to number
    const cleanAmount = typeof amount === 'string' ? amount.replace(/,/g, '') : amount;
    const numAmount = parseFloat(cleanAmount);
    
    if (isNaN(numAmount)) return 'N/A';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numAmount);
  };

  const formatPercentage = (rate) => {
    if (!rate) return 'N/A';
    
    // If it's already a percentage string, return as is
    if (typeof rate === 'string' && rate.includes('%')) {
      return rate;
    }
    
    // Convert decimal to percentage
    const numRate = parseFloat(rate);
    if (isNaN(numRate)) return 'N/A';
    
    return `${(numRate * 100).toFixed(2)}%`;
  };

  if (isLoading) {
    return (
      <div className="container">
        <div className="card">
          <h1>Dashboard</h1>
          <div className="loading">Loading your data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <h1>Welcome, {email}</h1>
        <p>Your mortgage refinance opportunities and data</p>
        
        {error && <div className="error">{error}</div>}
        
        <div style={{ marginBottom: '20px' }}>
          <button 
            className="btn" 
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'Cancel' : 'Add New Borrower'}
          </button>
        </div>
        
        {showAddForm && (
          <div className="card">
            <h2>Add New Borrower</h2>
            <AddBorrowerForm 
              onSubmit={handleAddBorrower}
              isLoading={isAddingData}
              userEmail={email}
              freddieMacRates={freddieMacRates}
            />
          </div>
        )}
        
        <div className="card">
          <h2>Your Borrower Data</h2>
          {borrowerData.length === 0 ? (
            <p>No borrower data found. Add your first borrower above.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Borrower Last Name</th>
                    <th>Current Loan Amount</th>
                    <th>Current Interest Rate</th>
                    <th>Current Monthly Rate</th>
                    <th>Desired Monthly Savings</th>
                    <th>Current Payment</th>
                    <th>Freddie Mac Rate</th>
                    <th>Freddie Mac Monthly Rate</th>
                    <th>Estimated New Payment</th>
                    <th>Estimated Savings</th>
                    <th>Refi Opportunity</th>
                  </tr>
                </thead>
                <tbody>
                  {borrowerData.map((borrower, index) => (
                    <tr key={index}>
                      <td>{borrower["Borrower Last Name"]}</td>
                      <td>{formatCurrency(borrower["Current Loan Amount"])}</td>
                      <td>{formatPercentage(borrower["Current Interest Rate"])}</td>
                      <td>{formatPercentage(borrower["Current Monthly Rate"])}</td>
                      <td>{formatCurrency(borrower["Desired Monthly Savings"])}</td>
                      <td>{formatCurrency(borrower["Current Payment"])}</td>
                      <td>{formatPercentage(borrower["Freddie Mac Rate"])}</td>
                      <td>{formatPercentage(borrower["Freddie Mac Monthly Rate"])}</td>
                      <td>{formatCurrency(borrower["Estimated New Payment"])}</td>
                      <td>{formatCurrency(borrower["Estimated Savings"])}</td>
                      <td>
                        <span style={{ 
                          color: borrower["Refi Opportunity"] === 'TRUE' ? '#28a745' : '#dc3545',
                          fontWeight: 'bold'
                        }}>
                          {borrower["Refi Opportunity"] === 'TRUE' ? 'YES' : 'NO'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="card">
          <h2>Current Freddie Mac Rates</h2>
          {freddieMacRates.length === 0 ? (
            <p>No Freddie Mac rates available.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>30-Year Fixed Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {freddieMacRates.map((rate, index) => (
                    <tr key={index}>
                      <td>{rate["Date"] || 'N/A'}</td>
                      <td>{formatPercentage(rate["30-Year Fixed Rate"])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
