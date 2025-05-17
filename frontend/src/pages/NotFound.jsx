import React from 'react';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="container mt-5 text-center">
      <h1 className="display-1 text-white">404</h1>
      <p className="lead text-white">Página no encontrada</p>
      <Link to="/" className="btn btn-primary">
        Volver al Inicio
      </Link>
    </div>
  );
}

export default NotFound;