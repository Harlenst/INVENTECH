import React, { useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function AutoAttendance() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Registrar entrada al cargar el componente
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const registerEntry = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch('/api/attendance/entry', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }

        if (!response.ok) {
          console.warn('Entrada no registrada:', await response.json());
        }
      } catch (error) {
        console.error('Error al registrar entrada:', error);
      }
    };

    registerEntry();
  }, [user, navigate]);

  // Registrar salida al salir de la página o cerrar sesión
  useEffect(() => {
    if (!user) return;

    const registerExit = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('/api/attendance/exit', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.status === 401 || response.status === 403) {
          return;
        }

        if (!response.ok) {
          console.warn('Salida no registrada:', await response.json());
        }
      } catch (error) {
        console.error('Error al registrar salida:', error);
      }
    };

    const handleBeforeUnload = (event) => {
      registerExit();
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      registerExit();
    };
  }, [user]);

  // Este componente no necesita renderizar nada, ya que es solo para lógica de fondo
  return null;
}

export default AutoAttendance;