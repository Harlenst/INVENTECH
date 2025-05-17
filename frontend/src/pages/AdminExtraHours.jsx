import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function AdminExtraHours() {
  const { user } = useContext(AuthContext);
  const [extraHours, setExtraHours] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      setError('Error al cargar usuarios: ' + error.message);
    }
  };

  const fetchExtraHours = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (selectedUser) params.append('usuario_id', selectedUser);

      const response = await fetch(`/api/attendance/admin/extra-hours?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error al cargar horas extras');
      }
      setExtraHours(data);
      setError(null);
    } catch (error) {
      setError('Error al cargar horas extras: ' + error.message);
    }
  };

  useEffect(() => {
    if (user && user.rol.toLowerCase() === 'admin') {
      fetchUsers();
      fetchExtraHours();
    } else {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchExtraHours();
  };

  return (
    <div className="client-container">
      <div className="client-list">
        <h2 className="text-center mb-4">
          <i className="bi bi-clock-fill me-2"></i>Horas Extras de Empleados
        </h2>
        <form onSubmit={handleFilter} className="mb-4">
          <div className="row g-3 justify-content-center">
            <div className="col-md-3">
              <label htmlFor="startDate" className="form-label">Fecha Inicio</label>
              <input
                type="date"
                id="startDate"
                className="form-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label htmlFor="endDate" className="form-label">Fecha Fin</label>
              <input
                type="date"
                id="endDate"
                className="form-control"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label htmlFor="selectedUser" className="form-label">Empleado</label>
              <select
                id="selectedUser"
                className="form-select"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                <option value="">Todos</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre} {u.apellido}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button type="submit" className="btn btn-primary w-100">
                Filtrar
              </button>
            </div>
          </div>
        </form>
        {error && (
          <div className="alert alert-danger d-flex align-items-center" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        )}
        {extraHours.length === 0 ? (
          <p className="text-center">No hay horas extras registradas.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped table-hover align-middle">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Empleado</th>
                  <th>Fecha</th>
                  <th>Horas Extras</th>
                  <th>Descripción</th>
                </tr>
              </thead>
              <tbody>
                {extraHours.map((extra, index) => (
                  <tr key={extra.id}>
                    <td>{index + 1}</td>
                    <td>{extra.nombre_empleado}</td>
                    <td>{extra.fecha}</td>
                    <td>{extra.horas.toFixed(2)}</td>
                    <td>{extra.descripcion || 'Sin descripción'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="text-center mt-4">
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/admin-menu')}
          >
            <i className="bi bi-arrow-left-circle me-2"></i>Volver al Menú
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminExtraHours;