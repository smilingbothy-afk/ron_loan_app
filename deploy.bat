@echo off
echo 🚀 Starting deployment to Netlify...

REM Check if Netlify CLI is installed
netlify --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Netlify CLI is not installed. Installing now...
    npm install -g netlify-cli
)

REM Build the project
echo 📦 Building the project...
call npm run build

if %errorlevel% neq 0 (
    echo ❌ Build failed. Please fix the errors and try again.
    pause
    exit /b 1
)

echo ✅ Build completed successfully!

REM Deploy to Netlify
echo 🌐 Deploying to Netlify...
call netlify deploy --prod --dir=build

if %errorlevel% equ 0 (
    echo 🎉 Deployment completed successfully!
    echo 📝 Don't forget to set your environment variables in Netlify:
    echo    - REACT_APP_GOOGLE_SHEETS_API_KEY
    echo    - REACT_APP_SPREADSHEET_ID
) else (
    echo ❌ Deployment failed. Please check the error messages above.
)

pause
