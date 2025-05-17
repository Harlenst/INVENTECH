import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';


function ScheduleSelection() {
  const [selectedDate, setSelectedDate] = useState(null);

  const handleDateClick = (info) => {
    setSelectedDate(info.dateStr);
    const modal = new bootstrap.Modal(document.getElementById('shiftModal'));
    modal.show();
  };

  const handleSaveShift = async () => {
    try {
      const shift = document.querySelector('input[name="shift"]:checked')?.value;
      if (!shift) {
        alert('Por favor, selecciona un turno');
        return;
      }
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const userResponse = await fetch('/api/user', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (userResponse.status === 401 || userResponse.status === 403) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      if (!userResponse.ok) {
        throw new Error(`Error HTTP ${userResponse.status}`);
      }
      const user = await userResponse.json();

      const dataToSend = {
        fecha: selectedDate,
        turno: shift,
        usuario_id: user.id,
        nombre_empleado: user.nombre
      };

      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSend)
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }

      const result = await response.json();
      if (response.ok) {
        alert('Horario guardado exitosamente');
        bootstrap.Modal.getInstance(document.getElementById('shiftModal')).hide();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error al guardar el horario:', error);
      alert('Error al guardar el horario: ' + error.message);
    }
  };

  return (
    <div className="client-container">
      <div className="client-box">
        <h2 className="text-center mb-4">
          <i className="bi bi-calendar-fill me-2"></i>Historial de asistencias
        </h2>
        <FullCalendar
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          selectable={true}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: ''
          }}
          dateClick={handleDateClick}
          events={async () => {
            try {
              const token = localStorage.getItem('token');
              if (!token) {
                window.location.href = '/login';
                return [];
              }

              const userResponse = await fetch('/api/user', {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (userResponse.status === 401 || userResponse.status === 403) {
                localStorage.removeItem('token');
                window.location.href = '/login';
                return [];
              }
              const user = await userResponse.json();
              const usuario_id = user.id;

              // Obtener horarios
              const userResponseSchedules = await fetch(`/api/schedules?usuario_id=${usuario_id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              const userSchedules = await userResponseSchedules.json();

              const allResponseSchedules = await fetch('/api/schedules', {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              const allSchedules = await allResponseSchedules.json();

              // Obtener asistencias
              const userResponseAttendances = await fetch(`/api/attendances?usuario_id=${usuario_id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              const userAttendances = await userResponseAttendances.json();

              const allResponseAttendances = await fetch('/api/attendances', {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              const allAttendances = await allResponseAttendances.json();

              // Eventos de horarios
              const userScheduleEvents = userSchedules.map(schedule => ({
                title: `Tú (${schedule.turno})`,
                start: schedule.fecha,
                allDay: true,
                backgroundColor: '#5a65ea',
                borderColor: '#4a55d8'
              }));
              const otherScheduleEvents = allSchedules
                .filter(schedule => schedule.usuario_id !== usuario_id)
                .map(schedule => ({
                  title: `${schedule.nombre_empleado} (${schedule.turno})`,
                  start: schedule.fecha,
                  allDay: true,
                  backgroundColor: '#6c757d',
                  borderColor: '#5a6268'
                }));

              // Eventos de asistencias
              const userAttendanceEvents = userAttendances.map(attendance => ({
                title: `Asistencia: ${attendance.estado}${attendance.confirmado ? ' (Confirmado)' : ''}`,
                start: attendance.fecha,
                allDay: true,
                backgroundColor: attendance.estado === 'presente' ? '#28a745' : attendance.estado === 'ausente' ? '#dc3545' : '#ffc107',
                borderColor: attendance.estado === 'presente' ? '#218838' : attendance.estado === 'ausente' ? '#c82333' : '#e0a800'
              }));
              const otherAttendanceEvents = allAttendances
                .filter(attendance => attendance.usuario_id !== usuario_id)
                .map(attendance => ({
                  title: `${attendance.nombre_empleado}: ${attendance.estado}${attendance.confirmado ? ' (Confirmado)' : ''}`,
                  start: attendance.fecha,
                  allDay: true,
                  backgroundColor: attendance.estado === 'presente' ? '#28a745' : attendance.estado === 'ausente' ? '#dc3545' : '#ffc107',
                  borderColor: attendance.estado === 'presente' ? '#218838' : attendance.estado === 'ausente' ? '#c82333' : '#e0a800'
                }));

              return [...userScheduleEvents, ...otherScheduleEvents, ...userAttendanceEvents, ...otherAttendanceEvents];
            } catch (error) {
              console.error('Error al cargar eventos:', error);
              return [];
            }
          }}
        />

        {/* Modal para seleccionar turno */}
        <div className="modal fade" id="shiftModal" tabIndex="-1" aria-labelledby="shiftModalLabel" aria-hidden="true">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="shiftModalLabel">Seleccionar Turno</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <p>Fecha seleccionada: <span>{selectedDate}</span></p>
                <div className="form-check">
                  <input className="form-check-input" type="radio" name="shift" id="morning" value="Mañana" defaultChecked />
                  <label className="form-check-label" htmlFor="morning">Mañana</label>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="radio" name="shift" id="afternoon" value="Tarde" />
                  <label className="form-check-label" htmlFor="afternoon">Tarde</label>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="radio" name="shift" id="night" value="Noche" />
                  <label className="form-check-label" htmlFor="night">Noche</label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                <button type="button" className="btn btn-primary" onClick={handleSaveShift}>Guardar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScheduleSelection;