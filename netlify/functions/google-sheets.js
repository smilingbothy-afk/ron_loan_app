const { google } = require('googleapis');

// Service account credentials - these will be environment variables
const serviceAccountCredentials = {
  type: process.env.GOOGLE_SERVICE_ACCOUNT_TYPE,
  project_id: process.env.GOOGLE_SERVICE_ACCOUNT_PROJECT_ID,
  private_key_id: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_ID,
  private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL,
  client_id: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_ID,
  auth_uri: process.env.GOOGLE_SERVICE_ACCOUNT_AUTH_URI,
  token_uri: process.env.GOOGLE_SERVICE_ACCOUNT_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.GOOGLE_SERVICE_ACCOUNT_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_X509_CERT_URL
};

// Initialize Google Sheets API
const getGoogleSheets = () => {
  const auth = new google.auth.GoogleAuth({
    credentials: serviceAccountCredentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
  
  return google.sheets({ version: 'v4', auth });
};

// Helper function to handle CORS
const handleCORS = (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  return headers;
};

exports.handler = async (event, context) => {
  console.log('🚀 Netlify Function called:', event.path);
  console.log('📋 Request method:', event.httpMethod);
  console.log('📝 Request body:', event.body);

  try {
    // Handle CORS
    const corsHeaders = handleCORS(event);
    
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: ''
      };
    }

    // Parse request body
    const requestBody = event.body ? JSON.parse(event.body) : {};
    const { action, ...params } = requestBody;

    console.log('🎯 Action requested:', action);
    console.log('📊 Parameters:', params);

    if (!action) {
      throw new Error('Action is required');
    }

    const sheets = getGoogleSheets();
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!spreadsheetId) {
      throw new Error('Spreadsheet ID not configured');
    }

    let result;

    switch (action) {
      case 'checkUserEmail':
        result = await checkUserEmail(sheets, spreadsheetId, params.email);
        break;
      
      case 'sendOTP':
        result = await sendOTP(params.email);
        break;
      
      case 'verifyOTP':
        result = await verifyOTP(params.email, params.otp);
        break;
      
      case 'fetchBorrowerData':
        result = await fetchBorrowerData(sheets, spreadsheetId, params.userEmail);
        break;
      
      case 'fetchFreddieMacRates':
        result = await fetchFreddieMacRates(sheets, spreadsheetId);
        break;
      
      case 'addBorrowerData':
        result = await addBorrowerData(sheets, spreadsheetId, params.borrowerData);
        break;
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log('✅ Operation successful:', action);
    
    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        data: result
      })
    };

  } catch (error) {
    console.error('💥 Error in Netlify Function:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...handleCORS(event),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};

// Check if user email exists in Users sheet
async function checkUserEmail(sheets, spreadsheetId, email) {
  console.log('🔍 Checking user email:', email);
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Users!A:B'
  });

  const values = response.data.values || [];
  
  if (values.length === 0) {
    console.log('📋 No users found');
    return { exists: false };
  }

  // Skip header row and check if email exists in column B
  const dataRows = values.slice(1);
  const userExists = dataRows.some(row => row[1] === email); // Email is in column B (index 1)
  
  console.log('📋 Total users found:', dataRows.length);
  console.log('👤 User exists:', userExists);
  return { exists: userExists };
}

// Send OTP (simulated for now)
async function sendOTP(email) {
  console.log('📧 Sending OTP to:', email);
  
  // In a real app, you'd integrate with an email service
  // For now, we'll simulate OTP generation
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  
  console.log('🔐 Generated OTP:', otp);
  return { otp, message: 'OTP sent successfully' };
}

// Verify OTP (simulated for now)
async function verifyOTP(email, otp) {
  console.log('🔍 Verifying OTP for:', email);
  console.log('🔐 OTP received:', otp);
  
  // In a real app, you'd verify against stored OTP
  // For now, we'll accept any 4-digit OTP
  const isValid = /^\d{4}$/.test(otp);
  
  console.log('✅ OTP valid:', isValid);
  return { valid: isValid };
}

// Fetch borrower data for a specific user
async function fetchBorrowerData(sheets, spreadsheetId, userEmail) {
  console.log('📊 Fetching borrower data for:', userEmail);
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Borrower_Data!A:L'
  });

  const values = response.data.values || [];
  
  if (values.length === 0) {
    console.log('📋 No data found');
    return [];
  }

  const headers = values[0];
  const dataRows = values.slice(1);
  
  console.log('📋 Headers:', headers);
  console.log('📊 Total rows:', dataRows.length);

  // Filter data for the specific user
  const userData = dataRows
    .filter(row => row[5] === userEmail) // User Email is at index 5
    .map(row => {
      const borrower = {};
      headers.forEach((header, index) => {
        borrower[header] = row[index] || '';
      });
      return borrower;
    });

  console.log('👤 Rows for user:', userData.length);
  console.log('✅ Borrower data processed:', userData);
  
  return userData;
}

// Fetch Freddie Mac rates
async function fetchFreddieMacRates(sheets, spreadsheetId) {
  console.log('📈 Fetching Freddie Mac rates');
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Freddie_Mac_Rate!A:C'
  });

  const values = response.data.values || [];
  
  if (values.length === 0) {
    console.log('📋 No Freddie Mac rates found');
    return [];
  }

  const headers = values[0];
  const dataRows = values.slice(1);
  
  console.log('📋 Headers:', headers);
  console.log('📊 Total rows:', dataRows.length);

  const rates = dataRows.map(row => {
    const rate = {};
    headers.forEach((header, index) => {
      rate[header] = row[index] || '';
    });
    return rate;
  });

  console.log('✅ Freddie Mac rates processed:', rates);
  return rates;
}

// Add new borrower data
async function addBorrowerData(sheets, spreadsheetId, borrowerData) {
  console.log('➕ Adding new borrower data:', borrowerData);
  
  // Prepare values array in the correct order
  const values = [
    borrowerData['Borrower Last Name'] || '',
    borrowerData['Current Loan Amount'] || '',
    borrowerData['Current Interest Rate'] || '',
    borrowerData['Current Monthly Rate'] || '',
    borrowerData['Desired Monthly Savings'] || '',
    borrowerData['User Email'] || '',
    borrowerData['Current Payment'] || '',
    borrowerData['Freddie Mac Rate'] || '',
    borrowerData['Freddie Mac Monthly Rate'] || '',
    borrowerData['Estimated New Payment'] || '',
    borrowerData['Estimated Savings'] || '',
    borrowerData['Refi Opportunity'] || ''
  ];

  console.log('📊 Values to add:', values);

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Borrower_Data!A:L',
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    resource: {
      values: [values]
    }
  });

  console.log('✅ Borrower data added successfully');
  return { success: true, message: 'Borrower data added successfully' };
}
