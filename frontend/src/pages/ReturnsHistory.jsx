import React, { useState, useEffect } from 'react';

const ReturnsHistory = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReturns = async () => {
      try {
        const response = await fetch('/api/returns', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (!response.ok) throw new Error('Error al obtener historial de devoluciones');
        const data = await response.json();
        setReturns(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchReturns();
  }, []);

  if (loading) return <p>Cargando...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Historial de Devoluciones</h1>
      <table className="min-w-full bg-white border">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">ID</th>
            <th className="py-2 px-4 border-b">Compra</th>
            <th className="py-2 px-4 border-b">Producto</th>
            <th className="py-2 px-4 border-b">Cantidad</th>
            <th className="py-2 px-4 border-b">Fecha</th>
            <th className="py-2 px-4 border-b">Motivo</th>
          </tr>
        </thead>
        <tbody>
          {returns.map((item) => (
            <tr key={item.id}>
              <td className="py-2 px-4 border-b">{item.id}</td>
              <td className="py-2 px-4 border-b">{item.compra_id}</td>
              <td className="py-2 px-4 border-b">{item.nombre_producto}</td>
              <td className="py-2 px-4 border-b">{item.cantidad}</td>
              <td className="py-2 px-4 border-b">{new Date(item.fecha).toLocaleString()}</td>
              <td className="py-2 px-4 border-b">{item.motivo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReturnsHistory;