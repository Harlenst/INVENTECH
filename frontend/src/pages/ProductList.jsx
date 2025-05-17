import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No se encontró el token de autenticación. Por favor, inicia sesión nuevamente.');
          navigate('/login');
          return;
        }

        // Obtener todos los productos
        const productsResponse = await fetch('http://localhost:3000/api/products', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (productsResponse.status === 401 || productsResponse.status === 403) {
          localStorage.removeItem('token');
          setError('Sesión expirada o no autorizada. Por favor, inicia sesión nuevamente.');
          navigate('/login');
          return;
        }

        const productsData = await productsResponse.json();
        if (productsResponse.ok) {
          setProducts(productsData);
          // Mostrar alerta si hay productos con stock bajo (para todos los usuarios)
          const lowStockProducts = productsData.filter(product => product.stock < product.stockMinimo);
          if (lowStockProducts.length > 0) {
            const productNames = lowStockProducts.map(p => p.nombre).join(', ');
            setError(`Alerta: Stock bajo para los siguientes productos: ${productNames}`);
          }
        } else {
          setError(productsData.message);
          return;
        }

        // Si el usuario es Admin, obtener productos con stock bajo desde la ruta específica
        if (user && user.rol.toLowerCase() === 'admin') {
          const lowStockResponse = await fetch('http://localhost:3000/api/products/low-stock', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (lowStockResponse.ok) {
            const lowStockData = await lowStockResponse.json();
            if (lowStockData.length > 0) {
              const productNames = lowStockData.map(p => p.nombre).join(', ');
              setError(prev => prev ? `${prev} | Alerta para Admin: Stock bajo para: ${productNames}` : `Alerta para Admin: Stock bajo para: ${productNames}`);
            }
          } else if (lowStockResponse.status !== 403) {
            setError('Error al verificar productos con stock bajo');
          }
        }
      } catch (error) {
        setError('Error al cargar productos: ' + error.message);
      }
    };

    fetchProducts();
  }, [navigate, user]);

  const getMenuPath = () => {
    if (!user) return '/login';
    return user.rol.toLowerCase() === 'admin' ? '/admin-menu' : '/employee-menu';
  };

  // Función para determinar el estado del stock y aplicar clases de estilo
  const getStockStatus = (stock, stockMinimo, stockMaximo) => {
    if (stock < stockMinimo) {
      return { class: 'text-danger fw-bold', message: 'Stock bajo' };
    } else if (stock > stockMaximo) {
      return { class: 'text-warning fw-bold', message: 'Stock excedido' };
    }
    return { class: 'text-success', message: 'Stock normal' };
  };

  return (
    <div className="client-container">
      <div className="client-list">
        <h2 className="text-center mb-4">
          <i className="bi bi-boxes me-2"></i>Lista de Productos
        </h2>
        {error && (
          <div className="alert alert-danger d-flex align-items-center" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        )}
        {products.length === 0 ? (
          <p className="text-center">No hay productos registrados.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped table-hover align-middle">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Imagen</th>
                  <th>Nombre</th>
                  <th>Precio</th>
                  <th>Categoría</th>
                  <th>Talla</th>
                  <th>Stock</th>
                  <th>Stock Mínimo</th>
                  <th>Stock Máximo</th>
                  <th>Estado</th>
                  <th>Código de barras</th>
                  <th>Código general</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => {
                  const stockStatus = getStockStatus(product.stock, product.stockMinimo, product.stockMaximo);
                  return (
                    <tr key={product.id}>
                      <td>{index + 1}</td>
                      <td>
                        {product.imagen ? (
                          <img
                            src={`http://localhost:3000${product.imagen}`}
                            alt={product.nombre}
                            style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '5px' }}
                            onError={(e) => {
                              console.error(`Error loading image: http://localhost:3000${product.imagen}`);
                              e.target.src = 'https://via.placeholder.com/50?text=Imagen+No+Disponible';
                            }}
                          />
                        ) : (
                          'Sin imagen'
                        )}
                      </td>
                      <td>{product.nombre}</td>
                      <td>${parseFloat(product.precio).toFixed(2)}</td>
                      <td>{product.categoria}</td>
                      <td>{product.talla}</td>
                      <td className={stockStatus.class}>{product.stock}</td>
                      <td>{product.stockMinimo}</td>
                      <td>{product.stockMaximo}</td>
                      <td className={stockStatus.class}>{stockStatus.message}</td>
                      <td>{product.codigo_barras}</td>
                      <td>{product.codigo_general}</td>
                    </tr>
                  );
                })}
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

export default ProductList;