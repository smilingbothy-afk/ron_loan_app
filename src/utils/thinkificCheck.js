// Utility function to check if the app is running inside Thinkific iframe
export const isRunningInThinkific = () => {
  // Check if THINKIFIC_RESTRICTED environment variable is set
  const isRestricted = process.env.REACT_APP_THINKIFIC_RESTRICTED === '1';
  
  console.log('🔐 Thinkific Check Debug:', {
    envVar: process.env.REACT_APP_THINKIFIC_RESTRICTED,
    isRestricted: isRestricted,
    isInIframe: window.self !== window.top
  });
  
  // If not restricted, always allow access
  if (!isRestricted) {
    console.log('✅ Access allowed: Not restricted');
    return true; // Allow access anywhere when not restricted
  }
  
  // If restricted, check iframe and domain
  // Check if we're running inside an iframe
  const isInIframe = window.self !== window.top;
  
  if (!isInIframe) {
    console.log('❌ Access denied: Not in iframe');
    return false; // Deny access if not in iframe
  }
  
  // Check if the parent window is from Thinkific
  try {
    const parentHostname = window.parent.location.hostname;
    
    // Check if parent is Thinkific domain
    const isThinkificDomain = parentHostname.includes('thinkific.com') || 
                              parentHostname.includes('rvionline.thinkific.com');
    
    console.log('🔍 Domain check:', {
      parentHostname,
      isThinkificDomain
    });
    
    return isThinkificDomain;
  } catch (error) {
    console.log('⚠️ Error checking parent domain, assuming Thinkific:', error);
    // If we can't access parent origin due to same-origin policy, 
    // assume it's Thinkific if we're in an iframe
    return true;
  }
};

// Function to redirect or show error if not in Thinkific
export const enforceThinkificAccess = () => {
  console.log('🚪 Enforcing Thinkific access...');
  
  // If not restricted, allow access anywhere
  if (process.env.REACT_APP_THINKIFIC_RESTRICTED !== '1') {
    console.log('✅ Access allowed: Not restricted');
    return true; // Allow access anywhere
  }
  
  console.log('🔒 Access restricted: Checking Thinkific...');
  // If restricted, check if running in Thinkific
  return isRunningInThinkific();
};
