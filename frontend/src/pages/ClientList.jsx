import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function ClientList() {
  const [clients, setClients] = useState([]);
  const [error, setError] = useState(null);
  const { user, token, logout, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  if (loading) {
    return <div className="text-center mt-5">Cargando...</div>;
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  const isAdmin = user && user.rol.toLowerCase() === 'admin';

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/clients', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.status === 429) {
          setError('Demasiadas solicitudes. Por favor, intenta de nuevo más tarde.');
          return;
        }

        if (response.status === 401) {
          setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
          logout();
          navigate('/login');
          return;
        }

        const data = await response.json();
        if (response.ok) {
          setClients(data || []);
        } else {
          setError(data.message || 'Error al obtener los clientes.');
        }
      } catch (error) {
        setError('Error al obtener clientes: ' + error.message);
      }
    };

    if (token) {
      fetchClients();
    } else {
      navigate('/login');
    }
  }, [token, navigate, logout]);

  const getMenuPath = () => {
    if (!user) return '/login';
    return user.rol.toLowerCase() === 'admin' ? '/admin-menu' : '/employee-menu';
  };

  return (
    <div className="client-container">
      <div className="client-list">
        <h2 className="text-center mb-4">
          <i className="bi bi-people-fill me-2"></i>Lista de Clientes
        </h2>
        {error && (
          <div className="alert alert-danger d-flex align-items-center" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        )}
        {!error && clients.length === 0 ? (
          <p className="text-center">No hay clientes registrados.</p>
        ) : (
          clients.length > 0 && (
            <div className="table-responsive">
              <table className="table table-striped table-hover align-middle">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nombre</th>
                    <th>Correo Electrónico</th>
                    <th>Número</th>
                    <th>Género</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client, index) => (
                    <tr key={client.id}>
                      <td>{index + 1}</td>
                      <td>{client.nombre}</td>
                      <td>{client.email}</td>
                      <td>{client.numero}</td>
                      <td>
                        <span
                          className={`badge ${
                            client.genero === 'Masculino'
                              ? 'bg-primary'
                              : client.genero === 'Femenino'
                              ? 'bg-pink'
                              : 'bg-secondary'
                          }`}
                        >
                          {client.genero}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
        <div className="text-center mt-4 d-flex gap-2 justify-content-center">
          {isAdmin && (
            <button
              className="btn btn-primary"
              onClick={() => navigate('/client-register')}
            >
              <i className="bi bi-person-plus-fill me-2"></i>Registrar Nuevo Cliente
            </button>
          )}
          <button
            className="btn btn-secondary"
            onClick={() => navigate(getMenuPath())}
          >
            <i className="bi bi-arrow-left-circle me-2"></i>Volver al Menú
          </button>
        </div>
      </div>
    </div>
  );
}

export default ClientList;