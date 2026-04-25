import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for existing session
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('junglyst_token');
        const savedUser = localStorage.getItem('junglyst_user');
        
        if (token && savedUser) {
          setUser(JSON.parse(savedUser));
          // Optionally verify token with backend
          // const res = await api.get('/auth/me/');
          // setUser(res.data);
        }
      } catch (error) {
        console.error("Auth hydration failed:", error);
        localStorage.removeItem('junglyst_user');
        localStorage.removeItem('junglyst_token');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const response = await api.post('/core/login/', {
        email: credentials.email, // backend expects 'email' key because USERNAME_FIELD = 'email'
        password: credentials.password
      });

      const { access, refresh, user: userInfo } = response.data;

      localStorage.setItem('junglyst_token', access);
      localStorage.setItem('junglyst_refresh', refresh);
      localStorage.setItem('junglyst_user', JSON.stringify(userInfo));
      
      setUser(userInfo);
      return userInfo;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      // Basic slugify-like logic for username
      const safeUsername = (userData.username || userData.email.split('@')[0])
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '');

      const response = await api.post('/core/register/', {
        email: userData.email,
        username: safeUsername,
        password: userData.password,
        phone: userData.phone,
        role: userData.role || 'collector'
      });

      // Auto-login after registration
      return await login({ email: userData.email, password: userData.password });
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithOTP = async (phone) => {
    // Mock OTP logic remains for now if backend doesn't support it yet
    setLoading(true);
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockUser = {
          id: 1,
          full_name: 'Nursery Partner',
          phone: phone,
          isAdmin: false,
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=growth'
        };
        setUser(mockUser);
        localStorage.setItem('junglyst_user', JSON.stringify(mockUser));
        setLoading(false);
        resolve(mockUser);
      }, 1000);
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('junglyst_user');
    localStorage.removeItem('junglyst_token');
    localStorage.removeItem('junglyst_refresh');
    localStorage.removeItem('junglyst_auth_token'); // Clean up any old naming
  };

  const updateUser = (updatedInfo) => {
    const newUser = { ...user, ...updatedInfo };
    setUser(newUser);
    localStorage.setItem('junglyst_user', JSON.stringify(newUser));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithOTP, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
