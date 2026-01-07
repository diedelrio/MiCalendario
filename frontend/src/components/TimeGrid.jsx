import React from 'react';

/**
 * TimeGrid Component
 * Muestra una grilla de botones de 30 minutos y gestiona la disponibilidad.
 */
const TimeGrid = ({ 
  appointments = [], // Valor por defecto para evitar errores de .filter()
  selectedSpace, 
  onSelectSlot, 
  startTime, 
  endTime 
}) => {

  // Generamos los bloques de tiempo (Slots) de 08:00 a 20:00
  const generateSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 18; hour++) {
      const h = hour.toString().padStart(2, '0');
      slots.push(`${h}:00`);
      if (h!=='18')
        slots.push(`${h}:30`);
    }
    return slots;
  };

  const slots = generateSlots();

  /**
   * Verifica si un horario específico está lleno según el espacio seleccionado.
   */
  const checkOccupancy = (time) => {
    if (!selectedSpace) return false;
    
    // Filtramos citas que coincidan con este slot de tiempo y este espacio
    const concurrentAppos = appointments.filter(appo => {
      // Importante: aseguramos que los IDs sean del mismo tipo para comparar
      return (
        Number(appo.spaceId) === Number(selectedSpace.id) &&
        time >= appo.startTime &&
        time < appo.endTime
      );
    });

    // Lógica de disponibilidad:
    // Si hay tantas o más citas que la capacidad del espacio, está "Ocupado".
    return concurrentAppos.length >= selectedSpace.capacity;
  };

  /**
   * Determina si un botón debe aparecer como "Seleccionado" 
   * (cuando el usuario marca un rango de inicio a fin).
   */
  const isSelected = (time) => {
    if (!startTime) return false;
    if (time === startTime) return true;
    if (endTime && time > startTime && time < endTime) return true;
    if (time === endTime) return true;
    return false;
  };

  return (
    <div className="time-grid-container">
      <h4 style={{ marginBottom: '10px', color: '#4a5568' }}>
        Disponibilidad: {selectedSpace ? selectedSpace.name : "Seleccione un espacio"}
      </h4>
      
      <div className="grid-slots">
        {slots.map(slot => {
          const isBusy = checkOccupancy(slot);
          const selected = isSelected(slot);

          return (
            <button
              key={slot}
              type="button"
              className={`slot-btn ${isBusy ? 'busy' : 'free'} ${selected ? 'selected' : ''}`}
              disabled={isBusy}
              onClick={() => onSelectSlot(slot)}
              title={isBusy ? "Espacio agotado" : `Reservar a las ${slot}`}
            >
              {slot}
            </button>
          );
        })}
      </div>

      {!selectedSpace && (
        <p className="helper-text" style={{ color: '#a0aec0', fontSize: '0.85rem', marginTop: '10px' }}>
          * Elija un escritorio o sala arriba para ver los horarios.
        </p>
      )}
    </div>
  );
};

export default TimeGrid;