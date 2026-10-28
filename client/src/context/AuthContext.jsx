import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('cms_token') || null);
  const [profile, setProfile] = useState(null);
  const [mess, setMess] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user data on startup if token exists
  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        setUser(res.data.user);
        if (res.data.profile) setProfile(res.data.profile);
        if (res.data.mess) setMess(res.data.mess);
      } catch (err) {
        console.error('Failed to load user session', err);
        logout();
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('cms_token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    if (res.data.profile) setProfile(res.data.profile);
    if (res.data.mess) setMess(res.data.mess);
    return res.data;
  };

  const registerStudent = async (formData) => {
    const res = await api.post('/auth/register-student', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    localStorage.setItem('cms_token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    if (res.data.profile) setProfile(res.data.profile);
    return res.data;
  };

  const registerVendor = async (vendorData) => {
    const res = await api.post('/auth/register-vendor', vendorData);
    localStorage.setItem('cms_token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    if (res.data.mess) setMess(res.data.mess);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('cms_token');
    setToken(null);
    setUser(null);
    setProfile(null);
    setMess(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
      if (res.data.profile) setProfile(res.data.profile);
      if (res.data.mess) setMess(res.data.mess);
    } catch (err) {
      console.error('Failed to refresh user', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        profile,
        mess,
        loading,
        login,
        registerStudent,
        registerVendor,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

