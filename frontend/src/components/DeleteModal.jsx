// src/components/DeleteModal.jsx
import React from 'react';

const DeleteModal = ({ isOpen, onClose, onDeleteOne, onDeleteAll }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div className="admin-card modal-content" style={{ 
        minWidth: '350px', 
        padding: '30px',
        display: 'flex',           // Activamos Flexbox
        flexDirection: 'column',    // Alineación Vertical (uno debajo del otro)
        alignItems: 'center',       // Centrado Horizontal de los hijos
        textAlign: 'center'         // Centrado del texto
      }}>
        <h3 style={{ marginBottom: '10px', marginTop: 0 }}>Eliminar Cita Recurrente</h3>
        <p style={{ marginBottom: '25px', color: '#4a5568' }}>
          ¿Qué acción deseas realizar con esta serie?
        </p>
        
        {/* Contenedor de botones */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px', 
          width: '100%' // Para que los botones tengan el mismo ancho
        }}>
          <button onClick={onDeleteOne} className="btn-save" style={{ background: '#3182ce', color: 'white', padding: '10px' }}>
            Solo esta cita
          </button>
          <button onClick={onDeleteAll} className="btn-delete" style={{ background: '#e53e3e', color: 'white', padding: '10px' }}>
            Toda la serie
          </button>
          <button onClick={onClose} className="btn-cancel" style={{ padding: '10px', border: '1px solid #ccc', background: 'white' }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;