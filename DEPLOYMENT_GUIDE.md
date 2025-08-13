# 🚀 **Netlify Production Deployment Guide**

This guide will walk you through deploying your Thinkific Alert App to Netlify with full Google Sheets integration.

## 📋 **Prerequisites**

1. **Google Service Account** with credentials.json file
2. **Google Sheet** with the required tabs (users, Freddie_Mac_Rate, Borrower_Data)
3. **GitHub repository** with your code
4. **Netlify account** (free tier works perfectly)

## 🔧 **Step 1: Prepare Your Google Sheets**

### **1.1 Create/Update Your Google Sheet**
Ensure your Google Sheet has these tabs:
- **`users`**: Column A contains user emails
- **`Freddie_Mac_Rate`**: Columns A (Date) and B (30-Year Fixed Rate)
- **`Borrower_Data`**: Columns A-L with proper headers

### **1.2 Share Your Sheet**
1. Open your Google Sheet
2. Click "Share" button
3. Add your service account email (from credentials.json)
4. Give it "Editor" access
5. Copy the Spreadsheet ID from the URL

## 🔐 **Step 2: Set Up Netlify Environment Variables**

### **2.1 Go to Netlify Dashboard**
1. Log in to [netlify.com](https://netlify.com)
2. Create a new site or select existing one

### **2.2 Add Environment Variables**
1. Go to **Site settings** → **Environment variables**
2. Add these variables (copy values from your credentials.json):

```bash
# Google Service Account Credentials
GOOGLE_SERVICE_ACCOUNT_TYPE=service_account
GOOGLE_SERVICE_ACCOUNT_PROJECT_ID=your-actual-project-id
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_ID=your-actual-private-key-id
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour actual private key here\n-----END PRIVATE KEY-----\n"
GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL=your-actual-service-account@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_CLIENT_ID=your-actual-client-id
GOOGLE_SERVICE_ACCOUNT_AUTH_URI=https://accounts.google.com/o/oauth2/auth
GOOGLE_SERVICE_ACCOUNT_TOKEN_URI=https://oauth2.googleapis.com/token
GOOGLE_SERVICE_ACCOUNT_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
GOOGLE_SERVICE_ACCOUNT_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/your-actual-service-account%40your-project.iam.gserviceaccount.com

# Google Spreadsheet ID
GOOGLE_SPREADSHEET_ID=your-actual-spreadsheet-id
```

### **2.3 Important Notes**
- **Copy EXACTLY** from your credentials.json
- **Include quotes** around the private key
- **Use actual values**, not placeholders
- **Check spelling** - these are case-sensitive

## 🌐 **Step 3: Deploy to Netlify**

### **3.1 Connect GitHub Repository**
1. In Netlify dashboard, click **"New site from Git"**
2. Choose **GitHub**
3. Select your repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `build`
   - **Node version**: `18` (or higher)

### **3.2 Deploy**
1. Click **"Deploy site"**
2. Wait for build to complete
3. Your site will be live at `https://your-site-name.netlify.app`

## ✅ **Step 4: Test Your Production App**

### **4.1 Test URL Format**
```
https://your-site-name.netlify.app/?email=test@example.com
```

### **4.2 Test All Functions**
1. **Email Verification**: Should check against your users sheet
2. **OTP System**: Should generate and verify OTPs
3. **Data Display**: Should show borrower data from your sheet
4. **Add Borrower**: Should write to your Borrower_Data sheet

## 🐛 **Troubleshooting Production Issues**

### **Common Error: "Function not found"**
- Ensure `netlify/functions/google-sheets.js` exists in your repo
- Check that `netlify.toml` has correct functions path

### **Common Error: "Google Sheets permission denied"**
- Verify service account email has access to your sheet
- Check all environment variables are set correctly
- Ensure Google Sheets API is enabled in your Google Cloud project

### **Common Error: "Spreadsheet not found"**
- Verify `GOOGLE_SPREADSHEET_ID` is correct
- Check the spreadsheet ID in your Google Sheets URL

## 🔍 **Verify Your Setup**

### **Check Environment Variables**
1. Go to Netlify dashboard → Site settings → Environment variables
2. Verify all 11 variables are present
3. Check that values match your credentials.json exactly

### **Check Function Deployment**
1. Visit `https://your-site-name.netlify.app/.netlify/functions/google-sheets`
2. Should see function response (not 404 error)

### **Check Google Sheets Access**
1. Verify service account email has "Editor" access
2. Test with a known email from your users sheet

## 🎯 **Production Benefits**

✅ **Always Available**: 24/7 uptime with Netlify's global CDN
✅ **Automatic Scaling**: Handles traffic spikes automatically
✅ **SSL Certificate**: Free HTTPS included
✅ **Global Performance**: Fast loading worldwide
✅ **Zero Maintenance**: No server management required
✅ **Secure Credentials**: All secrets stored safely in Netlify

## 🚀 **Next Steps After Deployment**

1. **Test thoroughly** with different email addresses
2. **Monitor function logs** in Netlify dashboard
3. **Set up custom domain** if needed
4. **Configure form notifications** for user feedback
5. **Set up monitoring** for any errors

## 📞 **Need Help?**

If you encounter issues:
1. Check Netlify function logs in dashboard
2. Verify all environment variables are set
3. Test Google Sheets access manually
4. Check browser console for error details

Your app will be production-ready and accessible worldwide! 🌍
