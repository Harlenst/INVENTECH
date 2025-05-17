import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';


function ProductRegister() {
  const [formData, setFormData] = useState({
    nombre: '',
    precio: '',
    categoria: '',
    talla: '',
    stock: '',
    codigo_barras: '',
    codigo_general: '',
    imagen: null,
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, imagen: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    // Validate required fields
    const requiredFields = ['nombre', 'precio', 'categoria', 'talla', 'stock', 'codigo_barras', 'codigo_general'];
    for (const field of requiredFields) {
      if (!formData[field]) {
        setError('Todos los campos son obligatorios');
        return;
      }
    }

    if (!formData.imagen) {
      setError('Debes seleccionar una imagen');
      return;
    }

    // Validate precio and stock as numbers
    if (isNaN(formData.precio) || formData.precio <= 0) {
      setError('El precio debe ser un número mayor a 0');
      return;
    }
    if (isNaN(formData.stock) || formData.stock < 0) {
      setError('El stock debe ser un número mayor o igual a 0');
      return;
    }

    // Create FormData for multipart/form-data request
    const data = new FormData();
    for (const key in formData) {
      if (formData[key]) {
        data.append(key, formData[key]);
      }
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No se encontró el token de autenticación. Por favor, inicia sesión nuevamente.');
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:3000/api/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: data,
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        setError('Sesión expirada o no autorizada. Por favor, inicia sesión nuevamente.');
        navigate('/login');
        return;
      }

      const result = await response.json();
      if (response.ok) {
        setMessage(result.message);
        // Reset form
        setFormData({
          nombre: '',
          precio: '',
          categoria: '',
          talla: '',
          stock: '',
          codigo_barras: '',
          codigo_general: '',
          imagen: null,
        });
        document.getElementById('imagen').value = ''; // Clear file input
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Error al registrar el producto: ' + err.message);
    }
  };

  return (
    <div className="client-container">
      <div className="client-box">
        <h2 className="text-center mb-4">
          <i className="bi bi-box-fill me-2"></i>Registrar Producto
        </h2>
        {message && (
          <div className="alert alert-success d-flex align-items-center" role="alert">
            <i className="bi bi-check-circle-fill me-2"></i>
            {message}
          </div>
        )}
        {error && (
          <div className="alert alert-danger d-flex align-items-center" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="nombre" className="form-label">
              <i className="bi bi-tag-fill me-2"></i>Nombre
            </label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              value={formData.nombre}
              onChange={handleInputChange}
              className="form-control"
              placeholder="Nombre del producto"
            />
          </div>
          <div className="mb-3">
            <label htmlFor="precio" className="form-label">
              <i className="bi bi-currency-dollar me-2"></i>Precio
            </label>
            <input
              id="precio"
              name="precio"
              type="number"
              step="0.01"
              value={formData.precio}
              onChange={handleInputChange}
              className="form-control"
              placeholder="Precio"
            />
          </div>
          <div className="mb-3">
            <label htmlFor="categoria" className="form-label">
              <i className="bi bi-list-ul me-2"></i>Categoría
            </label>
            <select
              id="categoria"
              name="categoria"
              value={formData.categoria}
              onChange={handleInputChange}
              className="form-select"
            >
              <option value="">Selecciona una categoría</option>
              <option value="Camisa">Camisa</option>
              <option value="Pantalón">Pantalón</option>
              <option value="Calcetines">Calcetines</option>
              <option value="Sombrero">Sombrero</option>
            </select>
          </div>
          <div className="mb-3">
            <label htmlFor="talla" className="form-label">
              <i className="bi bi-rulers me-2"></i>Talla
            </label>
            <select
              id="talla"
              name="talla"
              value={formData.talla}
              onChange={handleInputChange}
              className="form-select"
            >
              <option value="">Selecciona una talla</option>
              <option value="S">S</option>
              <option value="M">M</option>
              <option value="L">L</option>
              <option value="XL">XL</option>
            </select>
          </div>
          <div className="mb-3">
            <label htmlFor="stock" className="form-label">
              <i className="bi bi-boxes me-2"></i>Stock
            </label>
            <input
              id="stock"
              name="stock"
              type="number"
              value={formData.stock}
              onChange={handleInputChange}
              className="form-control"
              placeholder="Stock"
            />
          </div>
          <div className="mb-3">
            <label htmlFor="codigo_barras" className="form-label">
              <i className="bi bi-upc-scan me-2"></i>Código de barras
            </label>
            <input
              id="codigo_barras"
              name="codigo_barras"
              type="text"
              value={formData.codigo_barras}
              onChange={handleInputChange}
              className="form-control"
              placeholder="Código de barras"
            />
          </div>
          <div className="mb-3">
            <label htmlFor="codigo_general" className="form-label">
              <i className="bi bi-code-square me-2"></i>Código general
            </label>
            <input
              id="codigo_general"
              name="codigo_general"
              type="text"
              value={formData.codigo_general}
              onChange={handleInputChange}
              className="form-control"
              placeholder="Código general"
            />
          </div>
          <div className="mb-3">
            <label htmlFor="imagen" className="form-label">
              <i className="bi bi-image-fill me-2"></i>Imagen
            </label>
            <input
              id="imagen"
              name="imagen"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="form-control"
            />
          </div>
          <div className="d-flex gap-2">
            <button type="submit" className="btn btn-primary w-100">
              <i className="bi bi-check2-circle me-2"></i>Registrar Producto
            </button>
            <button
              type="button"
              className="btn btn-secondary w-100"
              onClick={() => navigate('/product-list')}
            >
              <i className="bi bi-x-circle me-2"></i>Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProductRegister;