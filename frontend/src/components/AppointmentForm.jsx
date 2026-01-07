import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TimeGrid from './TimeGrid';

const AppointmentForm = ({ 
  handleSubmit, setTitle, setClientName, setDate, setStartTime, setEndTime,
  title, clientName, date, startTime, endTime, editId, setEditId, resetForm,
  appointmentsOfDay 
}) => {
  const [spaces, setSpaces] = useState([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [weeks, setWeeks] = useState(1);

  // Cargar el catálogo de espacios desde el backend
  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        const res = await axios.get('http://localhost:3000/spaces');
        setSpaces(res.data);
      } catch (err) {
        console.error("Error al cargar espacios", err);
      }
    };
    fetchSpaces();
  }, []);

  // Sincronizar el selector de espacio cuando se entra en modo edición
useEffect(() => {
  if (editId && appointmentsOfDay) {
    const editingAppo = appointmentsOfDay.find(a => a.id === editId);
    if (editingAppo) {
      setSelectedSpaceId(editingAppo.spaceId.toString());
      
      const esRecurrente = !!editingAppo.parentId;
      setIsRecurring(esRecurrente);
      
      // CARGAR EL NÚMERO DE SEMANAS REAL
      // Usamos el seriesCount que viene del backend
      if (esRecurrente && editingAppo.seriesCount) {
        setWeeks(editingAppo.seriesCount); 
      } else {
        setWeeks(1);
      }
    }
  }
}, [editId, appointmentsOfDay]);

  const handleCancel = () => {
    setEditId(null);
    resetForm();
    setSelectedSpaceId("");
    setIsRecurring(false);
  };

  // Lógica para seleccionar el rango de horas en el TimeGrid
  const handleSlotClick = (slot) => {
    if (!startTime || (startTime && endTime)) {
      setStartTime(slot);
      setEndTime(""); 
    } else if (slot > startTime) {
      setEndTime(slot);
    } else {
      setStartTime(slot);
    }
  };

  const selectedSpace = spaces.find(s => s.id === parseInt(selectedSpaceId));

  return (
    <div className="admin-card">
      <form onSubmit={(e) => handleSubmit(e, { 
        spaceId: parseInt(selectedSpaceId), 
        isRecurring, 
        weeks: parseInt(weeks) 
      })}>
        <h2>{editId ? 'Actualizar Cita' : 'Nueva Reserva'}</h2>
        
        <div className="input-group">
          <label>Ubicación / Espacio:</label>
          <select 
            value={selectedSpaceId} 
            onChange={(e) => setSelectedSpaceId(e.target.value)} 
            required
          >
            <option value="">-- Seleccione un espacio --</option>
            {spaces.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.type} - Cap: {s.capacity})
              </option>
            ))}
          </select>
        </div>

        <input 
          type="text" 
          placeholder="Nombre del cliente" 
          value={clientName} 
          onChange={(e) => setClientName(e.target.value)} 
          required 
        />
        
        <input 
          type="text" 
          placeholder="Motivo / Título" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          required 
        />

        <div className="input-group">
          <label>Fecha de la cita:</label>
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
            required 
          />
        </div>

        {/* Componente visual de selección de horas */}
        <TimeGrid 
          appointments={appointmentsOfDay} 
          selectedSpace={selectedSpace}
          onSelectSlot={handleSlotClick}
          startTime={startTime}
          endTime={endTime}
        />

        <div className="recurrence-section" style={{ marginTop: '15px', padding: '10px', background: '#f8fafc', borderRadius: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={isRecurring} 
              onChange={(e) => setIsRecurring(e.target.checked)} 
            />
            <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>¿Es una reserva recurrente?</span>
          </label>
          
          {isRecurring && (
            <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ fontSize: '0.85rem' }}>Repetir por:</label>
              <input 
                type="number" 
                min="1" max="12" 
                value={weeks} 
                onChange={(e) => setWeeks(e.target.value)} 
                style={{ width: '60px', padding: '4px' }}
              />
              <span style={{ fontSize: '0.85rem' }}>semanas</span>
            </div>
          )}
        </div>

        <div className="time-display-summary" style={{ margin: '15px 0', padding: '10px', border: '1px dashed #3182ce', borderRadius: '8px', textAlign: 'center' }}>
          Horario seleccionado: <br />
          <strong style={{ color: '#3182ce' }}>{startTime || "--:--"}</strong> hasta <strong style={{ color: '#3182ce' }}>{endTime || "--:--"}</strong>
        </div>

        <div className="form-buttons">
          <button 
            type="submit" 
            className="btn-save" 
            disabled={!startTime || !endTime || !selectedSpaceId}
          >
            {editId ? 'Guardar Cambios' : 'Confirmar Reserva'}
          </button>
          <button type="button" onClick={handleCancel} className="btn-cancel">
            {editId ? 'Cancelar' : 'Limpiar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AppointmentForm;