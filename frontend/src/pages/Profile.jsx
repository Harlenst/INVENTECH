import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';


function Profile() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  // Estado para los datos del usuario
  const [userData, setUserData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    email: '',
    imagen: '',
  });
  const [newImage, setNewImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Obtener los datos del usuario al cargar el componente
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/login');
      return;
    }

    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/user', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Error al obtener los datos del usuario');
        }

        const data = await response.json();
        setUserData({
          nombre: data.nombre || '',
          apellido: data.apellido || '',
          telefono: data.telefono || '',
          email: data.email || '',
          imagen: data.imagen || '',
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, authLoading, navigate]);

  // Manejar cambios en los inputs del formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  // Manejar la selección de una nueva imagen
  const handleImageChange = (e) => {
    setNewImage(e.target.files[0]);
  };

  // Manejar el envío del formulario para actualizar los datos
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('nombre', userData.nombre);
    formData.append('apellido', userData.apellido);
    formData.append('telefono', userData.telefono);
    formData.append('email', userData.email);
    if (newImage) {
      formData.append('imagen', newImage);
    }

    try {
      const response = await fetch('/api/user/update', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al actualizar los datos');
      }

      const data = await response.json();
      setSuccess(data.message);

      // Actualizar la imagen si se subió una nueva
      if (data.imagen) {
        setUserData((prev) => ({ ...prev, imagen: data.imagen }));
        setNewImage(null);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Mostrar un mensaje de carga mientras se obtienen los datos
  if (loading || authLoading) {
    return <div className="container mt-5 text-white">Cargando...</div>;
  }

  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#1C2526' }}>
      <div className="container flex-grow-1 d-flex flex-column justify-content-center py-5">
        {/* Título */}
        <div className="text-center mb-5">
          <h2 className="text-white fw-bolder" style={{ fontFamily: "'Poppins', sans-serif", fontSize: '2.5rem', textShadow: '1px 1px 2px rgba(0, 0, 0, 0.2)' }}>
            Perfil de Usuario
          </h2>
        </div>

        {/* Contenedor del formulario */}
        <div className="client-box mx-auto">
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          {success && (
            <div className="alert alert-success" role="alert">
              {success}
            </div>
          )}

          {/* Imagen de perfil */}
          <div className="text-center mb-4">
            <img
              src={userData.imagen ? userData.imagen : 'https://via.placeholder.com/150'}
              alt="Perfil"
              className="rounded-circle mb-3"
              style={{ width: '150px', height: '150px', objectFit: 'cover' }}
            />
            <div>
              <label htmlFor="imagen" className="btn btn-primary">
                Cambiar Imagen
              </label>
              <input
                type="file"
                id="imagen"
                name="imagen"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
              {newImage && (
                <p className="text-muted mt-2">Nueva imagen seleccionada: {newImage.name}</p>
              )}
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="nombre" className="form-label">Nombre</label>
              <input
                type="text"
                className="form-control"
                id="nombre"
                name="nombre"
                value={userData.nombre}
                onChange={handleInputChange}
                placeholder="Ingresa tu nombre"
              />
            </div>
            <div className="mb-3">
              <label htmlFor="apellido" className="form-label">Apellido</label>
              <input
                type="text"
                className="form-control"
                id="apellido"
                name="apellido"
                value={userData.apellido}
                onChange={handleInputChange}
                placeholder="Ingresa tu apellido"
              />
            </div>
            <div className="mb-3">
              <label htmlFor="telefono" className="form-label">Teléfono</label>
              <input
                type="tel"
                className="form-control"
                id="telefono"
                name="telefono"
                value={userData.telefono}
                onChange={handleInputChange}
                placeholder="Ingresa tu teléfono"
              />
            </div>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                id="email"
                name="email"
                value={userData.email}
                onChange={handleInputChange}
                placeholder="Ingresa tu email"
              />
            </div>
            <div className="text-center">
              <button type="submit" className="btn btn-primary">
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Profile;