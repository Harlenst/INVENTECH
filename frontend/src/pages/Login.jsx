import React, { useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast, ToastContainer } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import { useApi } from '../utils/api';

function Login() {
  const { login } = useContext(AuthContext);
  const { fetchWithAuth } = useApi();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      usuario: '',
      contrasena: '',
    },
  });

  const onSubmit = async (data) => {
    try {
      const result = await fetchWithAuth('/api/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      login(result.token, result.user);
      toast.success('Inicio de sesión exitoso', {
        position: 'top-right',
        autoClose: 3000,
      });

      const rol = result.user.rol.toLowerCase();
      if (rol === 'admin') {
        navigate('/admin-menu');
      } else {
        navigate('/employee-menu');
      }
    } catch (error) {
      toast.error(error.message || 'Error al iniciar sesión', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="text-center mb-4">
          <h1 className="logo-text">
            <i className="bi bi-gear me-2"></i>INVENTECH
          </h1>
          <h2 className="login-title">
            <i className="bi bi-box-arrow-in-right me-2"></i>Iniciar sesión
          </h2>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="w-100">
          <div className="mb-3">
            <label htmlFor="usuario" className="form-label">
              <i className="bi bi-person-fill me-2"></i>Usuario
            </label>
            <input
              type="text"
              className={`form-control ${errors.usuario ? 'is-invalid' : ''}`}
              id="usuario"
              {...register('usuario', { required: 'El usuario es obligatorio' })}
            />
            {errors.usuario && <div className="invalid-feedback">{errors.usuario.message}</div>}
          </div>
          <div className="mb-3">
            <label htmlFor="contrasena" className="form-label">
              <i className="bi bi-lock-fill me-2"></i>Contraseña
            </label>
            <input
              type="password"
              className={`form-control ${errors.contrasena ? 'is-invalid' : ''}`}
              id="contrasena"
              {...register('contrasena', { required: 'La contraseña es obligatoria' })}
            />
            {errors.contrasena && <div className="invalid-feedback">{errors.contrasena.message}</div>}
          </div>
          <button type="submit" className="btn btn-primary w-100">
            <i className="bi bi-box-arrow-in-right me-2"></i>Iniciar sesión
          </button>
          <div className="text-center mt-3">
            <p>
              ¿No tienes una cuenta?{' '}
              <Link to="/register" className="text-primary">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </form>
      </div>
      <ToastContainer />
    </div>
  );
}

export default Login;