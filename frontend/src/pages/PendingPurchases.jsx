import React, { useState, useEffect } from 'react';

const PendingPurchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const response = await fetch('/api/purchases/pending', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (!response.ok) throw new Error('Error al obtener compras pendientes');
        const data = await response.json();
        setPurchases(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPurchases();
  }, []);

  const handleApprove = async (purchaseId) => {
    try {
      const response = await fetch(`/api/purchases/${purchaseId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ aprobado: true }),
      });
      if (!response.ok) throw new Error('Error al aprobar compra');
      alert('Compra aprobada');
      window.location.reload();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReject = async (purchaseId) => {
    try {
      const response = await fetch(`/api/purchases/${purchaseId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ aprobado: false }),
      });
      if (!response.ok) throw new Error('Error al rechazar compra');
      alert('Compra rechazada');
      window.location.reload();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <p>Cargando...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Compras Pendientes</h1>
      <table className="min-w-full bg-white border">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">ID</th>
            <th className="py-2 px-4 border-b">Cliente</th>
            <th className="py-2 px-4 border-b">Empleado</th>
            <th className="py-2 px-4 border-b">Total</th>
            <th className="py-2 px-4 border-b">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {purchases.map((purchase) => (
            <tr key={purchase.id}>
              <td className="py-2 px-4 border-b">{purchase.id}</td>
              <td className="py-2 px-4 border-b">{purchase.nombre_cliente}</td>
              <td className="py-2 px-4 border-b">{purchase.nombre_empleado}</td>
              <td className="py-2 px-4 border-b">{purchase.total}</td>
              <td className="py-2 px-4 border-b">
                <button
                  onClick={() => handleApprove(purchase.id)}
                  className="px-2 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 mr-2"
                >
                  Aprobar
                </button>
                <button
                  onClick={() => handleReject(purchase.id)}
                  className="px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  Rechazar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PendingPurchases;