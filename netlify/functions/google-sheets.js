const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

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

// Gmail SMTP configuration
const gmailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, // Your Gmail address
    pass: process.env.GMAIL_APP_PASSWORD // Gmail App Password (not your regular password)
  }
});

// File-based OTP storage that persists between function calls
const OTP_FILE_PATH = '/tmp/otps.json';
const RATE_LIMIT_FILE_PATH = '/tmp/rate_limits.json';

// Helper functions for file-based storage
const readOTPStore = () => {
  try {
    if (fs.existsSync(OTP_FILE_PATH)) {
      const data = fs.readFileSync(OTP_FILE_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.log('📁 Creating new OTP store');
  }
  return {};
};

const writeOTPStore = (data) => {
  try {
    fs.writeFileSync(OTP_FILE_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('💥 Error writing OTP store:', error);
  }
};

const readRateLimitStore = () => {
  try {
    if (fs.existsSync(RATE_LIMIT_FILE_PATH)) {
      const data = fs.readFileSync(RATE_LIMIT_FILE_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.log('📁 Creating new rate limit store');
  }
  return {};
};

const writeRateLimitStore = (data) => {
  try {
    fs.writeFileSync(RATE_LIMIT_FILE_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('💥 Error writing rate limit store:', error);
  }
};

// Cleanup expired data
const cleanupExpiredData = () => {
  const now = Date.now();
  
  // Cleanup OTPs
  const otpStore = readOTPStore();
  let otpStoreChanged = false;
  
  for (const [email, data] of Object.entries(otpStore)) {
    if (now - data.timestamp > 10 * 60 * 1000) { // 10 minutes
      delete otpStore[email];
      otpStoreChanged = true;
    }
  }
  
  if (otpStoreChanged) {
    writeOTPStore(otpStore);
  }
  
  // Cleanup rate limits
  const rateLimitStore = readRateLimitStore();
  let rateLimitStoreChanged = false;
  
  for (const [email, data] of Object.entries(rateLimitStore)) {
    if (now - data.timestamp > 60 * 60 * 1000) { // 1 hour
      delete rateLimitStore[email];
      rateLimitStoreChanged = true;
    }
  }
  
  if (rateLimitStoreChanged) {
    writeRateLimitStore(rateLimitStore);
  }
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

// Generate a cryptographically secure 4-digit OTP
const generateOTP = () => {
  // Use crypto.randomInt for better security than Math.random
  const crypto = require('crypto');
  return crypto.randomInt(1000, 10000).toString();
};

// Rate limiting: max 3 OTP requests per email per hour
const checkRateLimit = (email) => {
  const now = Date.now();
  const hourAgo = now - (60 * 60 * 1000);
  
  const rateLimitStore = readRateLimitStore();
  
  if (!rateLimitStore[email]) {
    rateLimitStore[email] = { count: 1, timestamp: now };
    writeRateLimitStore(rateLimitStore);
    return true;
  }
  
  const data = rateLimitStore[email];
  
  // Reset counter if more than an hour has passed
  if (now - data.timestamp > hourAgo) {
    rateLimitStore[email] = { count: 1, timestamp: now };
    writeRateLimitStore(rateLimitStore);
    return true;
  }
  
  // Check if limit exceeded
  if (data.count >= 3) {
    return false;
  }
  
  // Increment counter
  data.count++;
  writeRateLimitStore(rateLimitStore);
  return true;
};

// Store OTP securely in file storage
const storeOTP = (email, otp) => {
  const timestamp = Date.now();
  const attempts = 0;
  
  const otpStore = readOTPStore();
  otpStore[email] = {
    otp,
    timestamp,
    attempts,
    verified: false
  };
  
  writeOTPStore(otpStore);
  console.log(`🔐 OTP stored for ${email}: ${otp}`);
  console.log(`📁 Updated OTP store:`, JSON.stringify(otpStore, null, 2));
};

// Verify OTP from file storage
const verifyOTPFromFile = (email, otp) => {
  console.log(`🔍 Starting OTP verification for ${email}`);
  console.log(`🔐 OTP to verify: ${otp}`);
  
  const otpStore = readOTPStore();
  console.log(`📁 Current OTP store:`, JSON.stringify(otpStore, null, 2));
  
  if (!otpStore[email]) {
    console.log(`❌ No OTP found for ${email}`);
    return false;
  }
  
  const data = otpStore[email];
  console.log(`📊 OTP data for ${email}:`, JSON.stringify(data, null, 2));
  
  const now = Date.now();
  const timeDifference = (now - data.timestamp) / 1000 / 60; // minutes
  console.log(`⏰ Time difference: ${timeDifference} minutes`);
  
  // Check if OTP expired (10 minutes)
  if (timeDifference > 10) {
    console.log(`⏰ OTP expired for ${email}`);
    delete otpStore[email];
    writeOTPStore(otpStore);
    return false;
  }
  
  // Check if already verified
  if (data.verified) {
    console.log(`❌ OTP already used for ${email}`);
    return false;
  }
  
  // Check if max attempts exceeded (5 attempts)
  if (data.attempts >= 5) {
    console.log(`🚫 Max attempts exceeded for ${email}`);
    delete otpStore[email];
    writeOTPStore(otpStore);
    return false;
  }
  
  // Increment attempt counter
  data.attempts++;
  console.log(`🔄 Attempt ${data.attempts}/5 for ${email}`);
  
  // Check if OTP matches
  console.log(`🔍 Comparing OTP: "${data.otp}" === "${otp}"`);
  if (data.otp === otp) {
    // Mark as verified and remove from store
    data.verified = true;
    delete otpStore[email];
    writeOTPStore(otpStore);
    console.log(`✅ OTP verified for ${email}`);
    return true;
  }
  
  // Update attempts in store
  otpStore[email] = data;
  writeOTPStore(otpStore);
  
  console.log(`❌ Invalid OTP for ${email}, attempt ${data.attempts}/5`);
  return false;
};

exports.handler = async (event, context) => {
  console.log('🚀 Netlify Function called:', event.path);
  console.log('📋 Request method:', event.httpMethod);
  console.log('📝 Request body:', event.body);

  try {
    // Cleanup expired data at the start of each request
    cleanupExpiredData();
    
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

    // Handle OTP actions without Google Sheets dependency
    if (action === 'sendOTP' || action === 'verifyOTP') {
      switch (action) {
        case 'sendOTP':
          result = await sendOTP(params.email);
          break;
        
        case 'verifyOTP':
          result = await verifyOTP(params.email, params.otp);
          break;
      }
    } else {
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

// Send OTP via Gmail (rate limiting removed for development)
async function sendOTP(email) {
  console.log('📧 Sending OTP to:', email);
  
  try {
    // Generate secure 4-digit OTP
    const otp = generateOTP();
    console.log('🔐 Generated OTP:', otp);
    
    // Store OTP securely in memory
    storeOTP(email, otp);
    
    // Send email via Gmail
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Your OTP for Thinkific Alert App',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">🔐 Your OTP Code</h2>
          <p>Hello!</p>
          <p>You requested an OTP to access the Thinkific Alert App.</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 48px; margin: 0; letter-spacing: 10px;">${otp}</h1>
          </div>
          <p><strong>This OTP will expire in 10 minutes.</strong></p>
          <p>If you didn't request this code, please ignore this email.</p>
          <hr style="margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated message from Thinkific Alert App.</p>
        </div>
      `
    };
    
    await gmailTransporter.sendMail(mailOptions);
    console.log('📧 OTP email sent successfully');
    
    return { 
      success: true, 
      message: 'OTP sent successfully',
      otp: otp // For development/testing - remove in production
    };
    
  } catch (error) {
    console.error('💥 Error sending OTP:', error);
    throw new Error(`Failed to send OTP: ${error.message}`);
  }
}

// Verify OTP from memory storage
async function verifyOTP(email, otp) {
  console.log('🔍 Verifying OTP for:', email);
  console.log('🔐 OTP received:', otp);
  
  try {
    const isValid = verifyOTPFromFile(email, otp);
    console.log('✅ OTP valid:', isValid);
    
    return { 
      valid: isValid,
      message: isValid ? 'OTP verified successfully' : 'Invalid or expired OTP'
    };
  } catch (error) {
    console.error('💥 Error verifying OTP:', error);
    throw new Error(`Failed to verify OTP: ${error.message}`);
  }
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


