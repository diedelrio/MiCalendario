// src/components/AppointmentForm.jsx
import React from 'react';

const AppointmentForm = ({ 
  handleSubmit, setTitle, setClientName, setDate, setStartTime, setEndTime,
  title, clientName, date, startTime, endTime, editId, setEditId, resetForm 
}) => {
  const handleCancel = () => {
    setEditId(null); // Sale del modo edición
    resetForm();     // Limpia todos los inputs (incluyendo el estado de App.jsx)
  };
  return (
    <div className="admin-card">
      <form onSubmit={handleSubmit} className="appointment-form">
        <h2>{editId ? 'Actualizar Cita' : 'Nueva Cita'}</h2>
        <input type="text" placeholder="Nombre del cliente" value={clientName} onChange={(e) => setClientName(e.target.value)} required />
        <input type="text" placeholder="Título de la cita" value={title} onChange={(e) => setTitle(e.target.value)} required />


        {/* NUEVO CONTENEDOR PARA LAS HORAS */}
        <div className="time-row">
          <div className="input-group">
            <label>Fecha:</label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              required 
            />
          </div>
          <div className="input-group">
            <label>Desde:</label>
            <input 
              type="time" 
              value={startTime} 
              onChange={(e) => setStartTime(e.target.value)} 
              step="1800" // 1800 segundos = 30 minutos
              required 
            />
          </div>
          <div className="input-group">
            <label>Hasta:</label>
            <input 
              type="time" 
              value={endTime} 
              onChange={(e) => setEndTime(e.target.value)} 
              step="1800" // Esto hace que el selector suba/baje de 30 en 30
              required 
            />
          </div>
        </div>
        <div className="form-buttons">
          <button type="submit" className="btn-save">{editId ? 'Actualizar' : 'Guardar'}</button>
          {editId && <button type="button" onClick={handleCancel} className="btn-cancel">Cancelar</button>}
        </div>
      </form>
    </div>
  );
};

export default AppointmentForm;