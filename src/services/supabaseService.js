import { supabase } from '../config/supabaseClient';
import { format } from 'date-fns';

export const supabaseService = {
  // Create user from EntraID if doesn't exist
  async upsertUser(userData) {
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', userData.email)
        .maybeSingle();

      if (existingUser) {
        // User already exists, just return it
        return existingUser;
      }

      // User doesn't exist, create new one
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          project: userData.project || null,
          avatar_url: userData.avatar_url || null,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Get all time off requests for a date range
  async getTimeOffRequests(startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('time_off_requests')
        .select(`
          *,
          user:user_id(id, name, email, project)
        `)
        .gte('start_date', startDate)
        .lte('end_date', endDate)
        .order('start_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      return [];
    }
  },

  // Create a new time off request with smart date range grouping
  async createTimeOffRequest(userId, dates, type = 'vacation', notes = '') {
    try {
      // Sort dates
      const sortedDates = [...dates].sort();
      
      // Group consecutive dates into ranges
      const ranges = [];
      let currentRange = null;
      
      for (const dateStr of sortedDates) {
        const date = new Date(dateStr);
        
        if (!currentRange) {
          // Start a new range
          currentRange = { start: dateStr, end: dateStr, startDate: date };
        } else {
          // Check if this date is consecutive (next day)
          const lastDate = new Date(currentRange.end);
          const daysDiff = Math.round((date - lastDate) / (1000 * 60 * 60 * 24));
          
          if (daysDiff === 1) {
            // Consecutive day, extend the range
            currentRange.end = dateStr;
          } else {
            // Non-consecutive, save current range and start new one
            ranges.push(currentRange);
            currentRange = { start: dateStr, end: dateStr, startDate: date };
          }
        }
      }
      
      // Don't forget the last range
      if (currentRange) {
        ranges.push(currentRange);
      }
      
      // Create one request per range
      const requests = ranges.map(range => ({
        user_id: userId,
        start_date: range.start,
        end_date: range.end,
        type: type,
        status: 'pending',
        notes: notes
      }));

      const { data, error } = await supabase
        .from('time_off_requests')
        .insert(requests)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Update a time off request
  async updateTimeOffRequest(id, updates) {
    try {
      const { data, error } = await supabase
        .from('time_off_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Delete a time off request (only if pending)
  async deleteTimeOffRequest(id) {
    try {
      const { error } = await supabase
        .from('time_off_requests')
        .delete()
        .eq('id', id)
        .eq('status', 'pending');

      if (error) throw error;
      return true;
    } catch (error) {
      throw error;
    }
  },

  // Get holidays for a year
  async getHolidays(year) {
    try {
      const { data, error } = await supabase
        .from('holidays')
        .select('*')
        .eq('year', year)
        .eq('is_active', true)
        .order('date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      return [];
    }
  },

  // Get company settings
  async getCompanySettings() {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*');

      if (error) throw error;
      
      // Convert to key-value object
      const settings = {};
      data?.forEach(setting => {
        settings[setting.setting_key] = setting.setting_value;
      });
      
      return settings;
    } catch (error) {
      return {};
    }
  },

  // Get all time off requests (for admin)
  async getAllTimeOffRequests() {
    try {
      const { data, error } = await supabase
        .from('time_off_requests')
        .select(`
          *,
          user:user_id(id, name, email, project)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      return [];
    }
  },

  // Update time off request status (approve/reject)
  async updateTimeOffRequestStatus(requestId, status, approverId, notes = '') {
    try {
      const updateData = {
        status: status,
        approved_by: approverId,
        approved_at: new Date().toISOString()
      };

      // If there are notes, append them to existing notes
      if (notes) {
        updateData.notes = notes;
      }

      const { data, error } = await supabase
        .from('time_off_requests')
        .update(updateData)
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Update company settings
  async updateCompanySettings(settings, userId) {
    try {
      
      // Update each setting individually
      for (const [key, value] of Object.entries(settings)) {
        
        const { data, error } = await supabase
          .from('company_settings')
          .update({
            setting_value: value,
            updated_by: userId
          })
          .eq('setting_key', key)
          .select();

        if (error) {
          throw error;
        }
      }

      return true;
    } catch (error) {
      throw error;
    }
  }
};