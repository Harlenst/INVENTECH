import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';


function InventoryOverview() {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [error, setError] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');

  useEffect(() => {
    if (!user && !loading) {
      navigate('/login');
      return;
    }

    if (user && user.rol.toLowerCase() !== 'admin') {
      navigate('/employee-menu');
      return;
    }

    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/products', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        const data = await response.json();
        setProducts(data);
        setFilteredProducts(data);
      } catch (err) {
        setError('Error al cargar productos: ' + err.message);
      }
    };

    if (user) {
      fetchProducts();
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    let filtered = products;

    if (categoryFilter) {
      filtered = filtered.filter(p => p.categoria === categoryFilter);
    }

    if (stockFilter === 'low') {
      filtered = filtered.filter(p => p.stock <= 5);
    } else if (stockFilter === 'out') {
      filtered = filtered.filter(p => p.stock === 0);
    }

    setFilteredProducts(filtered);
  }, [categoryFilter, stockFilter, products]);

  if (loading) {
    return <div className="text-center mt-5">Cargando...</div>;
  }

  return (
    <div className="client-container">
      <div className="client-list">
        <h2 className="text-center mb-4">
          <i className="bi bi-boxes me-2"></i>Resumen de Inventario
        </h2>
        {error && (
          <div className="alert alert-danger d-flex align-items-center" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        )}
        <div className="mb-4">
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Filtrar por Categoría</label>
              <select
                className="form-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">Todas</option>
                <option value="Camisa">Camisa</option>
                <option value="Pantalón">Pantalón</option>
                <option value="Calcetines">Calcetines</option>
                <option value="Sombrero">Sombrero</option>
              </select>
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Filtrar por Stock</label>
              <select
                className="form-select"
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="low">Stock Bajo (≤ 5)</option>
                <option value="out">Sin Stock</option>
              </select>
            </div>
          </div>
        </div>
        {filteredProducts.length === 0 ? (
          <p className="text-center">No hay productos que coincidan con los filtros.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped table-hover align-middle">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Talla</th>
                  <th>Stock</th>
                  <th>Precio</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product, index) => (
                  <tr key={product.id}>
                    <td>{index + 1}</td>
                    <td>{product.nombre}</td>
                    <td>{product.categoria}</td>
                    <td>{product.talla}</td>
                    <td>
                      <span
                        className={`badge ${
                          product.stock === 0
                            ? 'bg-danger'
                            : product.stock <= 5
                            ? 'bg-warning'
                            : 'bg-success'
                        }`}
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td>${parseFloat(product.precio).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="text-center mt-4">
          <button className="btn btn-secondary" onClick={() => navigate('/admin-menu')}>
            <i className="bi bi-arrow-left-circle me-2"></i>Volver al Menú
          </button>
        </div>
      </div>
    </div>
  );
}

export default InventoryOverview;