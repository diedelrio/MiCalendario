// backend/utils/validators.js
async function checkSpaceAvailability(prisma, spaceId, date, startTime, endTime, excludeId = null) {
  const space = await prisma.space.findUnique({ 
    where: { id: parseInt(spaceId) } 
  });

  if (!space) throw new Error("Espacio no encontrado");

  // Buscamos citas que se solapen, pero EXCLUIMOS la que estamos editando
  const overlaps = await prisma.appointment.findMany({
    where: {
      spaceId: parseInt(spaceId),
      date: date,
      id: excludeId ? { not: parseInt(excludeId) } : undefined, // <--- CLAVE: Ignorar el ID actual
      OR: [
        { startTime: { lt: endTime }, endTime: { gt: startTime } }
      ]
    }
  });

  return overlaps.length < space.capacity;
}

module.exports = { checkSpaceAvailability };