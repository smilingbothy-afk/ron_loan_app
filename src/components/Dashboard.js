import React, { useState, useEffect, useCallback } from 'react';
import { fetchBorrowerData, fetchFreddieMacRates } from '../services/googleSheetsService';
import AddBorrowerForm from './AddBorrowerForm';

const Dashboard = ({ email }) => {
  const [borrowerData, setBorrowerData] = useState([]);
  const [freddieMacRates, setFreddieMacRates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');

      const [borrowerResult, ratesResult] = await Promise.all([
        fetchBorrowerData(email),
        fetchFreddieMacRates()
      ]);

      setBorrowerData(borrowerResult);
      setFreddieMacRates(ratesResult);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [email]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleBorrowerAdded = () => {
    setShowAddForm(false);
    loadData(); // Refresh data
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0';
    const num = parseFloat(amount.toString().replace(/[$,]/g, ''));
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const formatPercentage = (rate) => {
    if (!rate) return '0%';
    const num = parseFloat(rate.toString().replace('%', ''));
    return `${num.toFixed(2)}%`;
  };

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="loading">
          <span className="loading-spinner"></span>
          Loading your loan insights...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error">{error}</div>
        <button className="btn" onClick={loadData}>
          🔄 Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Freddie Mac Rates */}
      <div className="data-section">
        <h3>📈 Current Market Rates</h3>
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>30-Year Fixed Rate</th>
              </tr>
            </thead>
            <tbody>
              {freddieMacRates.map((rate, index) => (
                <tr key={index}>
                  <td>{rate.Date}</td>
                  <td>{rate['30-Year Fixed Rate']}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Borrower Data */}
      <div className="data-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>🏠 Borrowers</h3>
          <button 
            className="btn" 
            onClick={() => setShowAddForm(true)}
            style={{ maxWidth: '200px', margin: 0 }}
          >
            📝 Add New Borrower
          </button>
        </div>
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Borrower</th>
                <th>Loan Amount</th>
                <th>Current Rate</th>
                <th>Current Payment</th>
                <th>Freddie Mac Rate</th>
                <th>Monthly Savings</th>
                <th>Refi Opportunity</th>
              </tr>
            </thead>
            <tbody>
              {borrowerData.map((borrower, index) => (
                <tr key={index}>
                  <td>{borrower['Borrower Last Name']}</td>
                  <td>{formatCurrency(borrower['Current Loan Amount'])}</td>
                  <td>{formatPercentage(borrower['Current Interest Rate'])}</td>
                  <td>{formatCurrency(borrower['Current Payment'])}</td>
                  <td>{formatPercentage(borrower['Freddie Mac Rate'])}</td>
                  <td style={{ 
                    color: parseFloat(borrower['Estimated Savings']?.replace(/[$,]/g, '') || 0) > 0 ? '#48bb78' : '#e53e3e',
                    fontWeight: '600'
                  }}>
                    {formatCurrency(borrower['Estimated Savings'])}
                  </td>
                  <td>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      backgroundColor: borrower['Refi Opportunity'] === 'TRUE' ? '#c6f6d5' : '#fed7d7',
                      color: borrower['Refi Opportunity'] === 'TRUE' ? '#2f855a' : '#c53030'
                    }}>
                      {borrower['Refi Opportunity'] === 'TRUE' ? '✅ Yes' : '❌ No'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Add Borrower Form */}
      {showAddForm && (
        <AddBorrowerForm 
          userEmail={email}
          onBorrowerAdded={handleBorrowerAdded}
          onCancel={() => setShowAddForm(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
