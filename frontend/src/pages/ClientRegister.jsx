import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { toast, ToastContainer } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';


const registerClient = async ({ data, token }) => {
  const response = await fetch('http://localhost:3000/api/clients', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (response.status === 403) {
    throw new Error('Sesión expirada o no autorizada. Por favor, inicia sesión nuevamente.');
  }

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Error al registrar el cliente');
  }
  return result;
};

function ClientRegister() {
  const { token, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      nombre: '',
      email: '',
      numero: '',
      genero: 'Masculino',
    },
  });

  const mutation = useMutation({
    mutationFn: registerClient,
    onSuccess: () => {
      toast.success('Cliente registrado exitosamente', {
        position: 'top-right',
        autoClose: 3000,
      });
      reset(); // Limpia el formulario
      navigate('/client-list'); // Navega a la lista de clientes
    },
    onError: (error) => {
      if (error.message.includes('Sesión expirada')) {
        navigate('/login'); // Redirige al login si hay error de autenticación
      }
      toast.error(error.message, {
        position: 'top-right',
        autoClose: 3000,
      });
    },
  });

  const onSubmit = (data) => {
    mutation.mutate({ data, token });
  };

  if (loading) {
    return <div className="text-center mt-5">Cargando...</div>;
  }

  return (
    <div className="client-container">
      <div className="client-box">
        <h2 className="text-center mb-4">
          <i className="bi bi-person-plus-fill me-2"></i>Registrar Cliente
        </h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-3">
            <label htmlFor="nombre" className="form-label">
              <i className="bi bi-person-fill me-2"></i>Nombre
            </label>
            <input
              type="text"
              className={`form-control ${errors.nombre ? 'is-invalid' : ''}`}
              id="nombre"
              {...register('nombre', { required: 'El nombre es obligatorio' })}
            />
            {errors.nombre && <div className="invalid-feedback">{errors.nombre.message}</div>}
          </div>

          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              <i className="bi bi-envelope-fill me-2"></i>Correo Electrónico
            </label>
            <input
              type="email"
              className={`form-control ${errors.email ? 'is-invalid' : ''}`}
              id="email"
              {...register('email', {
                required: 'El correo electrónico es obligatorio',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Por favor, ingresa un correo electrónico válido',
                },
              })}
            />
            {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
          </div>

          <div className="mb-3">
            <label htmlFor="numero" className="form-label">
              <i className="bi bi-telephone-fill me-2"></i>Número de Teléfono
            </label>
            <input
              type="text"
              className={`form-control ${errors.numero ? 'is-invalid' : ''}`}
              id="numero"
              {...register('numero', {
                required: 'El número de teléfono es obligatorio',
                pattern: {
                  value: /^\d+$/,
                  message: 'El número de teléfono debe contener solo dígitos',
                },
              })}
            />
            {errors.numero && <div className="invalid-feedback">{errors.numero.message}</div>}
          </div>

          <div className="mb-3">
            <label htmlFor="genero" className="form-label">
              <i className="bi bi-gender-ambiguous me-2"></i>Género
            </label>
            <select
              className="form-select"
              id="genero"
              {...register('genero', { required: 'El género es obligatorio' })}
            >
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          <div className="d-flex gap-2">
            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <i className="bi bi-arrow-repeat me-2 spin"></i>Registrando...
                </>
              ) : (
                <>
                  <i className="bi bi-check2-circle me-2"></i>Registrar Cliente
                </>
              )}
            </button>
            <button
              type="button"
              className="btn btn-secondary w-100"
              onClick={() => navigate('/client-list')}
              disabled={mutation.isPending}
            >
              <i className="bi bi-x-circle me-2"></i>Cancelar
            </button>
          </div>
        </form>
      </div>
      <ToastContainer />
    </div>
  );
}

export default ClientRegister;