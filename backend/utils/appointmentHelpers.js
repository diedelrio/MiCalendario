// backend/utils/appointmentHelpers.js
const { checkSpaceAvailability } = require('./validators');

async function createSeries(prisma, baseData, startDate, numWeeks, parentId) {
    const { title, clientName, startTime, endTime, spaceId } = baseData;
    const created = [];

    // IMPORTANTE: startDate debe ser "YYYY-MM-DD"
    for (let i = 0; i < numWeeks; i++) {
        // Usamos split y Number para asegurar que no haya interpretación de zona horaria
        const [year, month, day] = startDate.split('-').map(Number);
        
        // Creamos la fecha a mediodía (12:00) para que cualquier pequeño desfase 
        // de +/- 1 o 2 horas no cambie el día calendario
        const currentSelection = new Date(year, month - 1, day, 12, 0, 0);
        
        // Sumamos las semanas
        currentSelection.setDate(currentSelection.getDate() + (i * 7));
        
        const y = currentSelection.getFullYear();
        const m = String(currentSelection.getMonth() + 1).padStart(2, '0');
        const d = String(currentSelection.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;

        console.log(`Iteración ${i}: Generando fecha ${dateStr} a partir de base ${startDate}`);

        const isAvailable = await checkSpaceAvailability(prisma, spaceId, dateStr, startTime, endTime);
        if (!isAvailable) {
            throw new Error(`Conflicto: El espacio no tiene capacidad el día ${dateStr}`);
        }

        const newAppo = await prisma.appointment.create({
            data: {
                title,
                clientName,
                date: dateStr,
                startTime,
                endTime,
                spaceId: parseInt(spaceId),
                isRecurring: true,
                parentId: parentId
            }
        });
        created.push(newAppo);
    }
    return created;
}

module.exports = { createSeries };