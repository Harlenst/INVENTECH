import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function PurchaseHistory() {
  const { user, token, loading, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState([]);
  const [filteredPurchases, setFilteredPurchases] = useState([]);
  const [error, setError] = useState(null);
  const [clientFilter, setClientFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [clients, setClients] = useState([]);

  useEffect(() => {
    if (!user && !loading) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        if (!token) {
          setError('No se encontró un token de autenticación. Por favor, inicia sesión.');
          logout();
          navigate('/login');
          return;
        }

        const isAdmin = user && user.rol.toLowerCase() === 'admin';

        // Obtener compras
        const purchaseRes = await fetch(`/api/purchases${isAdmin ? '' : `?usuario_id=${user.id}`}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (purchaseRes.status === 429) {
          setError('Demasiadas solicitudes. Por favor, intenta de nuevo más tarde.');
          return;
        }

        if (purchaseRes.status === 401) {
          setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
          logout();
          navigate('/login');
          return;
        }

        if (purchaseRes.status === 403) {
          setError('No tienes permisos para ver las compras. Contacta a un administrador.');
          return;
        }

        if (!purchaseRes.ok) {
          throw new Error(`Error al obtener las compras: ${purchaseRes.statusText}`);
        }

        const purchaseData = await purchaseRes.json();
        setPurchases(purchaseData || []);
        setFilteredPurchases(purchaseData || []);

        // Obtener lista de clientes para el filtro (solo para admins)
        if (isAdmin) {
          const clientRes = await fetch('/api/clients', {
            headers: { 'Authorization': `Bearer ${token}` },
          });

          if (clientRes.status === 429) {
            setError('Demasiadas solicitudes al obtener clientes. Por favor, intenta de nuevo más tarde.');
            return;
          }

          if (clientRes.status === 401) {
            setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
            logout();
            navigate('/login');
            return;
          }

          if (clientRes.status === 403) {
            setError('No tienes permisos para ver la lista de clientes.');
            setClients([]);
            return;
          }

          if (!clientRes.ok) {
            throw new Error(`Error al obtener los clientes: ${clientRes.statusText}`);
          }

          const clientData = await clientRes.json();
          setClients(Array.isArray(clientData) ? clientData : []);
        } else {
          setClients([]);
        }
      } catch (err) {
        setError('Error al cargar historial de compras: ' + err.message);
        setPurchases([]);
        setFilteredPurchases([]);
        setClients([]);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user, token, loading, navigate, logout]);

  useEffect(() => {
    let filtered = [...purchases];

    if (clientFilter) {
      filtered = filtered.filter(p => p.cliente_id === parseInt(clientFilter));
    }

    if (dateFilter) {
      filtered = filtered.filter(p => p.fecha && p.fecha.startsWith(dateFilter));
    }

    setFilteredPurchases(filtered);
  }, [clientFilter, dateFilter, purchases]);

  if (loading) {
    return <div className="text-center mt-5">Cargando...</div>;
  }

  const getMenuPath = () => {
    if (!user) return '/login';
    return user.rol.toLowerCase() === 'admin' ? '/admin-menu' : '/employee-menu';
  };

  const isAdmin = user && user.rol.toLowerCase() === 'admin';

  return (
    <div className="client-container">
      <div className="client-list">
        <h2 className="text-center mb-4">
          <i className="bi bi-receipt me-2"></i>Historial de Compras
        </h2>
        {error && (
          <div className="alert alert-danger d-flex align-items-center" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        )}
        {isAdmin && (
          <div className="mb-4">
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Filtrar por Cliente</label>
                <select
                  className="form-select"
                  value={clientFilter}
                  onChange={(e) => setClientFilter(e.target.value)}
                >
                  <option value="">Todos</option>
                  {clients.length > 0 &&
                    clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.nombre || 'Sin nombre'}
                      </option>
                    ))}
                </select>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Filtrar por Fecha</label>
                <input
                  type="date"
                  className="form-control"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
        {filteredPurchases.length === 0 ? (
          <p className="text-center">No hay compras registradas.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped table-hover align-middle">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Cliente</th>
                  <th>Empleado</th>
                  <th>Fecha</th>
                  <th>Productos</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.map((purchase, index) => (
                  <tr key={purchase.id}>
                    <td>{index + 1}</td>
                    <td>{purchase.nombre_cliente || 'Sin cliente'}</td>
                    <td>{purchase.nombre_empleado || 'Sin empleado'}</td>
                    <td>{purchase.fecha || 'Sin fecha'}</td>
                    <td>
                      <ul>
                        {purchase.detalles.length > 0 ? (
                          purchase.detalles.map((detail, idx) => (
                            <li key={idx}>
                              {detail.nombre || 'Sin nombre'} (x{detail.cantidad || 0}) - $
                              {detail.precio ? parseFloat(detail.precio).toFixed(2) : '0.00'}
                            </li>
                          ))
                        ) : (
                          <li>No hay productos</li>
                        )}
                      </ul>
                    </td>
                    <td>${purchase.total ? parseFloat(purchase.total).toFixed(2) : '0.00'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="text-center mt-4">
          <button className="btn btn-secondary" onClick={() => navigate(getMenuPath())}>
            <i className="bi bi-arrow-left-circle me-2"></i>Volver al Menú
          </button>
        </div>
      </div>
    </div>
  );
}

export default PurchaseHistory;