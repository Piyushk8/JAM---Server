// Using qs package (commonly used with Express)
// Install: pnpm add qs @types/qs
import qs from 'qs';

export function parseCookiesWithQs(cookieString: string): Record<string, string> {
  if (!cookieString) return {};
  
  // Convert cookie string to query string format
  const queryString = cookieString.replace(/;\s*/g, '&');
  return qs.parse(queryString) as Record<string, string>;
}

// Alternative manual approach with better error handling
function parseCookiesSafe(cookieString: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  
  if (!cookieString || typeof cookieString !== 'string') {
    return cookies;
  }

  try {
    cookieString.split(';').forEach(cookie => {
      const trimmed = cookie.trim();
      const equalIndex = trimmed.indexOf('=');
      
      if (equalIndex > 0) {
        const name = trimmed.substring(0, equalIndex).trim();
        const value = trimmed.substring(equalIndex + 1).trim();
        
        if (name && value) {
          try {
            cookies[name] = decodeURIComponent(value);
          } catch {
            cookies[name] = value; // Fallback if decoding fails
          }
        }
      }
    });
  } catch (error) {
    console.error('Cookie parsing error:', error);
  }

  return cookies;
}