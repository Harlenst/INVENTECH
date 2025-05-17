import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';


function AdminAttendance() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [fecha, setFecha] = useState('');
  const [estado, setEstado] = useState('presente');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }

        const data = await response.json();
        setUsers(data.filter(user => user.rol.toLowerCase() === 'employee')); // Solo empleados
      } catch (error) {
        setError('Error al cargar usuarios: ' + error.message);
      }
    };

    fetchUsers();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedUser || !fecha || !estado) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    try {
      const selectedUserData = users.find(user => user.id === parseInt(selectedUser));
      const token = localStorage.getItem('token');
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          usuario_id: selectedUser,
          nombre_empleado: selectedUserData.nombre,
          fecha,
          estado
        })
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      const result = await response.json();
      if (response.ok) {
        setSuccess('Asistencia registrada exitosamente');
        setSelectedUser('');
        setFecha('');
        setEstado('presente');
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Error al registrar asistencia: ' + error.message);
    }
  };

  return (
    <div className="client-container">
      <div className="client-box">
        <h2 className="text-center mb-4">
          <i className="bi bi-calendar-check-fill me-2"></i>Control de Asistencia
        </h2>
        {error && (
          <div className="alert alert-danger d-flex align-items-center" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        )}
        {success && (
          <div className="alert alert-success d-flex align-items-center" role="alert">
            <i className="bi bi-check-circle-fill me-2"></i>
            {success}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="usuario" className="form-label">
              <i className="bi bi-person-fill me-2"></i>Empleado
            </label>
            <select
              className="form-select"
              id="usuario"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              required
            >
              <option value="">Selecciona un empleado</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.nombre} {user.apellido}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label htmlFor="fecha" className="form-label">
              <i className="bi bi-calendar-fill me-2"></i>Fecha
            </label>
            <input
              type="date"
              className="form-control"
              id="fecha"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">
              <i className="bi bi-clock-fill me-2"></i>Estado
            </label>
            <div>
              <div className="form-check form-check-inline">
                <input
                  className="form-check-input"
                  type="radio"
                  name="estado"
                  id="presente"
                  value="presente"
                  checked={estado === 'presente'}
                  onChange={(e) => setEstado(e.target.value)}
                />
                <label className="form-check-label" htmlFor="presente">Presente</label>
              </div>
              <div className="form-check form-check-inline">
                <input
                  className="form-check-input"
                  type="radio"
                  name="estado"
                  id="ausente"
                  value="ausente"
                  checked={estado === 'ausente'}
                  onChange={(e) => setEstado(e.target.value)}
                />
                <label className="form-check-label" htmlFor="ausente">Ausente</label>
              </div>
              <div className="form-check form-check-inline">
                <input
                  className="form-check-input"
                  type="radio"
                  name="estado"
                  id="tarde"
                  value="tarde"
                  checked={estado === 'tarde'}
                  onChange={(e) => setEstado(e.target.value)}
                />
                <label className="form-check-label" htmlFor="tarde">Tarde</label>
              </div>
            </div>
          </div>
          <div className="d-flex gap-2">
            <button type="submit" className="btn btn-primary w-100">
              <i className="bi bi-check2-circle me-2"></i>Registrar Asistencia
            </button>
            <button
              type="button"
              className="btn btn-secondary w-100"
              onClick={() => navigate('/admin-menu')}
            >
              <i className="bi bi-arrow-left-circle me-2"></i>Volver
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminAttendance;