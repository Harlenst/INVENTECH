import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const FinancialReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, token, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/financial-reports', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 401) {
          setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
          logout();
          navigate('/login');
          return;
        }

        if (!response.ok) throw new Error('Error al obtener reportes');
        const data = await response.json();
        setReports(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchReports();
    } else {
      navigate('/login');
    }
  }, [token, navigate, logout]);

  const handleExport = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/export-reports', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        logout();
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Error al exportar reportes');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'financial-reports.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al exportar:', error.message);
    }
  };

  if (loading) return <p className="text-white text-center">Cargando...</p>;
  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="client-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '40px 20px', backgroundColor: '#1C2526' }}>
      <div className="client-list" style={{ backgroundColor: '#ffffff', padding: '30px', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)', maxWidth: '800px', width: '100%' }}>
        <h2 className="text-center mb-4" style={{ color: '#333', fontFamily: 'Poppins, sans-serif', fontSize: '1.75rem', fontWeight: '700' }}>
          <i className="bi bi-file-earmark-bar-graph-fill me-2"></i>Reportes Financieros
        </h2>
        {error && (
          <div className="alert alert-danger d-flex align-items-center" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        )}
        {!error && reports.length === 0 ? (
          <p className="text-center" style={{ color: '#333' }}>No hay reportes financieros disponibles.</p>
        ) : (
          reports.length > 0 && (
            <div className="table-responsive">
              <table className="table table-striped table-hover align-middle">
                <thead>
                  <tr>
                    <th style={{ backgroundColor: '#646cff', color: '#ffffff', border: 'none' }}>#</th>
                    <th style={{ backgroundColor: '#646cff', color: '#ffffff', border: 'none' }}>Fecha</th>
                    <th style={{ backgroundColor: '#646cff', color: '#ffffff', border: 'none' }}>Ingresos</th>
                    <th style={{ backgroundColor: '#646cff', color: '#ffffff', border: 'none' }}>Gastos</th>
                    <th style={{ backgroundColor: '#646cff', color: '#ffffff', border: 'none' }}>Utilidad</th>
                    <th style={{ backgroundColor: '#646cff', color: '#ffffff', border: 'none' }}>Descripción</th>
                    <th style={{ backgroundColor: '#646cff', color: '#ffffff', border: 'none' }}>Creado Por</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report, index) => (
                    <tr key={report.id}>
                      <td>{index + 1}</td>
                      <td>{new Date(report.fecha).toLocaleDateString()}</td>
                      <td>{report.ingresos}</td>
                      <td>{report.gastos}</td>
                      <td>{report.utilidad}</td>
                      <td>{report.descripcion}</td>
                      <td>{report.creado_por}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
        <div className="text-center mt-4 d-flex gap-2 justify-content-center">
          <button
            className="btn btn-primary"
            onClick={handleExport}
            style={{ backgroundColor: '#3498DB', border: 'none', padding: '0.75rem', fontWeight: '500', fontSize: '1rem', transition: 'background-color 0.3s ease, transform 0.2s ease' }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = '#2980B9')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = '#3498DB')}
          >
            <i className="bi bi-download me-2"></i>Exportar a CSV
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinancialReports;