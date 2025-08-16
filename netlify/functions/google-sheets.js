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
  
  try {
    // Step 1: Get current Freddie Mac rate for calculations
    const freddieMacResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Freddie_Mac_Rate!B2'
    });
    
    const freddieMacRate = freddieMacResponse.data.values?.[0]?.[0] || '6.00%';
    console.log('📈 Current Freddie Mac Rate:', freddieMacRate);
    
    // Step 2: Parse and calculate all values with proper type conversion
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
    
    // Step 3: Prepare values array with calculated results
    const values = [
      borrowerData['Borrower Name'] || '',
      borrowerData['Current Loan Amount'] || '',
      (interestRate / 100).toFixed(2), // Store interest rate divided by 100 (e.g., 6.50% → 0.065)
      currentMonthlyRate.toFixed(7), // Current Monthly Rate (calculated)
      borrowerData['Desired Monthly Savings'] || '',
      borrowerData['User Email'] || '',
      Math.round(currentPayment), // Current Payment (calculated)
      freddieMacRate, // Freddie Mac Rate (from sheet)
      freddieMacMonthlyRate.toFixed(6), // Freddie Mac Monthly Rate (calculated)
      Math.round(estimatedNewPayment), // Estimated New Payment (calculated)
      Math.round(estimatedSavings), // Estimated Savings (calculated)
      refiOpportunity ? 'TRUE' : 'FALSE' // Refi Opportunity (calculated)
    ];

    console.log('📊 Final values to store:', values);

    // Step 4: Add the new row with all calculated values
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Borrower_Data!A:L',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [values]
      }
    });

    console.log('✅ Borrower data added successfully with all calculated values');
    return { 
      success: true, 
      message: 'Borrower data added successfully with all calculations completed',
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


