const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// NOTE: When RUN_ON_THINKIFIC environment variable is set, OTP functionality is disabled
// OTP functions are kept for development/testing purposes when running outside Thinkific

// Service account credentials - these will be environment variables
const serviceAccountCredentials = {
  type: process.env.GOOGLE_SERVICE_ACCOUNT_TYPE,
  project_id: process.env.GOOGLE_SERVICE_ACCOUNT_PROJECT_ID,
  private_key_id: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_ID,
  private_key: (() => {
    let key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
    if (!key) return undefined;
    
    // Remove quotes if present
    key = key.replace(/^"|"$/g, '');
    
    // Replace escaped newlines with actual newlines
    key = key.replace(/\\n/g, '\n');
    
    // Ensure the key starts and ends correctly
    if (!key.startsWith('-----BEGIN PRIVATE KEY-----')) {
      key = '-----BEGIN PRIVATE KEY-----\n' + key;
    }
    if (!key.endsWith('-----END PRIVATE KEY-----')) {
      key = key + '\n-----END PRIVATE KEY-----';
    }
    
    return key;
  })(),
  client_email: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL,
  client_id: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_ID,
  auth_uri: process.env.GOOGLE_SERVICE_ACCOUNT_AUTH_URI,
  token_uri: process.env.GOOGLE_SERVICE_ACCOUNT_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.GOOGLE_SERVICE_ACCOUNT_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_X509_CERT_URL
};

// Debug: Log credential structure (without sensitive data)
console.log('🔐 Service Account Credentials Structure:', {
  type: serviceAccountCredentials.type,
  project_id: serviceAccountCredentials.project_id,
  private_key_id: serviceAccountCredentials.private_key_id,
  private_key_length: serviceAccountCredentials.private_key?.length || 0,
  private_key_starts_with: serviceAccountCredentials.private_key?.substring(0, 20) + '...',
  client_email: serviceAccountCredentials.client_email,
  client_id: serviceAccountCredentials.client_id
});

// Gmail SMTP configuration
const gmailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, // Your Gmail address
    pass: process.env.GMAIL_APP_PASSWORD // Gmail App Password (not your regular password)
  }
});

// File-based OTP storage that persists between function calls
// const OTP_FILE_PATH = '/tmp/otps.json';
// const RATE_LIMIT_FILE_PATH = '/tmp/rate_limits.json';

// Helper functions for file-based storage
// const readOTPStore = () => {
//   try {
//     if (fs.existsSync(OTP_FILE_PATH)) {
//       const data = fs.readFileSync(OTP_FILE_PATH, 'utf8');
//       return JSON.parse(data);
//     }
//   } catch (error) {
//     console.log('📁 Creating new OTP store');
//   }
//   return {};
// };

// const writeOTPStore = (data) => {
//   try {
//     fs.writeFileSync(OTP_FILE_PATH, JSON.stringify(data, null, 2));
//   } catch (error) {
//     console.error('💥 Error writing OTP store:', error);
//   }
// };

// const readRateLimitStore = () => {
//   try {
//     if (fs.existsSync(RATE_LIMIT_FILE_PATH)) {
//       const data = fs.readFileSync(RATE_LIMIT_FILE_PATH, 'utf8');
//       return JSON.parse(data);
//     }
//   } catch (error) {
//     console.log('📁 Creating new rate limit store');
//   }
//   return {};
// };

// const writeRateLimitStore = (data) => {
//   try {
//     fs.writeFileSync(RATE_LIMIT_FILE_PATH, JSON.stringify(data, null, 2));
//   } catch (error) {
//     console.error('💥 Error writing rate limit store:', error);
//   }
// };

// Cleanup expired data
// const cleanupExpiredData = () => {
//   const now = Date.now();
//   
//   // Cleanup OTPs
//   const otpStore = readOTPStore();
//   let otpStoreChanged = false;
//   
//   for (const [email, data] of Object.entries(otpStore)) {
//     if (now - data.timestamp > 10 * 60 * 1000) { // 10 minutes
//       delete otpStore[email];
//       otpStoreChanged = true;
//     }
//   }
//   
//   if (otpStoreChanged) {
//     writeOTPStore(otpStore);
//   }
//   
//   // Cleanup rate limits
//   const rateLimitStore = readRateLimitStore();
//   let rateLimitStoreChanged = false;
//   
//   for (const [email, data] of Object.entries(rateLimitStore)) {
//     if (now - data.timestamp > 60 * 60 * 1000) { // 1 hour
//       delete rateLimitStore[email];
//       rateLimitStoreChanged = true;
//     }
//   }
//   
//   if (rateLimitStoreChanged) {
//     writeRateLimitStore(rateLimitStore);
//   }
// };

