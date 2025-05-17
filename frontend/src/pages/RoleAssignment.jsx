import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';


function RoleAssignment() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const { token, user, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  // Depuración: Verificar el estado de loading y user
  console.log('Estado de loading:', loading);
  console.log('Usuario autenticado en RoleAssignment:', user);
  console.log('Rol del usuario:', user?.rol);
  console.log('Condición de rol:', user?.rol?.toLowerCase() === 'admin');

  // No renderizar mientras se está cargando
  if (loading) {
    return <div className="text-center mt-5">Cargando...</div>;
  }

  // Verificar si el usuario es Admin (insensible a mayúsculas)
  const isAdmin = user && user.rol && user.rol.toLowerCase() === 'admin';
  if (!isAdmin) {
    console.log('Acceso denegado - Rol del usuario:', user?.rol);
    return (
      <div className="text-center mt-5">
        <h4 className="text-danger">Acceso denegado: Se requiere rol de Admin</h4>
      </div>
    );
  }

  // Cargar la lista de usuarios
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        console.log('Haciendo solicitud a /api/users con token:', token);
        const response = await fetch('http://localhost:3000/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        console.log('Respuesta de /api/users:', response.status);
        if (response.status === 403) {
          setError('Acceso denegado: Se requiere rol de Admin');
          return;
        }

        const data = await response.json();
        console.log('Datos de /api/users:', data);
        if (response.ok) {
          // Filtrar para excluir al usuario autenticado
          const filteredUsers = data.filter(u => u.id !== user.id);
          setUsers(filteredUsers);
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError('Error al cargar la lista de usuarios: ' + err.message);
      }
    };

    if (token) {
      fetchUsers();
    }
  }, [token, user]);

  // Estado para manejar los roles seleccionados temporalmente
  const [selectedRoles, setSelectedRoles] = useState({});

  // Manejar el cambio temporal del rol
  const handleRoleSelect = (userId, newRole) => {
    setSelectedRoles(prev => ({
      ...prev,
      [userId]: newRole,
    }));
  };

  // Manejar la asignación de rol
  const handleRoleChange = async (userId) => {
    const newRole = selectedRoles[userId];
    if (!newRole || newRole === users.find(u => u.id === userId).rol) {
      alert('No se han realizado cambios en el rol.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/user/role/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ rol: newRole }),
      });

      const data = await response.json();
      if (response.ok) {
        // Actualizar la lista de usuarios localmente
        setUsers(users.map(u =>
          u.id === userId ? { ...u, rol: newRole } : u
        ));
        // Limpiar el rol seleccionado para este usuario
        setSelectedRoles(prev => {
          const updated = { ...prev };
          delete updated[userId];
          return updated;
        });
        alert('Rol asignado correctamente');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Error al asignar rol: ' + err.message);
    }
  };

    // Determinar la URL del menú según el rol del usuario
    const getMenuPath = () => {
      if (!user) return '/login'; // Redirige a login si no hay usuario
      return user.rol.toLowerCase() === 'admin' ? '/admin-menu' : '/employee-menu';
    };
  

  return (
    <div className="client-container">
      <div className="client-list">
        <h2 className="text-center mb-4">
          <i className="bi bi-person-gear me-2"></i>Asignación de Roles
        </h2>
        {error && (
          <div className="alert alert-danger d-flex align-items-center" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        )}
        {users.length === 0 ? (
          <p className="text-center">No hay usuarios registrados.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped table-hover align-middle">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre</th>
                  <th>Apellido</th>
                  <th>Email</th>
                  <th>Usuario</th>
                  <th>Rol Actual</th>
                  <th>Nuevo Rol</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, index) => (
                  <tr key={u.id}>
                    <td>{index + 1}</td>
                    <td>{u.nombre}</td>
                    <td>{u.apellido}</td>
                    <td>{u.email}</td>
                    <td>{u.usuario}</td>
                    <td>
                      <span
                        className={`badge ${
                          u.rol.toLowerCase() === 'admin' ? 'bg-success' : 'bg-primary'
                        }`}
                      >
                        {u.rol}
                      </span>
                    </td>
                    <td>
                      <select
                        value={selectedRoles[u.id] || u.rol}
                        onChange={(e) => handleRoleSelect(u.id, e.target.value)}
                        className="form-select"
                        style={{ width: '150px' }}
                      >
                        <option value="Admin">Admin</option>
                        <option value="Employee">Employee</option>
                      </select>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => handleRoleChange(u.id)}
                        disabled={!selectedRoles[u.id] || selectedRoles[u.id] === u.rol}
                      >
                        <i className="bi bi-check2-circle me-1"></i>Guardar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="text-center mt-4">
          <button
            className="btn btn-primary"
            onClick={() => navigate(getMenuPath())}
          >
            <i className="bi bi-arrow-left-circle me-2"></i>Volver al Menú de Admin
          </button>
        </div>
      </div>
    </div>
  );
}

export default RoleAssignment;