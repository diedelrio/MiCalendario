// src/components/AppointmentList.jsx
import React from 'react';

const AppointmentList = ({ appointments, hoy, startEdit, deleteAppo }) => {
  return (
    <div className="list-container">
      <h2>Citas Agendadas</h2>
      <div className="list">
        {appointments.map(appo => (
          <div 
            key={appo.id} 
            className="admin-card card-item" 
            style={{ borderLeft: `6px solid ${appo.date === hoy ? '#27ae60' : '#4a90e2'}` }}
          >
            <div className="card-info">
              <h3>{appo.title} - {appo.clientName}</h3>
              <p>📅 {appo.date === hoy ? '¡HOY!' : appo.date} | 🕒 {appo.startTime} a {appo.endTime}</p>
            </div>
            <div className="card-actions">
              <button onClick={() => startEdit(appo)} className="btn-edit">Editar</button>
              <button onClick={() => deleteAppo(appo)} className="btn-delete">Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AppointmentList;