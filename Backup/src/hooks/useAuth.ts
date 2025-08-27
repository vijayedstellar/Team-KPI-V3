import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import type { AdminUser } from '../lib/supabase';
import toast from 'react-hot-toast';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const authStatus = localStorage.getItem('isAuthenticated');
    const userEmail = localStorage.getItem('userEmail');
    
    if (authStatus === 'true' && userEmail) {
      // Verify user still exists and is active
      const user = await authService.getAdminByEmail(userEmail);
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
      } else {
        // User no longer exists or is inactive, logout
        logout();
      }
    }
    setLoading(false);
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('Login attempt for:', email);
      const user = await authService.verifyAdminCredentials(email, password);
      console.log('Login result:', user ? 'Success' : 'Failed');
      if (user) {
        console.log('Setting authentication state to true');
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userEmail', user.email);
        localStorage.setItem('userName', user.name);
        setCurrentUser(user);
        setIsAuthenticated(true);
        
        // Force a longer delay and multiple state updates to ensure persistence
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Double-check authentication state
        const authCheck = localStorage.getItem('isAuthenticated');
        console.log('Post-login auth check:', authCheck);
        
        if (authCheck === 'true') {
          console.log('Authentication successfully persisted');
          // Force a re-render by updating state again
          setIsAuthenticated(true);
          return true;
        } else {
          console.error('Authentication failed to persist');
          toast.error('Login failed to persist. Please try again.');
          return false;
        }
      }
      console.log('Login failed - no user returned');
      toast.error('Invalid credentials');
      return false;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed due to an error');
      return false;
    }
  };

  const logout = () => {
    console.log('Logout function called - clearing session data');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    setCurrentUser(null);
    setIsAuthenticated(false);
    
    // Force immediate state update and page refresh
    setTimeout(() => {
      console.log('Forcing page refresh after logout');
      window.location.reload();
    }, 100);
    
    console.log('Logout completed - user should be redirected to login');
  };

  const getUserEmail = () => {
    return currentUser?.email || localStorage.getItem('userEmail');
  };

  const getUserName = () => {
    return currentUser?.name || 'Admin';
  };

  return {
    isAuthenticated,
    currentUser,
    loading,
    login,
    logout,
    getUserEmail,
    getUserName
  };
};