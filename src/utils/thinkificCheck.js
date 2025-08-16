// Utility function to check if the app is running inside Thinkific iframe
export const isRunningInThinkific = () => {
  // Check if RUN_ON_THINKIFIC environment variable is set to true
  const runOnThinkific = process.env.REACT_APP_RUN_ON_THINKIFIC === 'TRUE';
  
  if (!runOnThinkific) {
    // If RUN_ON_THINKIFIC is false, allow access outside Thinkific
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
  
  // If RUN_ON_THINKIFIC is true but we're not in Thinkific, show error
  if (process.env.REACT_APP_RUN_ON_THINKIFIC === 'TRUE') {
    return false; // Deny access
  }
  
  // If RUN_ON_THINKIFIC is false, allow access anywhere
  return true;
};
