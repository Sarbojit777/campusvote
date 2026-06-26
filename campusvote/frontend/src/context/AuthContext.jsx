import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axiosInstance';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedAdmin = localStorage.getItem('admin');
    const accessToken = localStorage.getItem('accessToken');

    if (accessToken) {
      if (storedUser) {
        try { setUser(JSON.parse(storedUser)); } catch {}
      }
      if (storedAdmin) {
        try { setAdmin(JSON.parse(storedAdmin)); } catch {}
      }
    }
    setLoading(false);
  }, []);

  const loginStudent = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.removeItem('admin');
    setUser(data.user);
    setAdmin(null);
    return data;
  };

  const loginAdmin = async (email, password) => {
    const { data } = await api.post('/auth/admin/login', { email, password });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('admin', JSON.stringify(data.admin));
    localStorage.removeItem('user');
    setAdmin(data.admin);
    setUser(null);
    return data;
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ user, admin, loading, loginStudent, loginAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
