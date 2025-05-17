import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function AttendanceHistory() {
  const { user } = useContext(AuthContext);
  const [attendances, setAttendances] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAttendances = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/attendance', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }

        const data = await response.json();
        setAttendances(data);
      } catch (error) {
        setError('Error al cargar historial de asistencias: ' + error.message);
      }
    };

    fetchAttendances();
  }, [navigate]);

  const handleConfirm = async (id, confirmado) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/attendance/${id}/confirm`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ confirmado }),
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      const result = await response.json();
      if (response.ok) {
        setAttendances(attendances.map(att =>
          att.id === id ? { ...att, confirmado } : att
        ));
        alert(result.message);
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Error al confirmar/rechazar asistencia: ' + error.message);
    }
  };

  const getMenuPath = () => {
    if (!user) return '/login';
    return user.rol.toLowerCase() === 'admin' ? '/admin-menu' : '/employee-menu';
  };

  return (
    <div className="client-container">
      <div className="client-list">
        <h2 className="text-center mb-4">
          <i className="bi bi-clock-history me-2"></i>Historial de Asistencias
        </h2>
        {error && (
          <div className="alert alert-danger d-flex align-items-center" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        )}
        {attendances.length === 0 ? (
          <p className="text-center">No hay asistencias registradas.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped table-hover align-middle">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Empleado</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Hora Entrada</th>
                  <th>Hora Salida</th>
                  <th>Confirmado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {attendances.map((attendance, index) => (
                  <tr key={attendance.id}>
                    <td>{index + 1}</td>
                    <td>{attendance.nombre_empleado}</td>
                    <td>{attendance.fecha}</td>
                    <td>
                      <span
                        className={`badge ${
                          attendance.estado === 'presente'
                            ? 'bg-success'
                            : attendance.estado === 'ausente'
                            ? 'bg-danger'
                            : 'bg-warning'
                        }`}
                      >
                        {attendance.estado}
                      </span>
                    </td>
                    <td>{attendance.hora_entrada || 'No registrado'}</td>
                    <td>{attendance.hora_salida || 'No registrado'}</td>
                    <td>{attendance.confirmado ? 'Sí' : 'No'}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-success me-2"
                        onClick={() => handleConfirm(attendance.id, true)}
                        disabled={attendance.confirmado}
                      >
                        <i className="bi bi-check-circle me-1"></i>Confirmar
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleConfirm(attendance.id, false)}
                        disabled={!attendance.confirmado}
                      >
                        <i className="bi bi-x-circle me-1"></i>Rechazar
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

export default AttendanceHistory;