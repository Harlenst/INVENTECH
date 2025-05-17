import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'bootstrap/dist/css/bootstrap.min.css';
import AutoAttendance from './AutoAttendance';

function EmployeePurchase() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [cart, setCart] = useState([]);
  const [barcode, setBarcode] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [clientPurchaseHistory, setClientPurchaseHistory] = useState([]);
  const [newClient, setNewClient] = useState({ nombre: '', email: '', numero: '', genero: '' });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (!user) {
      console.log('No user in context, redirecting to /login');
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No token found, redirecting to /login');
          navigate('/login');
          return;
        }

        console.log('Fetching products and clients...');
        const [productsRes, clientsRes] = await Promise.all([
          fetch('/api/products', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/clients', { headers: { 'Authorization': `Bearer ${token}` } }),
        ]);

        if (productsRes.status === 401 || clientsRes.status === 401) {
          console.log('Unauthorized (401), redirecting to /login');
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        if (productsRes.status === 403) {
          setError('Acceso denegado: No tienes permiso para ver los productos');
          return;
        }
        if (clientsRes.status === 403) {
          setError('Acceso denegado: No tienes permiso para ver los clientes');
          return;
        }

        if (!productsRes.ok) {
          throw new Error(`Error al obtener productos: ${productsRes.statusText}`);
        }
        if (!clientsRes.ok) {
          throw new Error(`Error al obtener clientes: ${clientsRes.statusText}`);
        }

        const productsData = await productsRes.json();
        const clientsData = await clientsRes.json();
        setProducts(Array.isArray(productsData) ? productsData : []);
        setClients(Array.isArray(clientsData) ? clientsData : []);
      } catch (error) {
        setError('Error al cargar datos: ' + error.message);
      }
    };

    fetchData();
  }, [user, navigate]);

  useEffect(() => {
    const fetchClientPurchaseHistory = async () => {
      if (!selectedClient) {
        setClientPurchaseHistory([]);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No token found in fetchClientPurchaseHistory, redirecting to /login');
          navigate('/login');
          return;
        }

        const response = await fetch(`/api/purchases/client/${selectedClient}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.status === 401 || response.status === 403) {
          console.log('Unauthorized in fetchClientPurchaseHistory, redirecting to /login');
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }

        if (response.ok) {
          const history = await response.json();
          setClientPurchaseHistory(history);
        } else {
          setError('Error al cargar historial de compras');
        }
      } catch (error) {
        setError('Error al cargar historial de compras: ' + error.message);
      }
    };

    fetchClientPurchaseHistory();
  }, [selectedClient, navigate]);

  const handleBarcodeScan = async (e) => {
    e.preventDefault();
    if (!barcode) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found in handleBarcodeScan, redirecting to /login');
        navigate('/login');
        return;
      }

      const response = await fetch(`/api/products/barcode/${barcode}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.status === 401 || response.status === 403) {
        console.log('Unauthorized in handleBarcodeScan, redirecting to /login');
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      if (response.ok) {
        const product = await response.json();
        if (product.stock > 0) {
          addToCart(product);
          setBarcode('');
        } else {
          setError('Producto sin stock');
        }
      } else {
        setError('Producto no encontrado');
      }
    } catch (error) {
      setError('Error al escanear código: ' + error.message);
    }
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.cantidad + 1 > product.stock) {
          setError('No hay suficiente stock');
          return prev;
        }
        return prev.map(item =>
          item.id === product.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [...prev, { ...product, cantidad: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateCartQuantity = (productId, cantidad) => {
    setCart(prev => {
      const product = products.find(p => p.id === productId);
      if (cantidad > product.stock) {
        setError('No hay suficiente stock');
        return prev;
      }
      return prev.map(item =>
        item.id === productId ? { ...item, cantidad: Math.max(1, cantidad) } : item
      );
    });
  };

  const handleRegisterClient = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found in handleRegisterClient, redirecting to /login');
        navigate('/login');
        return;
      }

      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newClient),
      });
      if (response.status === 401 || response.status === 403) {
        console.log('Unauthorized in handleRegisterClient, redirecting to /login');
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      if (response.ok) {
        const newClientData = await response.json();
        setClients(prev => [...prev, { id: newClientData.id, ...newClient }]);
        setSelectedClient(newClientData.id);
        setShowClientModal(false);
        setNewClient({ nombre: '', email: '', numero: '', genero: '' });
        setSuccess('Cliente registrado exitosamente');
      } else {
        const errorData = await response.json();
        setError(errorData.message);
      }
    } catch (error) {
      setError('Error al registrar cliente: ' + error.message);
    }
  };

  const handlePurchase = async () => {
    if (!selectedClient || cart.length === 0) {
      setError('Selecciona un cliente y agrega productos al carrito');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found in handlePurchase, redirecting to /login');
        navigate('/login');
        return;
      }

      const client = clients.find(c => c.id === parseInt(selectedClient));
      const total = cart.reduce((sum, item) => sum + item.cantidad * item.precio, 0);

      const response = await fetch('/api/purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          usuario_id: user.id,
          nombre_empleado: `${user.nombre} ${user.apellido || ''}`,
          cliente_id: client.id,
          nombre_cliente: client.nombre,
          productos: cart,
          total,
        }),
      });

      if (response.status === 401 || response.status === 403) {
        console.log('Unauthorized in handlePurchase, redirecting to /login');
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      if (response.ok) {
        generateInvoice(client, total);
        setSuccess('Compra registrada exitosamente');
        setCart([]);
        setSelectedClient('');
        setProducts(prev =>
          prev.map(p => ({
            ...p,
            stock: p.stock - (cart.find(item => item.id === p.id)?.cantidad || 0),
          }))
        );
        const refreshHistory = await fetch(`/api/purchases/client/${client.id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (refreshHistory.ok) {
          const updatedHistory = await refreshHistory.json();
          setClientPurchaseHistory(updatedHistory);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message);
      }
    } catch (error) {
      setError('Error al registrar compra: ' + error.message);
    }
    setShowConfirmModal(false);
  };

  const generateInvoice = (client, total) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Factura de Compra', 20, 20);
    doc.setFontSize(12);
    doc.text(`Cliente: ${client.nombre}`, 20, 30);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, 40);
    doc.text('Productos:', 20, 50);
    let y = 60;
    cart.forEach(item => {
      doc.text(`${item.nombre} x${item.cantidad} - $${(item.cantidad * item.precio).toFixed(2)}`, 20, y);
      y += 10;
    });
    doc.text(`Total: $${total.toFixed(2)}`, 20, y + 10);
    doc.text(`Vendedor: ${user.nombre} ${user.apellido || ''}`, 20, y + 20);
    doc.save(`factura_${Date.now()}.pdf`);
  };

  const getMenuPath = () => {
    if (!user) return '/login';
    return user.rol.toLowerCase() === 'admin' ? '/admin-menu' : '/employee-menu';
  };

  const totalCart = cart.reduce((sum, item) => sum + item.cantidad * item.precio, 0);

  return (
    <div className="client-container">
      {/* Incluir AutoAttendance para registrar entrada y salida */}
      <AutoAttendance />
      <div className="client-box">
        <h2 className="text-center mb-4">
          <i className="bi bi-cart-fill me-2"></i>Registrar Compra
        </h2>
        {error && (
          <div className="alert alert-danger d-flex align-items-center" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        )}
        {success && (
          <div className="alert alert-success d-flex align-items-center" role="alert">
            <i className="bi bi-check-circle-fill me-2"></i>
            {success}
          </div>
        )}
        <form onSubmit={handleBarcodeScan} className="mb-4">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Escanear código de barras"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              autoFocus
            />
            <button type="submit" className="btn btn-primary">
              <i className="bi bi-upc-scan"></i>
            </button>
          </div>
        </form>
        <div className="mb-3">
          <label className="form-label">
            <i className="bi bi-person-fill me-2"></i>Cliente
          </label>
          <div className="input-group">
            <select
              className="form-select"
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
            >
              <option value="">Selecciona un cliente</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.nombre || 'Sin nombre'}
                </option>
              ))}
            </select>
            <button
              className="btn btn-secondary"
              onClick={() => setShowClientModal(true)}
            >
              <i className="bi bi-plus-circle"></i>
            </button>
          </div>
        </div>
        {selectedClient && (
          <div className="mb-4">
            <h4>Historial de Compras del Cliente</h4>
            {clientPurchaseHistory.length === 0 ? (
              <p>Este cliente no tiene compras registradas.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Fecha</th>
                      <th>Total</th>
                      <th>Productos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientPurchaseHistory.map((purchase, index) => (
                      <tr key={purchase.id}>
                        <td>{index + 1}</td>
                        <td>{new Date(purchase.fecha).toLocaleDateString()}</td>
                        <td>${parseFloat(purchase.total).toFixed(2)}</td>
                        <td>
                          {purchase.productos.map(item => (
                            <div key={item.id}>
                              {item.nombre} x{item.cantidad} - ${(item.cantidad * item.precio).toFixed(2)}
                            </div>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        <h4>Productos Disponibles</h4>
        <div className="row row-cols-1 row-cols-md-2 g-3 mb-4">
          {products.map(product => (
            <div key={product.id} className="col">
              <div className="card glass-card transition-shadow">
                <div className="card-body d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="card-title mb-1">{product.nombre || 'Sin nombre'}</h6>
                    <p className="mb-0">Stock: {product.stock || 0} | ${product.precio || '0.00'}</p>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => addToCart(product)}
                    disabled={product.stock === 0}
                  >
                    <i className="bi bi-cart-plus"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <h4>Carrito</h4>
        {cart.length === 0 ? (
          <p>El carrito está vacío</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Precio Unitario</th>
                  <th>Total</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cart.map(item => (
                  <tr key={item.id}>
                    <td>{item.nombre || 'Sin nombre'}</td>
                    <td>
                      <input
                        type="number"
                        className="form-control w-50"
                        value={item.cantidad || 1}
                        onChange={(e) => updateCartQuantity(item.id, parseInt(e.target.value))}
                        min="1"
                      />
                    </td>
                    <td>${item.precio ? parseFloat(item.precio).toFixed(2) : '0.00'}</td>
                    <td>${(item.cantidad * item.precio).toFixed(2)}</td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h5>Total: ${totalCart.toFixed(2)}</h5>
          </div>
        )}
        <button
          className="btn btn-success w-100 mt-3"
          onClick={() => setShowConfirmModal(true)}
          disabled={cart.length === 0 || !selectedClient}
        >
          <i className="bi bi-check2-circle me-2"></i>Confirmar Compra
        </button>
        <div className="text-center mt-4">
          <button className="btn btn-secondary" onClick={() => navigate(getMenuPath())}>
            <i className="bi bi-arrow-left-circle me-2"></i>Volver al Menú
          </button>
        </div>
      </div>
      {showClientModal && (
        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content client-box">
              <div className="modal-header">
                <h5 className="modal-title">Registrar Cliente</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowClientModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleRegisterClient}>
                  <div className="mb-3">
                    <label className="form-label">Nombre</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newClient.nombre}
                      onChange={(e) => setNewClient({ ...newClient, nombre: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={newClient.email}
                      onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Número</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newClient.numero}
                      onChange={(e) => setNewClient({ ...newClient, numero: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Género</label>
                    <select
                      className="form-select"
                      value={newClient.genero}
                      onChange={(e) => setNewClient({ ...newClient, genero: e.target.value })}
                      required
                    >
                      <option value="">Selecciona</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary w-100">
                    Registrar
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      {showConfirmModal && (
        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content client-box">
              <div className="modal-header">
                <h5 className="modal-title">Confirmar Compra</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowConfirmModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>¿Estás seguro de confirmar la compra?</p>
                <p>Cliente: {clients.find(c => c.id === parseInt(selectedClient))?.nombre || 'Sin nombre'}</p>
                <p>Total: ${totalCart.toFixed(2)}</p>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowConfirmModal(false);
                    navigate(getMenuPath());
                  }}
                >
                  Cancelar
                </button>
                <button className="btn btn-success" onClick={handlePurchase}>
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeePurchase;