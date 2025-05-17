import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function AdminMenu() {
  const context = useContext(AuthContext);
  const user = context?.user;
  const loading = context?.loading ?? false;
  const [expanded, setExpanded] = useState({});

  if (loading) {
    return <div className="container mt-5 text-white">Cargando...</div>;
  }

  if (!user || !user.rol || user.rol.toLowerCase() !== 'admin') {
    return null;
  }

  const toggleExpand = (section) => {
    setExpanded((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const menuSections = [
    {
      title: 'Gestión Usuarios',
      icon: 'bi-people',
      options: [
        { label: 'Asignación de Roles', path: '/role-assignment' },
        { label: 'Editar/Eliminar Usuarios', path: '/users-list' },
      ],
    },
    {
      title: 'Gestión Clientes',
      icon: 'bi-person-plus',
      options: [
        { label: 'Registro de Clientes', path: '/client-register' },
        { label: 'Lista de Clientes', path: '/client-list' },
      ],
    },
    {
      title: 'Gestión Productos',
      icon: 'bi-box-seam',
      options: [
        { label: 'Registro de Productos', path: '/product-register' },
        { label: 'Lista de Productos', path: '/product-list' },
      ],
    },
    {
      title: 'Gestión Informes',
      icon: 'bi-bar-chart',
      options: [
        { label: 'Estadísticas', path: '/admin-stats' },
        { label: 'Reportes Financieros', path: '/financial-reports' },
        { label: 'Exportar Reportes', path: '/export-reports' },
      ],
    },
    {
      title: 'Gestión Asistencia',
      icon: 'bi-check2-square',
      options: [
        { label: 'Asistencia de Empleados', path: '/admin-attendance' },
        { label: 'Horas Extras', path: '/admin-extra-hours' },
      ],
    },
    {
      title: 'Gestión Compras',
      icon: 'bi-cart-check',
      options: [
        { label: 'Aprobación de Compras', path: '/pending-purchases' },
        { label: 'Historial de Devoluciones', path: '/returns-history' },
      ],
    },
    {
      title: 'Gestión Configuración',
      icon: 'bi-gear',
      options: [
        { label: 'Configuración General', path: '/system-settings' },
        { label: 'Alertas de Inventario', path: '/inventory-alerts' },
        { label: 'Historial de Alertas', path: '/alert-history' },
      ],
    },
  ];

  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#1C2526' }}>
      <div className="container flex-grow-1 d-flex flex-column justify-content-center py-5">
        <div className="text-center mb-5">
          <h2 className="text-white fw-bolder" style={{ fontFamily: "'Poppins', sans-serif", fontSize: '2.5rem', textShadow: '1px 1px 2px rgba(0, 0, 0, 0.2)' }}>
            Menú Administrador
          </h2>
          <p className="text-white mt-1" style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.2rem', opacity: 0.8 }}>
            Bienvenido(a) {user.nombre} {user.apellido}.
          </p>
        </div>
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4 justify-content-center">
          {menuSections.map((section, index) => (
            <div className="col" key={index}>
              <div
                className="card modern-card h-100 text-center p-4 transition-all"
                style={{
                  cursor: 'pointer',
                  background: expanded[section.title] ? '#2A3435' : '#2E3A3C',
                  border: expanded[section.title] ? '2px solid #FFD700' : 'none',
                  transition: 'all 0.3s ease',
                }}
                onClick={() => toggleExpand(section.title)}
              >
                <div className="card-body d-flex flex-column justify-content-center">
                  <i className={`bi ${section.icon} text-warning fs-2 mb-3`}></i>
                  <h5 className="card-title text-white fw-medium mb-3">{section.title}</h5>
                  <div
                    className="submenu"
                    style={{
                      maxHeight: expanded[section.title] ? '200px' : '0',
                      opacity: expanded[section.title] ? '1' : '0',
                      overflow: 'hidden',
                      transition: 'max-height 0.3s ease, opacity 0.3s ease',
                    }}
                  >
                    {section.options.map((option, optIndex) => (
                      <Link
                        key={optIndex}
                        to={option.path}
                        className="d-block text-white text-decoration-none mb-2"
                        style={{ fontSize: '0.95rem', transition: 'color 0.3s ease' }}
                        onMouseEnter={(e) => (e.target.style.color = '#FFD700')}
                        onMouseLeave={(e) => (e.target.style.color = '#FFFFFF')}
                      >
                        {option.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminMenu;