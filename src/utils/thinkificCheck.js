// Utility function to check if the app is running inside Thinkific iframe
export const isRunningInThinkific = () => {
  // Check if THINKIFIC_RESTRICTED environment variable is set
  const isRestricted = process.env.REACT_APP_THINKIFIC_RESTRICTED === '1';
  
  if (!isRestricted) {
    // If THINKIFIC_RESTRICTED is not set to 1, allow access outside Thinkific
    return false;
  }
  
  // Check if we're running inside an iframe
  const isInIframe = window.self !== window.top;
  
  if (!isInIframe) {
    return false;
  }
  
  // Check if the parent window is from Thinkific
  try {
    const parentHostname = window.parent.location.hostname;
    
    // Check if parent is Thinkific domain
    const isThinkificDomain = parentHostname.includes('thinkific.com') || 
                              parentHostname.includes('rvionline.thinkific.com');
    
    return isThinkificDomain;
  } catch (error) {
    // If we can't access parent origin due to same-origin policy, 
    // assume it's Thinkific if we're in an iframe
    return true;
  }
};

// Function to redirect or show error if not in Thinkific
export const enforceThinkificAccess = () => {
  if (isRunningInThinkific()) {
    return true; // Allow access
  }
  
  // If THINKIFIC_RESTRICTED is set but we're not in Thinkific, show error
  if (process.env.REACT_APP_THINKIFIC_RESTRICTED === '1') {
    return false; // Deny access
  }
  
  // If THINKIFIC_RESTRICTED is not set to 1, allow access anywhere
  return true;
};
