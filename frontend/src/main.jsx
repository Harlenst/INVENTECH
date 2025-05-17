import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import 'react-toastify/dist/ReactToastify.css'; // Estilos de react-toastify
import 'bootstrap/dist/css/bootstrap.min.css'; // Estilos de Bootstrap
import 'bootstrap/dist/js/bootstrap.bundle.min.js'; // JavaScript de Bootstrap (incluye Popper.js)

// Crear una instancia de QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Reintentar 1 vez en caso de fallo
      staleTime: 1000 * 60 * 5, // 5 minutos de tiempo de "stale" para consultas
    },
    mutations: {
      retry: 0, // No reintentar mutaciones automáticamente
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);