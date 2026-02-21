// Admin utility functions
import { supabase } from '../config/supabaseClient';

let cachedAdminEmails = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get list of admin emails from database (with caching)
 * @returns {Promise<string[]>} Array of admin email addresses
 */
export const getAdminEmails = async () => {
  // Return cached value if still valid
  if (cachedAdminEmails && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
    return cachedAdminEmails;
  }

  try {
    const { data, error } = await supabase
      .from('company_settings')
      .select('setting_value')
      .eq('setting_key', 'admin_emails')
      .single();

    if (error) throw error;

    // Parse JSONB array from database
    const adminEmails = data?.setting_value || [];
    
    // Cache the result
    cachedAdminEmails = adminEmails;
    cacheTimestamp = Date.now();
    
    return adminEmails;
  } catch (error) {
    // Fallback to environment variable if database fails
    const adminEmailsEnv = import.meta.env.VITE_ADMIN_EMAILS || '';
    return adminEmailsEnv
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0);
  }
};

/**
 * Check if a user is an admin
 * @param {Object} user - User object with email property
 * @returns {Promise<boolean>} True if user is admin
 */
export const isUserAdmin = async (user) => {
  if (!user || !user.email) {
    return false;
  }

  const adminEmails = await getAdminEmails();
  
  // Check if user email is in admin list or contains 'admin'
  return user.email.toLowerCase().includes('admin') || 
         adminEmails.includes(user.email);
};

/**
 * Clear the admin emails cache (useful after updating settings)
 */
export const clearAdminCache = () => {
  cachedAdminEmails = null;
  cacheTimestamp = null;
};

