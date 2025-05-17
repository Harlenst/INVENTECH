import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const UserEdit = () => {
  const { userId } = useParams();
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || user.rol.toLowerCase() !== 'admin') {
      navigate('/login');
      return;
    }

    const fetchUser = async () => {
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
        setUserData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId, user, navigate, logout]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/user/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(userData),
      });

      if (response.status === 401) {
        logout();
        navigate('/login');
        return;
      }

      if (!response.ok) throw new Error('Error al actualizar usuario');
      alert('Usuario actualizado correctamente');
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
  if (!userData) return (
    <div className="client-container">
      <div className="client-list">
        <p className="text-center" style={{ color: '#333' }}>Usuario no encontrado</p>
      </div>
    </div>
  );

  return (
    <div className="client-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '40px 20px', backgroundColor: '#1C2526' }}>
      <div className="client-list" style={{ backgroundColor: '#ffffff', padding: '30px', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)', maxWidth: '800px', width: '100%' }}>
        <h2 className="text-center mb-4" style={{ color: '#333', fontFamily: 'Poppins, sans-serif', fontSize: '1.75rem', fontWeight: '700' }}>
          <i className="bi bi-pencil-fill me-2"></i>Editar Usuario
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block" style={{ color: '#333', fontSize: '1rem' }}>Nombre</label>
            <input
              type="text"
              value={userData.nombre || ''}
              onChange={(e) => setUserData({ ...userData, nombre: e.target.value })}
              className="form-control"
              style={{ backgroundColor: '#f8f9fa', border: '1px solid #ced4da', color: '#333', padding: '0.75rem' }}
            />
          </div>
          <div>
            <label className="block" style={{ color: '#333', fontSize: '1rem' }}>Apellido</label>
            <input
              type="text"
              value={userData.apellido || ''}
              onChange={(e) => setUserData({ ...userData, apellido: e.target.value })}
              className="form-control"
              style={{ backgroundColor: '#f8f9fa', border: '1px solid #ced4da', color: '#333', padding: '0.75rem' }}
            />
          </div>
          <div>
            <label className="block" style={{ color: '#333', fontSize: '1rem' }}>Email</label>
            <input
              type="email"
              value={userData.email || ''}
              onChange={(e) => setUserData({ ...userData, email: e.target.value })}
              className="form-control"
              style={{ backgroundColor: '#f8f9fa', border: '1px solid #ced4da', color: '#333', padding: '0.75rem' }}
            />
          </div>
          <div className="text-center mt-4 d-flex gap-2 justify-content-center">
            <button
              type="submit"
              className="btn btn-primary"
              style={{ backgroundColor: '#3498DB', border: 'none', padding: '0.75rem', fontWeight: '500', fontSize: '1rem', transition: 'background-color 0.3s ease, transform 0.2s ease' }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#2980B9')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = '#3498DB')}
            >
              <i className="bi bi-save me-2"></i>Guardar
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

export default UserEdit;