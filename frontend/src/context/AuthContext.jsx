import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        setRetryCount(0);
        return;
      }

      try {
        const response = await fetch('http://localhost:3000/api/user', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 429) {
          if (retryCount < 3) {
            const delay = Math.pow(2, retryCount) * 1000;
            setTimeout(() => {
              setRetryCount(retryCount + 1);
              fetchUserData();
            }, delay);
            return;
          } else {
            throw new Error('Too many requests. Please try again later.');
          }
        }

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const data = await response.json();
        setUser(data);
        setRetryCount(0);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [token, retryCount]);

  const login = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
  };

  const logout = async () => {
    if (token) {
      try {
        await fetch('http://localhost:3000/api/attendance/exit', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error('Error al registrar salida:', error);
      }
    }

    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;