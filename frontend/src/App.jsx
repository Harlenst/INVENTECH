import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

// Estilos (importados al inicio)
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/index.css';
import './styles/custom.css';

// Contexto y Componentes de Protección
import { AuthContext, AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Componentes
import NavBar from './components/NavBar';

// Páginas Públicas
import Login from './pages/Login';
import Register from './pages/Register';

// Páginas para Administradores
import AdminAttendance from './pages/AdminAttendance';
import AdminMenu from './pages/AdminMenu';
import AdminStats from './pages/AdminStats';
import RoleAssignment from './pages/RoleAssignment';
import UsersList from './pages/UsersList';
import AdminExtraHours from './pages/AdminExtraHours';
import UserEdit from './pages/UserEdit';
import UserDelete from './pages/UserDelete';
import FinancialReports from './pages/FinancialReports';
import ExportReports from './pages/ExportReports';
import PendingPurchases from './pages/PendingPurchases';
import ReturnsHistory from './pages/ReturnsHistory';
import SystemSettings from './pages/SystemSettings';
import Permissions from './pages/Permissions';
import InventoryAlerts from './pages/InventoryAlerts';
import AlertHistory from './pages/AlertHistory';

// Páginas para Empleados
import EmployeeMenu from './pages/EmployeeMenu';
import EmployeePurchase from './pages/EmployeePurchase';
import ExtraHours from './pages/ExtraHours';

// Páginas Compartidas (Admin y Empleado)
import AttendanceHistory from './pages/AttendanceHistory';
import ChangePassword from './pages/ChangePassword';
import ClientList from './pages/ClientList';
import ClientRegister from './pages/ClientRegister';
import ProductList from './pages/ProductList';
import ProductRegister from './pages/ProductRegister';
import Profile from './pages/Profile';
import ScheduleSelection from './pages/ScheduleSelection';

// Nuevas Vistas
import Dashboard from './pages/Dashboard';
import InventoryOverview from './pages/InventoryOverview';
import PurchaseHistory from './pages/PurchaseHistory';

// Páginas de Error
import NotFound from './pages/NotFound';

function AppContent() {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const hideNavBar = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/';

  return (
    <div>
      {!hideNavBar && user && <NavBar />}
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Rutas Protegidas */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/admin-menu" element={<ProtectedRoute><AdminMenu /></ProtectedRoute>} />
        <Route path="/employee-menu" element={<ProtectedRoute><EmployeeMenu /></ProtectedRoute>} />
        <Route path="/admin-attendance" element={<ProtectedRoute><AdminAttendance /></ProtectedRoute>} />
        <Route path="/admin-stats" element={<ProtectedRoute><AdminStats /></ProtectedRoute>} />
        <Route path="/role-assignment" element={<ProtectedRoute><RoleAssignment /></ProtectedRoute>} />
        <Route path="/users-list" element={<ProtectedRoute><UsersList /></ProtectedRoute>} />
        <Route path="/admin-extra-hours" element={<ProtectedRoute><AdminExtraHours /></ProtectedRoute>} />
        <Route path="/employee-purchase" element={<ProtectedRoute><EmployeePurchase /></ProtectedRoute>} />
        <Route path="/attendance-history" element={<ProtectedRoute><AttendanceHistory /></ProtectedRoute>} />
        <Route path="/extra-hours" element={<ProtectedRoute><ExtraHours /></ProtectedRoute>} />
        <Route path="/schedule-selection" element={<ProtectedRoute><ScheduleSelection /></ProtectedRoute>} />
        <Route path="/client-list" element={<ProtectedRoute><ClientList /></ProtectedRoute>} />
        <Route path="/client-register" element={<ProtectedRoute><ClientRegister /></ProtectedRoute>} />
        <Route path="/product-list" element={<ProtectedRoute><ProductList /></ProtectedRoute>} />
        <Route path="/product-register" element={<ProtectedRoute><ProductRegister /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
        <Route path="/inventory-overview" element={<ProtectedRoute><InventoryOverview /></ProtectedRoute>} />
        <Route path="/purchase-history" element={<ProtectedRoute><PurchaseHistory /></ProtectedRoute>} />

        {/* Rutas Dinámicas para Administradores */}
        <Route path="/user-edit/:id" element={<ProtectedRoute><UserEdit /></ProtectedRoute>} />
        <Route path="/user-delete/:id" element={<ProtectedRoute><UserDelete /></ProtectedRoute>} />
        <Route path="/financial-reports" element={<ProtectedRoute><FinancialReports /></ProtectedRoute>} />
        <Route path="/export-reports" element={<ProtectedRoute><ExportReports /></ProtectedRoute>} />
        <Route path="/pending-purchases" element={<ProtectedRoute><PendingPurchases /></ProtectedRoute>} />
        <Route path="/returns-history" element={<ProtectedRoute><ReturnsHistory /></ProtectedRoute>} />
        <Route path="/system-settings" element={<ProtectedRoute><SystemSettings /></ProtectedRoute>} />
        <Route path="/permissions/:id" element={<ProtectedRoute><Permissions /></ProtectedRoute>} />
        <Route path="/inventory-alerts" element={<ProtectedRoute><InventoryAlerts /></ProtectedRoute>} />
        <Route path="/alert-history" element={<ProtectedRoute><AlertHistory /></ProtectedRoute>} />

        {/* Ruta para 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;