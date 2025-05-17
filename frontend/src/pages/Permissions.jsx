import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Permissions = () => {
  const { userId } = useParams();
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [permissions, setPermissions] = useState({ verEstadisticas: false, editarUsuarios: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || user.rol.toLowerCase() !== 'admin') {
      navigate('/login');
      return;
    }

    const fetchPermissions = async () => {
      try {
        const response = await fetch(`/api/user/${userId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });

        if (response.status === 401) {
          setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
          logout();
          navigate('/login');
          return;
        }

        if (!response.ok) throw new Error('Usuario no encontrado');
        const data = await response.json();
        setPermissions(JSON.parse(data.permisos || '{}'));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPermissions();
  }, [userId, user, navigate, logout]);

  const handleChange = (e) => {
    setPermissions({ ...permissions, [e.target.name]: e.target.checked });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/permissions/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(permissions),
      });

      if (response.status === 401) {
        logout();
        navigate('/login');
        return;
      }

      if (!response.ok) throw new Error('Error al actualizar permisos');
      alert('Permisos actualizados correctamente');
      navigate('/users-list');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <p className="text-white text-center">Cargando...</p>;
  if (error) return (
    <div className="client-container">
      <div className="client-list">
        <div className="alert alert-danger d-flex align-items-center" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      </div>
    </div>
  );

  return (
    <div className="client-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '40px 20px', backgroundColor: '#1C2526' }}>
      <div className="client-list" style={{ backgroundColor: '#ffffff', padding: '30px', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)', maxWidth: '800px', width: '100%' }}>
        <h2 className="text-center mb-4" style={{ color: '#333', fontFamily: 'Poppins, sans-serif', fontSize: '1.75rem', fontWeight: '700' }}>
          <i className="bi bi-shield-lock-fill me-2"></i>Gestionar Permisos
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                name="verEstadisticas"
                checked={permissions.verEstadisticas || false}
                onChange={handleChange}
                className="form-checkbox"
                style={{ marginRight: '0.5rem' }}
              />
              <span style={{ color: '#333', fontSize: '1rem' }}>Ver Estadísticas</span>
            </label>
          </div>
          <div>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                name="editarUsuarios"
                checked={permissions.editarUsuarios || false}
                onChange={handleChange}
                className="form-checkbox"
                style={{ marginRight: '0.5rem' }}
              />
              <span style={{ color: '#333', fontSize: '1rem' }}>Editar Usuarios</span>
            </label>
          </div>
          <div className="text-center mt-4 d-flex gap-2 justify-content-center">
            <button
              type="submit"
              className="btn btn-primary"
              style={{ backgroundColor: '#3498DB', border: 'none', padding: '0.75rem', fontWeight: '500', fontSize: '1rem', transition: 'background-color 0.3s ease, transform 0.2s ease' }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#2980B9')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = '#3498DB')}
            >
              <i className="bi bi-save me-2"></i>Guardar Permisos
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/users-list')}
              style={{ backgroundColor: '#6c757d', border: 'none', padding: '0.75rem', fontWeight: '500', fontSize: '1rem', transition: 'background-color 0.3s ease, transform 0.2s ease' }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#5a6268')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = '#6c757d')}
            >
              <i className="bi bi-arrow-left-circle me-2"></i>Volver
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Permissions;