import React, { useState, useEffect, useCallback } from 'react';
import { fetchBorrowerData, fetchFreddieMacRates, deleteBorrowerData } from '../services/googleSheetsService';
import AddBorrowerForm from './AddBorrowerForm';
import EditBorrowerForm from './EditBorrowerForm';

const Dashboard = ({ email }) => {
  const [borrowerData, setBorrowerData] = useState([]);
  const [freddieMacRates, setFreddieMacRates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedBorrower, setSelectedBorrower] = useState(null);
  const [success, setSuccess] = useState('');

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');

      const [borrowerResult, ratesResult] = await Promise.all([
        fetchBorrowerData(email),
        fetchFreddieMacRates()
      ]);

      // No need to add row index anymore - unique ID is already in the data
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

  const handleBorrowerUpdated = () => {
    setShowEditForm(false);
    setSelectedBorrower(null);
    loadData(); // Refresh data
  };

  const handleEditBorrower = (borrower) => {
    setSelectedBorrower(borrower);
    setShowEditForm(true);
  };

  const handleDeleteBorrower = async (borrower) => {
    if (!window.confirm(`Are you sure you want to delete ${borrower['Borrower Name'] || borrower['Borrower Last Name']}? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsLoading(true);
      // Use the unique ID from the borrower data, or fallback to borrower name
      const uniqueId = borrower['Unique ID'] || borrower['Borrower Last Name'];
      await deleteBorrowerData(uniqueId);
      setSuccess('Borrower deleted successfully!');
      loadData(); // Refresh data
    } catch (err) {
      console.error('Error deleting borrower:', err);
      setError('Failed to delete borrower. Please try again.');
    } finally {
      setIsLoading(false);
    }
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

  // Clear success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

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
      {success && <div className="success">{success}</div>}
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {borrowerData.map((borrower, index) => (
                <tr key={borrower['Unique ID'] || borrower['ID'] || borrower[0] || index}>
                  <td>{borrower['Borrower Name'] || borrower['Borrower Last Name'] || ''}</td>
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
                  <td className="actions-column">
                    <button 
                      className="icon-btn edit-btn" 
                      onClick={() => handleEditBorrower(borrower)}
                      title="Edit Borrower"
                    >
                      ✏️
                    </button>
                    <button 
                      className="icon-btn delete-btn" 
                      onClick={() => handleDeleteBorrower(borrower)}
                      title="Delete Borrower"
                    >
                      🗑️
                    </button>
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

      {/* Modal for Edit Borrower Form */}
      {showEditForm && selectedBorrower && (
        <EditBorrowerForm
          borrower={selectedBorrower}
          userEmail={email}
          onBorrowerUpdated={handleBorrowerUpdated}
          onCancel={() => setShowEditForm(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
