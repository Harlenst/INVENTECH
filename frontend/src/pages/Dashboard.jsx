import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';


function Dashboard() {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [recentAttendances, setRecentAttendances] = useState([]);
  const [upcomingSchedules, setUpcomingSchedules] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user && !loading) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const isAdmin = user && user.rol.toLowerCase() === 'admin';

        // Obtener asistencias recientes
        const attendanceRes = await fetch(`/api/attendances${isAdmin ? '' : `?usuario_id=${user.id}`}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (attendanceRes.status === 401 || attendanceRes.status === 403) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        const attendanceData = await attendanceRes.json();
        setRecentAttendances(attendanceData.slice(0, 5)); // Últimas 5 asistencias

        // Obtener horarios próximos
        const scheduleRes = await fetch(`/api/schedules${isAdmin ? '' : `?usuario_id=${user.id}`}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const scheduleData = await scheduleRes.json();
        const today = new Date().toISOString().split('T')[0];
        setUpcomingSchedules(scheduleData.filter(s => s.fecha >= today).slice(0, 5)); // Próximos 5 horarios

        // Obtener estadísticas (solo para admins)
        if (isAdmin) {
          const statsRes = await fetch('/api/purchases/stats', {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          const statsData = await statsRes.json();
          setStats(statsData);
        }
      } catch (err) {
        setError('Error al cargar los datos: ' + err.message);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <div className="text-center mt-5">Cargando...</div>;
  }

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">
        <i className="bi bi-house-door me-2"></i>Panel de Control
      </h2>
      {error && (
        <div className="alert alert-danger d-flex align-items-center" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      )}
      <div className="row">
        {/* Asistencias Recientes */}
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header">
              <h5>Asistencias Recientes</h5>
            </div>
            <div className="card-body">
              {recentAttendances.length === 0 ? (
                <p>No hay asistencias recientes.</p>
              ) : (
                <ul className="list-group">
                  {recentAttendances.map(att => (
                    <li key={att.id} className="list-group-item">
                      {att.nombre_empleado} - {att.fecha} -{' '}
                      <span
                        className={`badge ${
                          att.estado === 'presente'
                            ? 'bg-success'
                            : att.estado === 'ausente'
                            ? 'bg-danger'
                            : 'bg-warning'
                        }`}
                      >
                        {att.estado}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
        {/* Horarios Próximos */}
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header">
              <h5>Horarios Próximos</h5>
            </div>
            <div className="card-body">
              {upcomingSchedules.length === 0 ? (
                <p>No hay horarios próximos.</p>
              ) : (
                <ul className="list-group">
                  {upcomingSchedules.map(sch => (
                    <li key={sch.id} className="list-group-item">
                      {sch.nombre_empleado} - {sch.fecha} - {sch.turno}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
        {/* Estadísticas (Solo Admins) */}
        {user && user.rol.toLowerCase() === 'admin' && (
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5>Estadísticas de Ventas</h5>
              </div>
              <div className="card-body">
                {stats && stats.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-striped">
                      <thead>
                        <tr>
                          <th>Empleado</th>
                          <th>Total Compras</th>
                          <th>Total Ventas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.slice(0, 5).map(stat => (
                          <tr key={stat.usuario_id}>
                            <td>{stat.nombre_empleado}</td>
                            <td>{stat.total_compras}</td>
                            <td>${parseFloat(stat.total_ventas || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p>No hay estadísticas disponibles.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;