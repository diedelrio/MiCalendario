// backend/utils/validators.js

async function checkScheduleConflict(prisma, date, startTime) {
  // Buscamos si existe una cita en esa fecha y hora
  const existing = await prisma.appointment.findFirst({
    where: {
      date: date,
      startTime: startTime,
    },
  });

  // Si existe devuelve true (hay conflicto), si no, false
  return !!existing; 
}

// Exportamos la función para usarla en otros archivos
module.exports = { checkScheduleConflict };