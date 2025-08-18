// Netlify Functions endpoint
// In production, this will be automatically set by Netlify
// In development, you can override with REACT_APP_NETLIFY_FUNCTIONS_URL
const NETLIFY_FUNCTIONS_URL = process.env.REACT_APP_NETLIFY_FUNCTIONS_URL || '/.netlify/functions/google-sheets';

// Helper function to call Netlify Functions
const callNetlifyFunction = async (action, params = {}) => {
  console.log('🌐 Calling Netlify Function:', action);
  console.log('📋 Parameters:', params);

  try {
    const response = await fetch(NETLIFY_FUNCTIONS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        ...params
      })
    });

    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ HTTP error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Netlify Function call successful:', data);

    if (!data.success) {
      throw new Error(data.error || 'Unknown error from Netlify Function');
    }

    return data.data;
  } catch (error) {
    console.error('💥 Netlify Function error:', error);
    console.error('💥 Error details:', {
      message: error.message,
      stack: error.stack,
      action,
      params
    });
    throw error;
  }
};



// Check if user email exists in users sheet
export const checkUserEmail = async (email) => {
  console.log('🔍 Checking if user email exists:', email);
  
  try {
    const result = await callNetlifyFunction('checkUserEmail', { email });
    console.log('✅ User email check result:', result);
    return result.exists;
  } catch (error) {
    console.error('❌ Error checking user email:', error);
    throw error;
  }
};

// Send OTP to user
export const sendOTP = async (email) => {
  console.log('📧 Sending OTP to:', email);
  
  try {
    const result = await callNetlifyFunction('sendOTP', { email });
    console.log('✅ OTP sent result:', result);
    return result;
  } catch (error) {
    console.error('❌ Error sending OTP:', error);
    throw error;
  }
};

// Verify OTP
export const verifyOTP = async (email, otp) => {
  console.log('🔍 Verifying OTP for:', email);
  
  try {
    const result = await callNetlifyFunction('verifyOTP', { email, otp });
    console.log('✅ OTP verification result:', result);
    return result; // Return the full result object, not just result.valid
  } catch (error) {
    console.error('❌ Error verifying OTP:', error);
    throw error;
  }
};

// Fetch borrower data for a specific user
export const fetchBorrowerData = async (userEmail) => {
  console.log('📊 Fetching borrower data for:', userEmail);
  
  try {
    const result = await callNetlifyFunction('fetchBorrowerData', { userEmail });
    console.log('✅ Borrower data fetched:', result);
    return result;
  } catch (error) {
    console.error('❌ Error fetching borrower data:', error);
    throw error;
  }
};

// Fetch Freddie Mac rates
export const fetchFreddieMacRates = async () => {
  console.log('📈 Fetching Freddie Mac rates');
  
  try {
    const result = await callNetlifyFunction('fetchFreddieMacRates');
    console.log('✅ Freddie Mac rates fetched:', result);
    return result;
  } catch (error) {
    console.error('❌ Error fetching Freddie Mac rates:', error);
    throw error;
  }
};

// Add new borrower data
export const addBorrowerData = async (borrowerData) => {
  console.log('➕ Adding new borrower data:', borrowerData);
  
  try {
    const result = await callNetlifyFunction('addBorrowerData', { borrowerData });
    console.log('✅ Borrower data added:', result);
    return result;
  } catch (error) {
    console.error('❌ Error adding borrower data:', error);
    throw error;
  }
};

// Update existing borrower data
export const updateBorrowerData = async (borrowerId, borrowerData) => {
  console.log('✏️ Updating borrower data:', { borrowerId, borrowerData });
  
  try {
    const result = await callNetlifyFunction('updateBorrowerData', { 
      borrowerId, 
      borrowerData 
    });
    console.log('✅ Borrower data updated:', result);
    return result;
  } catch (error) {
    console.error('❌ Error updating borrower data:', error);
    throw error;
  }
};

// Delete borrower data
export const deleteBorrowerData = async (borrowerId) => {
  console.log('🗑️ Deleting borrower data:', borrowerId);
  
  try {
    const result = await callNetlifyFunction('deleteBorrowerData', { borrowerId });
    console.log('✅ Borrower data deleted:', result);
    return result;
  } catch (error) {
    console.error('❌ Error deleting borrower data:', error);
    throw error;
  }
};

// Get best Freddie Mac rate (helper function)
export const getBestFreddieMacRate = (freddieMacRates) => {
  console.log('🏆 Getting best Freddie Mac rate from:', freddieMacRates);
  
  if (!freddieMacRates || freddieMacRates.length === 0) {
    console.log('⚠️ No Freddie Mac rates available, using default');
    return { "30-Year Fixed Rate": "6.00%", "Date": "N/A" };
  }

  // For now, return the first rate as per current data structure
  const bestRate = freddieMacRates[0];
  console.log('✅ Best rate selected:', bestRate);
  return bestRate;
};
