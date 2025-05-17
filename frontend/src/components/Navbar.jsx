import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function Navbar() {
  const context = useContext(AuthContext);
  const user = context?.user;
  const logout = context?.logout;
  const loading = context?.loading ?? false;
  const navigate = useNavigate();

  const handleLogout = () => {
    if (logout) {
      logout();
      navigate('/login');
    }
  };

  if (loading) {
    return null;
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <nav
      className="navbar navbar-expand-lg"
      style={{
        background: 'linear-gradient(90deg, #1C2526 0%, #2A3435 100%)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        fontFamily: "'Poppins', sans-serif",
        padding: '1rem 2rem',
      }}
    >
      <div className="container-fluid">
        <Link
          className="navbar-brand d-flex align-items-center"
          to="/admin-menu"
          style={{
            color: '#FFD700',
            fontWeight: '600',
            fontSize: '1.8rem',
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.2)',
            transition: 'color 0.3s ease',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => (e.target.style.color = '#FFEC5C')}
          onMouseLeave={(e) => (e.target.style.color = '#FFD700')}
        >
          <i
            className="bi bi-gear me-2"
            style={{ fontSize: '2rem', animation: 'spin 4s infinite linear', color: '#FFD700' }}
          ></i>
          INVENTECH
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
          style={{ border: '1px solid #FFD700', padding: '0.3rem 0.6rem' }}
        >
          <span className="navbar-toggler-icon" style={{ filter: 'brightness(1.5)' }}></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0 align-items-lg-center">
            <li className="nav-item">
              <Link
                className="nav-link"
                to="/dashboard"
                style={{
                  color: '#FFFFFF',
                  fontSize: '1.1rem',
                  padding: '0.8rem 1.2rem',
                  transition: 'all 0.3s ease',
                  borderRadius: '5px',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(255, 215, 0, 0.1)';
                  e.target.style.color = '#FFD700';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#FFFFFF';
                }}
              >
                <i className="bi bi-house-door me-2" style={{ color: '#FFD700' }}></i>
                Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className="nav-link"
                to="/profile"
                style={{
                  color: '#FFFFFF',
                  fontSize: '1.1rem',
                  padding: '0.8rem 1.2rem',
                  transition: 'all 0.3s ease',
                  borderRadius: '5px',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(255, 215, 0, 0.1)';
                  e.target.style.color = '#FFD700';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#FFFFFF';
                }}
              >
                <i className="bi bi-person-circle me-2" style={{ color: '#FFD700' }}></i>
                Perfil
              </Link>
            </li>
            <li className="nav-item">
              <button
                className="nav-link btn btn-link"
                onClick={handleLogout}
                style={{
                  color: '#FFFFFF',
                  fontSize: '1.1rem',
                  padding: '0.8rem 1.2rem',
                  transition: 'all 0.3s ease',
                  borderRadius: '5px',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(255, 215, 0, 0.1)';
                  e.target.style.color = '#FFD700';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#FFFFFF';
                }}
              >
                <i className="bi bi-box-arrow-right me-2" style={{ color: '#FFD700' }}></i>
                Cerrar Sesión
              </button>
            </li>
          </ul>
        </div>
      </div>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .navbar-nav .nav-link.active {
            background-color: rgba(255, 215, 0, 0.2) !important;
            color: #FFD700 !important;
            font-weight: 500;
          }

          .navbar-collapse {
            transition: all 0.3s ease;
          }

          @media (max-width: 991px) {
            .navbar-nav {
              padding: 1rem;
              background: #2A3435;
              border-radius: 8px;
              margin-top: 0.5rem;
            }
            .nav-item {
              margin: 0.3rem 0;
            }
            .nav-link {
              font-size: 1.2rem !important;
              padding: 0.6rem 1rem !important;
            }
          }
        `}
      </style>
    </nav>
  );
}

export default Navbar;