import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';


function AdminStats() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/purchases/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }

        const data = await response.json();
        setStats(data);
      } catch (error) {
        setError('Error al cargar estadísticas: ' + error.message);
      }
    };
    fetchStats();
  }, [navigate]);

  return (
    <div className="client-container">
      <div className="client-box">
        <h2 className="text-center mb-4">
          <i className="bi bi-bar-chart me-2"></i>Estadísticas de Ventas
        </h2>
        {error && (
          <div className="alert alert-danger d-flex align-items-center" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        )}
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>Empleado</th>
                <th>Total Compras</th>
                <th>Total Ventas</th>
                <th>Productos Vendidos</th>
              </tr>
            </thead>
            <tbody>
              {stats.map(stat => (
                <tr key={stat.usuario_id}>
                  <td>{stat.nombre_empleado}</td>
                  <td>{stat.total_compras}</td>
                  <td>${parseFloat(stat.total_ventas || 0).toFixed(2)}</td>
                  <td>
                    {stat.productos_vendidos && stat.productos_vendidos.length > 0 ? (
                      <ul>
                        {stat.productos_vendidos
                          .filter(p => p.producto_id) // Filter out null entries
                          .map((product, index) => (
                            <li key={index}>
                              {product.nombre_producto} (x{product.cantidad}) - ${product.precio_unitario}
                            </li>
                          ))}
                      </ul>
                    ) : (
                      'Ningún producto vendido'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminStats;