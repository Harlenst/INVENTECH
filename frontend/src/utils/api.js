import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const useApi = () => {
  const { token, refreshToken, logout } = useContext(AuthContext);

  const fetchWithAuth = async (url, options = {}) => {
    const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`; // Soporta URLs relativas
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };

    const response = await fetch(fullUrl, { ...options, headers });
    if (response.status === 403) {
      const errorData = await response.json();
      if (errorData.expired) {
        try {
          const newToken = await refreshToken();
          // Reintentar la solicitud original con el nuevo token
          const retryResponse = await fetch(fullUrl, {
            ...options,
            headers: {
              ...headers,
              'Authorization': `Bearer ${newToken}`,
            },
          });

          const retryData = await retryResponse.json();
          if (!retryResponse.ok) {
            throw new Error(retryData.message || 'Error en la solicitud reintentada');
          }
          return retryData;
        } catch (error) {
          throw new Error('Sesión expirada y no se pudo refrescar el token.');
        }
      } else {
        throw new Error('Acceso denegado: Token inválido.');
      }
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Error en la solicitud');
    }
    return data;
  };

  return { fetchWithAuth };
};