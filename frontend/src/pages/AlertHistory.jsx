import React, { useState, useEffect } from 'react';

const AlertHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('/api/inventory/alert-history', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (!response.ok) throw new Error('Error al obtener historial de alertas');
        const data = await response.json();
        setHistory(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <p>Cargando...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Historial de Alertas</h1>
      <table className="min-w-full bg-white border">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">ID</th>
            <th className="py-2 px-4 border-b">Producto</th>
            <th className="py-2 px-4 border-b">Mensaje</th>
            <th className="py-2 px-4 border-b">Fecha</th>
            <th className="py-2 px-4 border-b">Estado</th>
          </tr>
        </thead>
        <tbody>
          {history.map((item) => (
            <tr key={item.id}>
              <td className="py-2 px-4 border-b">{item.id}</td>
              <td className="py-2 px-4 border-b">{item.producto_id}</td>
              <td className="py-2 px-4 border-b">{item.mensaje}</td>
              <td className="py-2 px-4 border-b">{new Date(item.fecha).toLocaleString()}</td>
              <td className="py-2 px-4 border-b">{item.estado}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AlertHistory;