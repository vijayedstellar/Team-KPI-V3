import { supabase } from '../lib/supabase';
import type { AdminUser } from '../lib/supabase';

export const authService = {
  async verifyAdminCredentials(email: string, password: string): Promise<AdminUser | null> {
    try {
      console.log('Attempting to verify credentials for:', email.trim());
      
      // For production deployment without Supabase, use hardcoded credentials
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        console.log('No Supabase config found, using hardcoded credentials');
        if (email.trim() === 'vijay@edstellar.com' && password.trim() === 'Edstellar@2025') {
          return {
            id: 'hardcoded-admin-id',
            email: 'vijay@edstellar.com',
            password_hash: 'Edstellar@2025',
            name: 'Vijay',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }
        return null;
      }
      
      try {
        // Trim inputs to avoid whitespace issues
        const trimmedEmail = email.trim();
        const trimmedPassword = password.trim();
        
        console.log('Querying Supabase for user:', trimmedEmail);
        
        const { data, error } = await supabase
          .from('admin_users')
          .select('*')
          .eq('email', trimmedEmail)
          .eq('password_hash', trimmedPassword)
          .eq('is_active', true)
          .maybeSingle(); // Use maybeSingle() instead of single() to avoid errors when no rows found
        
        console.log('Auth query result:', { data, error });
        
        if (error) {
          console.log('Supabase query error:', error.message);
          // Fallback to hardcoded credentials if query fails
          if (trimmedEmail === 'vijay@edstellar.com' && trimmedPassword === 'Edstellar@2025') {
            return {
              id: 'hardcoded-admin-id',
              email: 'vijay@edstellar.com',
              password_hash: 'Edstellar@2025',
              name: 'Vijay',
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
          }
          return null;
        }
        
        if (!data) {
          console.log('No user found in Supabase, checking hardcoded credentials');
          // Fallback to hardcoded credentials if Supabase fails
          if (trimmedEmail === 'vijay@edstellar.com' && trimmedPassword === 'Edstellar@2025') {
            return {
              id: 'hardcoded-admin-id',
              email: 'vijay@edstellar.com',
              password_hash: 'Edstellar@2025',
              name: 'Vijay',
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
          }
          return null;
        }
        
        console.log('Supabase authentication successful');
        return data;
      } catch (supabaseError) {
        console.log('Supabase query failed, falling back to hardcoded credentials:', supabaseError);
        // Fallback to hardcoded credentials if Supabase query fails
        if (email.trim() === 'vijay@edstellar.com' && password.trim() === 'Edstellar@2025') {
          return {
            id: 'hardcoded-admin-id',
            email: 'vijay@edstellar.com',
            password_hash: 'Edstellar@2025',
            name: 'Vijay',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }
        return null;
      }
    } catch (error) {
      console.error('Error verifying credentials:', error);
      return null;
    }
  },

  async getAdminByEmail(email: string): Promise<AdminUser | null> {
    try {
      // For production deployment without Supabase, use hardcoded credentials
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        if (email.trim() === 'vijay@edstellar.com') {
          return {
            id: 'hardcoded-admin-id',
            email: 'vijay@edstellar.com',
            password_hash: 'Edstellar@2025',
            name: 'Vijay',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }
        return null;
      }
      
      try {
        const trimmedEmail = email.trim();
        
        const { data, error } = await supabase
          .from('admin_users')
          .select('*')
          .eq('email', trimmedEmail)
          .eq('is_active', true)
          .maybeSingle();
        
        if (error) {
          console.log('Supabase query error in getAdminByEmail:', error.message);
          // Fallback to hardcoded credentials if Supabase fails
          if (trimmedEmail === 'vijay@edstellar.com') {
            return {
              id: 'hardcoded-admin-id',
              email: 'vijay@edstellar.com',
              password_hash: 'Edstellar@2025',
              name: 'Vijay',
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
          }
          return null;
        }
        
        if (!data) {
          // Fallback to hardcoded credentials if Supabase fails
          if (trimmedEmail === 'vijay@edstellar.com') {
            return {
              id: 'hardcoded-admin-id',
              email: 'vijay@edstellar.com',
              password_hash: 'Edstellar@2025',
              name: 'Vijay',
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
          }
          return null;
        }
        
        return data;
      } catch (supabaseError) {
        console.log('Supabase query failed, falling back to hardcoded credentials:', supabaseError);
        // Fallback to hardcoded credentials if Supabase query fails
        if (email.trim() === 'vijay@edstellar.com') {
          return {
            id: 'hardcoded-admin-id',
            email: 'vijay@edstellar.com',
            password_hash: 'Edstellar@2025',
            name: 'Vijay',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }
        return null;
      }
    } catch (error) {
      console.error('Error getting admin user:', error);
      return null;
    }
  },

  async updateAdminPassword(id: string, newPassword: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('admin_users')
        .update({ password_hash: newPassword })
        .eq('id', id);
      
      return !error;
    } catch (error) {
      console.error('Error updating password:', error);
      return false;
    }
  }
};