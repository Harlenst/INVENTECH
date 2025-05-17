import React, { useState, useEffect } from 'react';

const SystemSettings = () => {
  const [settings, setSettings] = useState({ limite_inventario: 10, notificaciones: true, dias_vencimiento: 30 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (!response.ok) throw new Error('Error al obtener configuraciones');
        const data = await response.json();
        setSettings(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({ ...settings, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(settings),
      });
      if (!response.ok) throw new Error('Error al actualizar configuraciones');
      alert('Configuraciones actualizadas correctamente');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <p>Cargando...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Configuraciones del Sistema</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Límite de Inventario</label>
          <input
            type="number"
            name="limite_inventario"
            value={settings.limite_inventario}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Notificaciones</label>
          <input
            type="checkbox"
            name="notificaciones"
            checked={settings.notificaciones}
            onChange={handleChange}
            className="mt-1 form-checkbox"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Días de Vencimiento</label>
          <input
            type="number"
            name="dias_vencimiento"
            value={settings.dias_vencimiento}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Guardar Configuraciones
        </button>
      </form>
    </div>
  );
};

export default SystemSettings;