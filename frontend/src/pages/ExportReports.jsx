import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ExportReports = () => {
  const { user, token, logout, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  if (loading) {
    return <p className="text-white text-center">Cargando...</p>;
  }

  if (!user || !token) {
    navigate('/login');
    return null;
  }

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

      // Si la respuesta es un archivo (CSV), manejar la descarga
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

  return (
    <div className="client-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '40px 20px', backgroundColor: '#1C2526' }}>
      <div className="client-list" style={{ backgroundColor: '#ffffff', padding: '30px', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)', maxWidth: '800px', width: '100%' }}>
        <h2 className="text-center mb-4" style={{ color: '#333', fontFamily: 'Poppins, sans-serif', fontSize: '1.75rem', fontWeight: '700' }}>
          <i className="bi bi-file-earmark-arrow-down-fill me-2"></i>Exportar Reportes
        </h2>
        <div className="text-center mt-4 d-flex gap-2 justify-content-center">
          <button
            className="btn btn-primary"
            onClick={handleExport}
            style={{ backgroundColor: '#3498DB', border: 'none', padding: '0.75rem', fontWeight: '500', fontSize: '1rem', transition: 'background-color 0.3s ease, transform 0.2s ease' }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = '#2980B9')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = '#3498DB')}
          >
            <i className="bi bi-download me-2"></i>Descargar Reportes Financieros (CSV)
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportReports;