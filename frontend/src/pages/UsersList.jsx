import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const UsersList = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || user.rol.toLowerCase() !== 'admin') {
      navigate('/login');
      return;
    }

    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (response.status === 401) {
          setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
          logout();
          navigate('/login');
          return;
        }

        if (!response.ok) throw new Error('Error al obtener usuarios');
        const data = await response.json();
        setUsers(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [user, navigate, logout]);

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
      <div className="client-list" style={{ backgroundColor: '#ffffff', padding: '30px', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)', maxWidth: '1200px', width: '100%' }}>
        <h2 className="text-center mb-4" style={{ color: '#333', fontFamily: 'Poppins, sans-serif', fontSize: '1.75rem', fontWeight: '700' }}>
          <i className="bi bi-people-fill me-2"></i>Lista de Usuarios
        </h2>
        {!error && users.length === 0 ? (
          <p className="text-center" style={{ color: '#333' }}>No hay usuarios registrados.</p>
        ) : (
          users.length > 0 && (
            <div className="table-responsive">
              <table className="table table-striped table-hover align-middle">
                <thead>
                  <tr>
                    <th style={{ backgroundColor: '#646cff', color: '#ffffff', border: 'none', padding: '1rem' }}>#</th>
                    <th style={{ backgroundColor: '#646cff', color: '#ffffff', border: 'none', padding: '1rem' }}>Nombre</th>
                    <th style={{ backgroundColor: '#646cff', color: '#ffffff', border: 'none', padding: '1rem' }}>Apellido</th>
                    <th style={{ backgroundColor: '#646cff', color: '#ffffff', border: 'none', padding: '1rem' }}>Email</th>
                    <th style={{ backgroundColor: '#646cff', color: '#ffffff', border: 'none', padding: '1rem' }}>Rol</th>
                    <th style={{ backgroundColor: '#646cff', color: '#ffffff', border: 'none', padding: '1rem' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr key={user.id}>
                      <td style={{ padding: '1rem', fontSize: '1rem' }}>{index + 1}</td>
                      <td style={{ padding: '1rem', fontSize: '1rem' }}>{user.nombre}</td>
                      <td style={{ padding: '1rem', fontSize: '1rem' }}>{user.apellido}</td>
                      <td style={{ padding: '1rem', fontSize: '1rem' }}>{user.email}</td>
                      <td style={{ padding: '1rem', fontSize: '1rem' }}>{user.rol}</td>
                      <td style={{ padding: '1rem', fontSize: '1rem' }}>
                        <Link
                          to={`/user-edit/${user.id}`}
                          className="btn btn-primary btn-sm me-2"
                          style={{ backgroundColor: '#3498DB', border: 'none', padding: '0.5rem', fontWeight: '500', transition: 'background-color 0.3s ease' }}
                          onMouseEnter={(e) => (e.target.style.backgroundColor = '#2980B9')}
                          onMouseLeave={(e) => (e.target.style.backgroundColor = '#3498DB')}
                        >
                          <i className="bi bi-pencil-fill me-1"></i>Editar
                        </Link>
                        <Link
                          to={`/user-delete/${user.id}`}
                          className="btn btn-danger btn-sm me-2"
                          style={{ backgroundColor: '#dc3545', border: 'none', padding: '0.5rem', fontWeight: '500', transition: 'background-color 0.3s ease' }}
                          onMouseEnter={(e) => (e.target.style.backgroundColor = '#c82333')}
                          onMouseLeave={(e) => (e.target.style.backgroundColor = '#dc3545')}
                        >
                          <i className="bi bi-trash-fill me-1"></i>Eliminar
                        </Link>
                        <Link
                          to={`/permissions/${user.id}`}
                          className="btn btn-warning btn-sm"
                          style={{ backgroundColor: '#ffc107', color: '#212529', border: 'none', padding: '0.5rem', fontWeight: '500', transition: 'background-color 0.3s ease' }}
                          onMouseEnter={(e) => (e.target.style.backgroundColor = '#e0a800')}
                          onMouseLeave={(e) => (e.target.style.backgroundColor = '#ffc107')}
                        >
                          <i className="bi bi-shield-lock-fill me-1"></i>Permisos
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
        <div className="text-center mt-4 d-flex gap-2 justify-content-center">
          <Link
            to="/admin-menu"
            className="btn btn-secondary"
            style={{ backgroundColor: '#6c757d', border: 'none', padding: '0.75rem', fontWeight: '500', fontSize: '1rem', transition: 'background-color 0.3s ease, transform 0.2s ease' }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = '#5a6268')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = '#6c757d')}
          >
            <i className="bi bi-arrow-left-circle me-2"></i>Volver al Menú
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UsersList;