// Initialize Google Sheets API
const getGoogleSheets = () => {
  try {
    // Validate credentials before creating auth
    if (!serviceAccountCredentials.private_key) {
      throw new Error('Private key is missing from service account credentials');
    }
    
    if (!serviceAccountCredentials.client_email) {
      throw new Error('Client email is missing from service account credentials');
    }
    
    if (!serviceAccountCredentials.project_id) {
      throw new Error('Project ID is missing from service account credentials');
    }
    
    console.log('🔐 Creating Google Auth with validated credentials...');
    
  const auth = new google.auth.GoogleAuth({
    credentials: serviceAccountCredentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
    
    console.log('✅ Google Auth created successfully');
  
  return google.sheets({ version: 'v4', auth });
  } catch (error) {
    console.error('💥 Error creating Google Auth:', error);
    console.error('🔐 Credentials validation failed:', {
      hasPrivateKey: !!serviceAccountCredentials.private_key,
      hasClientEmail: !!serviceAccountCredentials.client_email,
      hasProjectId: !!serviceAccountCredentials.project_id,
      privateKeyLength: serviceAccountCredentials.private_key?.length || 0
    });
    throw error;
  }
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

// Generate a cryptographically secure 4-digit OTP
// const generateOTP = () => {
//   // Use crypto.randomInt for better security than Math.random
//   const crypto = require('crypto');
//   return crypto.randomInt(1000, 10000).toString();
// };

// Rate limiting: max 3 OTP requests per email per hour
// const checkRateLimit = (email) => {
//   const now = Date.now();
//   const hourAgo = now - (60 * 60 * 1000);
//   
//   const rateLimitStore = readRateLimitStore();
//   
//   if (!rateLimitStore[email]) {
//     rateLimitStore[email] = { count: 1, timestamp: now };
//     writeRateLimitStore(rateLimitStore);
//     return true;
//   }
//   
//   const data = rateLimitStore[email];
//   
//   // Reset counter if more than an hour has passed
//   if (now - data.timestamp > hourAgo) {
//     rateLimitStore[email] = { count: 1, timestamp: now };
//     writeRateLimitStore(rateLimitStore);
//     return true;
//   }
//   
//   // Check if limit exceeded
//   if (data.count >= 3) {
//     return false;
//   }
//   
//   // Increment counter
//   data.count++;
//   writeRateLimitStore(rateLimitStore);
//   return true;
// };

// Store OTP securely in file storage
// const storeOTP = (email, otp) => {
//   const timestamp = Date.now();
//   const attempts = 0;
//   
//   const otpStore = readOTPStore();
//   otpStore[email] = {
//     otp,
//     timestamp,
//     attempts,
//     verified: false
//   };
//   
//   writeOTPStore(otpStore);
//   console.log(`🔐 OTP stored for ${email}: ${otp}`);
//   console.log(`📁 Updated OTP store:`, JSON.stringify(otpStore, null, 2));
// };

// Verify OTP from file storage
// const verifyOTPFromFile = (email, otp) => {
//   console.log(`🔍 Starting OTP verification for ${email}`);
//   console.log(`🔐 OTP to verify: ${otp}`);
//   
//   const otpStore = readOTPStore();
//   console.log(`📁 Current OTP store:`, JSON.stringify(otpStore, null, 2));
//   
//   if (!otpStore[email]) {
//     console.log(`❌ No OTP found for ${email}`);
//     return false;
//   }
//   
//   const data = otpStore[email];
//   console.log(`📊 OTP data for ${email}:`, JSON.stringify(data, null, 2));
//   
//   const now = Date.now();
//   const timeDifference = (now - data.timestamp) / 1000 / 60; // minutes
//   console.log(`⏰ Time difference: ${timeDifference} minutes`);
//   
//   // Check if OTP expired (10 minutes)
//   if (timeDifference > 10) {
//     console.log(`⏰ OTP expired for ${email}`);
//     delete otpStore[email];
//     writeOTPStore(otpStore);
//     return false;
//   }
//   
//   // Check if already verified
//   if (data.verified) {
//     console.log(`❌ OTP already used for ${email}`);
//     return false;
//   }
//   
//   // Check if max attempts exceeded (5 attempts)
//   if (data.attempts >= 5) {
//     console.log(`🚫 Max attempts exceeded for ${email}`);
//     delete otpStore[email];
//     writeOTPStore(otpStore);
//     return false;
//   }
//   
//   // Increment attempts
//   data.attempts++;
//   
//   // Check if OTP matches
//   if (data.otp === otp) {
//     console.log(`✅ OTP verified successfully for ${email}`);
//     data.verified = true;
//     writeOTPStore(otpStore);
//     return true;
//   } else {
//     console.log(`❌ OTP mismatch for ${email}`);
//     writeOTPStore(otpStore);
//     return false;
//   }
// };

exports.handler = async (event, context) => {
  console.log('🚀 Netlify Function called:', event.path);
  console.log('📋 Request method:', event.httpMethod);
  console.log('📝 Request body:', event.body);

  try {
    // Cleanup expired data at the start of each request
    // cleanupExpiredData();
    
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

    let result;

    // OTP actions are completely commented out
    // if (action === 'sendOTP' || action === 'verifyOTP') {
    //   switch (action) {
    //     case 'sendOTP':
    //       result = await sendOTP(params.email);
    //       break;
    //     
    //     case 'verifyOTP':
    //       result = await verifyOTP(params.email, params.otp);
    //       break;
    //   }
    // } else {
      // Handle Google Sheets actions
    const sheets = getGoogleSheets();
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!spreadsheetId) {
      throw new Error('Spreadsheet ID not configured');
    }

    switch (action) {
      case 'checkUserEmail':
        result = await checkUserEmail(sheets, spreadsheetId, params.email);
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
      
        case 'updateBorrowerData':
          result = await updateBorrowerData(sheets, spreadsheetId, params.borrowerId, params.borrowerData);
          break;
        
        case 'deleteBorrowerData':
          result = await deleteBorrowerData(sheets, spreadsheetId, params.borrowerId);
          break;
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    // }

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

// Send OTP via Gmail (rate limiting removed for development)
// async function sendOTP(email) {
//   console.log('📧 Sending OTP to:', email);
//   
//   try {
//     // Generate secure 4-digit OTP
//     const otp = generateOTP();
//     console.log('🔐 Generated OTP:', otp);
//     
//     // Store OTP securely in memory
//     storeOTP(email, otp);
//     
//     // Send email via Gmail
//     const mailOptions = {
//       from: process.env.GMAIL_USER,
//       to: email,
//       subject: 'Your OTP for Thinkific Alert App',
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <h2 style="color: #333;">🔐 Your OTP Code</h2>
//           <p>Hello!</p>
//           <p>You requested an OTP to access the Thinkific Alert App.</p>
//           <div style="background: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
//             <h1 style="color: #007bff; font-size: 48px; margin: 0; letter-spacing: 10px;">${otp}</h1>
//           </div>
//           <p><strong>This OTP will expire in 10 minutes.</strong></p>
//           <p>If you didn't request this code, please ignore this email.</p>
//           <hr style="margin: 20px 0;">
//           <p style="color: #666; font-size: 12px;">This is an automated message from Thinkific Alert App.</p>
//         </div>
//       `
//     };
//     
//     await gmailTransporter.sendMail(mailOptions);
//     console.log('📧 OTP email sent successfully');
//     
//     return { 
//       success: true, 
//       message: 'OTP sent successfully',
//       otp: otp // For development/testing - remove in production
//     };
//     
//   } catch (error) {
//     console.error('💥 Error sending OTP:', error);
//     throw new Error(`Failed to send OTP: ${error.message}`);
//   }
// }

// Verify OTP from memory storage
// async function verifyOTP(email, otp) {
//   console.log('🔍 Verifying OTP for:', email);
//   console.log('🔐 OTP received:', otp);
//   
//   try {
//     const isValid = verifyOTPFromFile(email, otp);
//     console.log('✅ OTP valid:', isValid);
//     
//     return { 
//       valid: isValid,
//       message: isValid ? 'OTP verified successfully' : 'Invalid or expired OTP'
//     };
//   } catch (error) {
//     console.error('💥 Error verifying OTP:', error);
//     throw new Error(`Failed to verify OTP: ${error.message}`);
//   }
// }

// Fetch borrower data for a specific user
async function fetchBorrowerData(sheets, spreadsheetId, userEmail) {
  console.log('📊 Fetching borrower data for:', userEmail);
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Borrower_Data!A:M' // Updated to include unique ID column
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

  // Find the User Email column index dynamically
  const userEmailIndex = headers.findIndex(header => 
    header.toLowerCase().includes('user email') || 
    header.toLowerCase().includes('email')
  );
  
  if (userEmailIndex === -1) {
    console.error('❌ User Email column not found in headers:', headers);
    return [];
  }
  
  console.log('📧 User Email column found at index:', userEmailIndex);

  // Filter data for the specific user
  const userData = dataRows
    .filter(row => row[userEmailIndex] === userEmail)
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
  
  try {
    // Step 1: Get current Freddie Mac rate for calculations
    const freddieMacResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Freddie_Mac_Rate!B2'
    });
    
    const freddieMacRate = freddieMacResponse.data.values?.[0]?.[0] || '6.00%';
    console.log('📈 Current Freddie Mac Rate:', freddieMacRate);
    
    // Step 2: Generate unique ID for this borrower
    const uniqueId = `borrower_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('🆔 Generated unique ID:', uniqueId);
    
    // Step 3: Parse and calculate all values with proper type conversion
    // Handle both string and number inputs from frontend
    let loanAmount, interestRate;
    
    // Parse loan amount
    if (typeof borrowerData['Current Loan Amount'] === 'string') {
      loanAmount = parseFloat(borrowerData['Current Loan Amount'].replace(/[$,]/g, ''));
    } else {
      loanAmount = parseFloat(borrowerData['Current Loan Amount'] || 0);
    }
    
    // Parse interest rate
    if (typeof borrowerData['Current Interest Rate'] === 'string') {
      interestRate = parseFloat(borrowerData['Current Interest Rate'].replace('%', ''));
    } else {
      interestRate = parseFloat(borrowerData['Current Interest Rate'] || 0);
    }
    
    const desiredSavings = parseFloat(borrowerData['Desired Monthly Savings'] || 0);
    
    // Validate required fields
    if (!loanAmount || isNaN(loanAmount)) {
      throw new Error(`Invalid loan amount: ${borrowerData['Current Loan Amount']}`);
    }
    if (!interestRate || isNaN(interestRate)) {
      throw new Error(`Invalid interest rate: ${borrowerData['Current Interest Rate']}`);
    }
    
    console.log('📊 Parsed values:', {
      loanAmount,
      interestRate,
      desiredSavings,
      freddieMacRate,
      originalLoanAmount: borrowerData['Current Loan Amount'],
      originalInterestRate: borrowerData['Current Interest Rate']
    });
    
    // Convert Freddie Mac rate to number
    const freddieMacRateNum = parseFloat(freddieMacRate.replace('%', ''));
    
    // Calculate all values using the provided formulas
    const currentMonthlyRate = interestRate / 100 / 12; // C:C/12 (divide by 100 first, then by 12)
    const currentPayment = loanAmount * ((currentMonthlyRate * Math.pow(1 + currentMonthlyRate, 360)) / (Math.pow(1 + currentMonthlyRate, 360) - 1));
    const freddieMacMonthlyRate = freddieMacRateNum / 100 / 12; // H3/12
    const estimatedNewPayment = loanAmount * ((freddieMacMonthlyRate * Math.pow(1 + freddieMacMonthlyRate, 360)) / (Math.pow(1 + freddieMacMonthlyRate, 360) - 1));
    const estimatedSavings = currentPayment - estimatedNewPayment;
    const refiOpportunity = estimatedSavings >= desiredSavings;
    
    console.log('🧮 Calculated values:', {
      currentMonthlyRate: currentMonthlyRate.toFixed(6),
      currentPayment: Math.round(currentPayment),
      freddieMacMonthlyRate: freddieMacMonthlyRate.toFixed(6),
      estimatedNewPayment: Math.round(estimatedNewPayment),
      estimatedSavings: Math.round(estimatedSavings),
      refiOpportunity: refiOpportunity
    });
    
    // Step 4: Prepare values array with calculated results and unique ID
    const values = [
      uniqueId, // Column A: Unique ID
      borrowerData['Borrower Name'] || '', // Column B: Borrower Name
      borrowerData['Current Loan Amount'] || '', // Column C: Current Loan Amount
      interestRate/100, // Column D: Store interest rate exactly as input (e.g., 6.5)
      "=D:D/12",
      borrowerData['Desired Monthly Savings'] || '', // Column F: Desired Monthly Savings
      borrowerData['User Email'] || '', // Column G: User Email
      "=C:C*((E:E*(1+E:E)^360)/((1+E:E)^360-1))",
      "=Freddie_Mac_Rate!B$2",
      "=I:I/12",
      "=C:C*((J:J*(1+J:J)^360)/((1+J:J)^360-1))",
      "=$H:$H-$K:$K",
      "=IF($L:$L >= $F:$F, TRUE, FALSE)"
    ];

    console.log('📊 Final values to store:', values);

    // Step 5: Add the new row with all calculated values
  const response = await sheets.spreadsheets.values.append({
    spreadsheetId,
      range: 'Borrower_Data!A:M', // Updated to include unique ID column
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: {
      values: [values]
    }
  });

    console.log('✅ Borrower data added successfully with all calculated values');
    return { 
      success: true, 
      message: 'Borrower data added successfully with all calculations completed',
      uniqueId: uniqueId,
      calculatedValues: {
        currentMonthlyRate: currentMonthlyRate.toFixed(6),
        currentPayment: Math.round(currentPayment),
        freddieMacMonthlyRate: freddieMacMonthlyRate.toFixed(6),
        estimatedNewPayment: Math.round(estimatedNewPayment),
        estimatedSavings: Math.round(estimatedSavings),
        refiOpportunity: refiOpportunity
      }
    };

  } catch (error) {
    console.error('💥 Error in addBorrowerData:', error);
    throw new Error(`Failed to add borrower data: ${error.message}`);
  }
}

// Update existing borrower data
async function updateBorrowerData(sheets, spreadsheetId, borrowerId, borrowerData) {
  console.log('✏️ Updating borrower data:', { borrowerId, borrowerData });

  try {
    // Step 1: Find the row with the specified unique ID or borrower name
    const searchResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Borrower_Data!A:M'
    });

    const searchValues = searchResponse.data.values || [];
    if (searchValues.length === 0) {
      throw new Error('No borrower data found');
    }

    const headers = searchValues[0];
    const dataRows = searchValues.slice(1);

    // Find row index
    let rowIndex = -1;
    if (borrowerId && borrowerId !== 'undefined') {
      for (let i = 0; i < dataRows.length; i++) {
        if (dataRows[i][0] === borrowerId) {
          rowIndex = i;
          break;
        }
      }
    }

    if (rowIndex === -1) {
      const borrowerName = borrowerData['Borrower Name'];
      const borrowerNameIndex = headers.findIndex(header =>
        header.toLowerCase().includes('borrower name')
      );
      if (borrowerNameIndex !== -1) {
        for (let i = 0; i < dataRows.length; i++) {
          if (dataRows[i][borrowerNameIndex] === borrowerName) {
            rowIndex = i;
            break;
          }
        }
      }
    }

    if (rowIndex === -1) {
      throw new Error(`Borrower with ID ${borrowerId} or name ${borrowerData['Borrower Name']} not found`);
    }

    let uniqueId = borrowerId;
    if (!uniqueId || uniqueId === 'undefined') {
      uniqueId = `borrower_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('🆔 Generated new unique ID for existing borrower:', uniqueId);
    }
    
    const values = [
      uniqueId, // Column A: Unique ID
      borrowerData['Borrower Name'] || '', // Column B: Borrower Name
      borrowerData['Current Loan Amount'] || '', // Column C: Current Loan Amount
      (borrowerData['Current Interest Rate']/100) || '', // Column D: Current Interest Rate (decimal form)
      "=D:D/12",
      borrowerData['Desired Monthly Savings'] || '', // Column F: Desired Monthly Savings
      borrowerData['User Email'] || '', // Column G: User Email
      "=C:C*((E:E*(1+E:E)^360)/((1+E:E)^360-1))",
      "=Freddie_Mac_Rate!B$2",
      "=I:I/12",
      "=C:C*((J:J*(1+J:J)^360)/((1+J:J)^360-1))",
      "=$H:$H-$K:$K",
      "=IF($L:$L >= $F:$F, TRUE, FALSE)"
    ];
    
    // Step 5: Update the specific row
    const range = `Borrower_Data!A${rowIndex + 2}:M${rowIndex + 2}`; 
    // +2 → because rowIndex is zero-based & row 1 is headers
    
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED', // IMPORTANT: allows formulas to work
      resource: {
        values: [values]
      }
    });

    console.log('✅ Borrower data updated successfully (with formulas)');
    return {
      success: true,
      message: 'Borrower data updated successfully with formulas applied'
    };

  } catch (error) {
    console.error('💥 Error in updateBorrowerData:', error);
    throw new Error(`Failed to update borrower data: ${error.message}`);
  }
}


