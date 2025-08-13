# Thinkific Alert App

A secure React application that integrates with Google Sheets to manage borrower data and Freddie Mac rates. The app uses Netlify Functions to keep all Google Sheets credentials completely secure and server-side.

## 🔐 **Security Features**

- **Zero Credentials Exposure**: All Google Sheets credentials are stored securely in Netlify environment variables
- **Serverless Backend**: Uses Netlify Functions to handle all Google Sheets operations
- **Private Spreadsheet Access**: Works with private Google Sheets without making them public
- **Professional Grade**: Enterprise-level security without additional infrastructure
- **Real Data Integration**: Always uses actual Google Sheets data, never mock data

## 🚀 **Quick Start**

### 1. **Clone and Install**
```bash
git clone <your-repo-url>
cd thinkific_alert_app
npm install
```

### 2. **Development Setup (Optional)**

#### **Local Development with Netlify Functions**
```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Start both React app and Netlify Functions
npm run dev:full

# Access your app
http://localhost:3000/?email=your-test-email@example.com
```

**Note**: Local development requires setting up `.env.local` with your Google credentials. For production deployment, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

### 3. **Production Setup (Google Sheets Integration)**

#### **Create a Google Service Account:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Sheets API
4. Go to "IAM & Admin" > "Service Accounts"
5. Create a new service account
6. Download the `credentials.json` file

#### **Prepare Your Google Sheet:**
Create a Google Sheet with these tabs:
- **`users`**: Column A should contain user emails
- **`Freddie_Mac_Rate`**: Columns A (Date) and B (30-Year Fixed Rate)
- **`Borrower_Data`**: Columns A-L with headers as specified in the app

#### **Share Your Sheet:**
- Share the Google Sheet with your service account email (from credentials.json)
- Give it "Editor" access

#### **Set Netlify Environment Variables:**
1. Go to your Netlify site dashboard
2. Navigate to "Site settings" > "Environment variables"
3. Add these variables (copy values from your `credentials.json`):

```bash
GOOGLE_SERVICE_ACCOUNT_TYPE=service_account
GOOGLE_SERVICE_ACCOUNT_PROJECT_ID=your-project-id
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_ID=your-private-key-id
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_CLIENT_ID=your-client-id
GOOGLE_SERVICE_ACCOUNT_AUTH_URI=https://accounts.google.com/o/oauth2/auth
GOOGLE_SERVICE_ACCOUNT_TOKEN_URI=https://oauth2.googleapis.com/token
GOOGLE_SERVICE_ACCOUNT_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
GOOGLE_SERVICE_ACCOUNT_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project.iam.gserviceaccount.com
GOOGLE_SPREADSHEET_ID=your-spreadsheet-id-here
```

## 🏗️ **Architecture**

### **Development & Production Mode**
- **Frontend**: React app calling Netlify Functions
- **Backend**: Netlify Functions with Google Sheets API
- **Data**: Real Google Sheets data (never mock data)
- **Security**: Credentials stored in Netlify environment variables
- **Consistency**: Same behavior in development and production

### **Data Flow**
1. User accesses app with email parameter
2. Frontend calls Netlify Function (or uses mock data in dev)
3. OTP verification through secure backend
4. Data fetching and writing through secure serverless functions
5. All Google Sheets operations happen server-side

## 🔧 **Development Workflow**

### **Production Deployment (Recommended)**
```bash
npm run build
# Deploy to Netlify for instant production setup
# See DEPLOYMENT_GUIDE.md for detailed steps
```

### **Local Development (Optional)**
```bash
npm run dev:full
# Requires .env.local setup with Google credentials
# See DEPLOYMENT_GUIDE.md for credential setup
```

## 🛡️ **Security Benefits**

1. **No Credential Exposure**: Service account keys never leave the server
2. **Private Sheet Access**: Works with private Google Sheets
3. **Serverless Security**: Netlify handles security and scaling
4. **Environment Isolation**: Production and development environments are separate
5. **No Backend Management**: Zero server maintenance required
6. **Real Data Integration**: Always uses actual Google Sheets, never mock data

## 🐛 **Troubleshooting**

### **Development Issues**

#### **"Netlify Functions not found"**
- Ensure Netlify CLI is installed globally
- Check `netlify.toml` configuration
- Verify function file exists in `netlify/functions/`
- Ensure you're using `npm run dev` not `npm start`

### **Production Issues**

#### **Google Sheets Permission Errors**
- Verify service account email has access to the sheet
- Check environment variables are correctly set
- Ensure Google Sheets API is enabled

#### **Environment Variable Issues**
- Verify all required variables are set in Netlify dashboard
- Check variable names match exactly (case-sensitive)
- Ensure private key includes proper newline characters

### **Debug Mode**
The app includes extensive console logging:
- **Netlify Function logs**: 🚀 emoji for all API operations
- **Errors**: Detailed error information with 💥 emoji
- **Real-time data**: All operations use actual Google Sheets data

## 📝 **API Reference**

### **Netlify Function Actions**

| Action | Parameters | Description |
|--------|------------|-------------|
| `checkUserEmail` | `{ email }` | Verify if user email exists in users sheet |
| `sendOTP` | `{ email }` | Generate and send OTP to user |
| `verifyOTP` | `{ email, otp }` | Verify user-provided OTP |
| `fetchBorrowerData` | `{ userEmail }` | Get borrower data for specific user |
| `fetchFreddieMacRates` | `{}` | Get current Freddie Mac rates |
| `addBorrowerData` | `{ borrowerData }` | Add new borrower to sheet |



## 🚀 **Deployment**

### **Netlify (Recommended)**
1. Connect your GitHub repository to Netlify
2. Set environment variables in Netlify dashboard
3. Deploy automatically on every push

### **Manual Deployment**
```bash
npm run build
netlify deploy --prod --dir=build
```

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly (both mock and real data)
5. Submit a pull request

## 📄 **License**

This project is licensed under the MIT License.

## 🆘 **Support**

For issues and questions:
1. Check the troubleshooting section
2. Review console logs (mock data vs function logs)
3. Ensure environment variables are set correctly for your mode
4. Verify Google Sheets permissions and sharing settings
