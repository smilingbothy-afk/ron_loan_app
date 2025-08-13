# 🚀 **Quick Start - Deploy to Production in 5 Minutes**

## ⚡ **Super Fast Setup**

### **1. Build Your App**
```bash
npm run build
```

### **2. Deploy to Netlify**
1. Go to [netlify.com](https://netlify.com)
2. Drag & drop your `build` folder
3. Your app is live! 🎉

### **3. Set Up Google Sheets Integration**
1. In Netlify dashboard → Site settings → Environment variables
2. Add your Google Service Account credentials
3. Test with: `https://your-site.netlify.app/?email=test@example.com`

## 🔐 **Required Environment Variables**

Copy these from your `credentials.json` file:

```bash
GOOGLE_SERVICE_ACCOUNT_TYPE=service_account
GOOGLE_SERVICE_ACCOUNT_PROJECT_ID=your-project-id
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_ID=your-private-key-id
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key\n-----END PRIVATE KEY-----\n"
GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_CLIENT_ID=your-client-id
GOOGLE_SERVICE_ACCOUNT_AUTH_URI=https://accounts.google.com/o/oauth2/auth
GOOGLE_SERVICE_ACCOUNT_TOKEN_URI=https://oauth2.googleapis.com/token
GOOGLE_SERVICE_ACCOUNT_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
GOOGLE_SERVICE_ACCOUNT_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project.iam.gserviceaccount.com
GOOGLE_SPREADSHEET_ID=your-spreadsheet-id
```

## ✅ **That's It!**

Your app will be:
- 🌍 **Live worldwide** on Netlify's global CDN
- 🔐 **Secure** with HTTPS and protected credentials
- 📱 **Mobile optimized** and fast loading
- 🚀 **Auto-scaling** for any traffic volume

**For detailed setup, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**