// Delete borrower data
async function deleteBorrowerData(sheets, spreadsheetId, borrowerId) {
  console.log('🗑️ Deleting borrower with key:', borrowerId);

  try {
    // Grab the whole table (incl. header)
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Borrower_Data!A:M'
    });

    const values = res.data.values || [];
    if (values.length < 2) {
      throw new Error('No borrower data found');
    }

    const headers = values[0];

    // Build rows with their actual sheet row numbers (header is row 1)
    const rows = values.slice(1).map((row, i) => ({
      rowNumber: i + 2, // sheet is 1-based + header offset
      row
    }));

    // 1) Try to match by Unique ID (Column A)
    let candidates = rows.filter(r => r.row[0] === borrowerId);

    // 2) If not found, try to match by Borrower Name/Last Name (exact match)
    if (candidates.length === 0) {
      const nameColIndex = headers.findIndex(h =>
        /borrower.*(name|last)/i.test(h)
      );

      if (nameColIndex !== -1) {
        candidates = rows.filter(r => (r.row[nameColIndex] || '') === borrowerId);
      }
    }

    if (candidates.length === 0) {
      throw new Error(`No row found for "${borrowerId}". Pass the Unique ID to avoid ambiguity.`);
    }
    if (candidates.length > 1) {
      // Prevent deleting the wrong row if name duplicates exist
      const dupRows = candidates.map(c => c.rowNumber).join(', ');
      throw new Error(
        `Multiple rows matched "${borrowerId}" (rows: ${dupRows}). Use the Unique ID from column A.`
      );
    }

    const targetRow = candidates[0].rowNumber;
    console.log('📍 Deleting row:', targetRow);

    // Find the sheetId for the "Borrower_Data" sheet
    const spreadsheetMeta = await sheets.spreadsheets.get({ spreadsheetId });
    const borrowerSheet = (spreadsheetMeta.data.sheets || []).find(
      s => s.properties && s.properties.title === 'Borrower_Data'
    );
    if (!borrowerSheet) {
      throw new Error('Sheet "Borrower_Data" not found');
    }
    const sheetId = borrowerSheet.properties.sheetId;

    // Delete the row via batchUpdate → deleteDimension uses zero-based indices
    const startIndex = targetRow - 1;
    const endIndex = targetRow;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: 'ROWS',
                startIndex,
                endIndex
              }
            }
          }
        ]
      }
    });

    console.log('✅ Borrower row deleted successfully', targetRow);
    return {
      success: true,
      message: `Borrower row ${targetRow} deleted successfully`
    };

  } catch (error) {
    console.error('💥 Error in deleteBorrowerData:', error);
    throw new Error(`Failed to delete borrower data: ${error.message}`);
  }
}


