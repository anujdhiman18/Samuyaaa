import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('saumyaa_user') || localStorage.getItem('saumyaa_admin');
      return saved && saved !== 'undefined' ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    try {
      const t = localStorage.getItem('saumyaa_token');
      return t && t !== 'undefined' ? t : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem('saumyaa_token', token);
    } else {
      localStorage.removeItem('saumyaa_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('saumyaa_user', JSON.stringify(user));
      localStorage.setItem('saumyaa_admin', JSON.stringify(user));
    } else {
      localStorage.removeItem('saumyaa_user');
      localStorage.removeItem('saumyaa_admin');
    }
  }, [user]);

  const login = (userData, authToken) => {
    const normalizedUser = {
      ...userData,
      role: userData?.role || 'Admin',
    };
    setUser(normalizedUser);
    setToken(authToken);
  };

  const updateUser = (updatedData) => {
    setUser((prev) => ({ ...prev, ...updatedData }));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('saumyaa_token');
    localStorage.removeItem('saumyaa_user');
    localStorage.removeItem('saumyaa_admin');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        admin: user, // Alias for backwards compatibility
        token,
        isAuthenticated: !!token && !!user,
        login,
        updateUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
