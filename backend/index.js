const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
// Cambiamos checkScheduleConflict por la nueva lógica de disponibilidad por espacio
const { checkSpaceAvailability } = require('./utils/validators');
const { createSeries } = require('./utils/appointmentHelpers');

const app = express();
const prisma = new PrismaClient();

// Middlewares
app.use(cors());
app.use(express.json());

// Configuraciones de tiempo desde .env o valores por defecto
const TIEMPO_MINIMO = parseInt(process.env.TIEMPO_MINIMO_MINUTOS) || 60;
const RANGO_PASO = parseInt(process.env.RANGO_PASO_MINUTOS) || 30;

// Función auxiliar para validar reglas de negocio de tiempo
const validarHoras = (startTime, endTime) => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    if (start.getMinutes() % RANGO_PASO !== 0 || end.getMinutes() % RANGO_PASO !== 0) {
        return { valido: false, msg: `Las horas deben ser múltiplos de ${RANGO_PASO} minutos.` };
    }

    const duracion = (end - start) / (1000 * 60); 
    if (duracion < TIEMPO_MINIMO) {
        return { valido: false, msg: `La cita debe durar al menos ${TIEMPO_MINIMO} minutos.` };
    }

    return { valido: true };
};

// --- RUTAS PARA ESPACIOS ---

app.get('/spaces', async (req, res) => {
    try {
        const spaces = await prisma.space.findMany({
            where: { status: 'Activo' }
        });
        res.json(spaces);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener espacios" });
    }
});

// --- RUTAS PARA CITAS (Appointments) ---

app.get('/appointments', async (req, res) => {
    try {
        const appointments = await prisma.appointment.findMany({
            include: { space: true }, // Incluye detalles del espacio reservado
            orderBy: [
                { date: 'asc' }, 
                { startTime: 'asc' }
            ]
        });
        // Para cada cita, contamos cuántas hermanas tiene con el mismo parentId
        const appointmentsWithCount = await Promise.all(appointments.map(async (appo) => {
            if (appo.parentId) {
                const count = await prisma.appointment.count({
                    where: { parentId: appo.parentId }
                });
                return { ...appo, seriesCount: count };
            }
            return { ...appo, seriesCount: 1 };
        }));

        res.json(appointmentsWithCount);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener las citas" });
    }
});

// --- RUTA POST ACTUALIZADA (Crea la serie y soluciona el error de sintaxis) ---
app.post('/appointments', async (req, res) => {
    // 1. Extraemos los datos del body
    const { 
        isRecurring, weeks, date, ...rest 
    } = req.body;

    try {
        // 2. Validar formato de horas (usando tu función existente)
        const validacion = validarHoras(rest.startTime, rest.endTime);
        if (!validacion.valido) {
            return res.status(400).json({ message: validacion.msg });
        }

        // 3. Crear la primera cita (La "Madre" de la serie o cita única)
        // Usamos checkSpaceAvailability antes de crearla
        const isAvailable = await checkSpaceAvailability(prisma, rest.spaceId, date, rest.startTime, rest.endTime);
        if (!isAvailable) {
            return res.status(400).json({ message: `Conflicto: El espacio no está disponible el día ${date}` });
        }

        const firstAppo = await prisma.appointment.create({
            data: { 
                ...rest, 
                date, 
                isRecurring: isRecurring || false, 
                spaceId: parseInt(rest.spaceId) 
            }
        });

        // 4. Lógica de Recurrencia: Si es más de 1 semana, usamos el helper
        if (isRecurring && parseInt(weeks) > 1) {
            // Vinculamos la primera cita a sí misma como padre
            await prisma.appointment.update({ 
                where: { id: firstAppo.id }, 
                data: { parentId: firstAppo.id } 
            });
            
            // Calculamos la fecha de la segunda cita (7 días después de la primera)
            const nextDate = new Date(date + "T00:00:00");
            nextDate.setDate(nextDate.getDate() + 7);
            const startDateNext = nextDate.toISOString().split('T')[0];

            // Llamamos a la función centralizada de tu carpeta utils
            // Enviamos (weeks - 1) porque la primera ya la creamos arriba
            await createSeries(prisma, rest, startDateNext, parseInt(weeks) - 1, firstAppo.id);
        }

        res.status(201).json({ message: "Cita(s) creada(s) con éxito" });

    } catch (error) {
        console.error("ERROR EN POST:", error.message);
        res.status(400).json({ message: error.message });
    }
});

app.put('/appointments/:id', async (req, res) => {
  const { id } = req.params;
  const { title, clientName, date, startTime, endTime, spaceId, editAllSeries, weeks } = req.body;
  const appointmentId = parseInt(id);

  try {
    // 1. Buscamos la cita original
    const original = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!original) return res.status(404).json({ message: "Cita no encontrada" });

    if (editAllSeries && original.parentId) {
      // --- ESCENARIO A: EDITAR TODA LA SERIE ---

      // 1. Actualizamos los datos comunes de todas las citas actuales de la serie
      await prisma.appointment.updateMany({
        where: { parentId: original.parentId },
        data: { title, clientName, startTime, endTime, spaceId: parseInt(spaceId) }
      });

      // 2. Lógica de Extensión
      const currentCount = await prisma.appointment.count({
        where: { parentId: original.parentId }
      });
      const goalWeeks = parseInt(weeks);

      if (goalWeeks > currentCount) {
        const lastAppo = await prisma.appointment.findFirst({
          where: { parentId: original.parentId },
          orderBy: { date: 'desc' }
        });

        // --- INICIO DE LA CORRECCIÓN DE FECHA ---
        // 1. Descomponemos el string YYYY-MM-DD de la última cita
        const [y, m, d] = lastAppo.date.split('-').map(Number);
        
        // 2. Creamos la fecha a mediodía (12:00) para evitar saltos de día por zona horaria
        const nextDateObj = new Date(y, m - 1, d, 12, 0, 0);
        
        // 3. Sumamos 7 días
        nextDateObj.setDate(nextDateObj.getDate() + 7);
        
        // 4. Formateamos manualmente a YYYY-MM-DD
        const nextY = nextDateObj.getFullYear();
        const nextM = String(nextDateObj.getMonth() + 1).padStart(2, '0');
        const nextD = String(nextDateObj.getDate()).padStart(2, '0');
        const startDateNext = `${nextY}-${nextM}-${nextD}`;
        // --- FIN DE LA CORRECCIÓN ---

        // Usamos el helper centralizado
        await createSeries(
          prisma, 
          { title, clientName, startTime, endTime, spaceId }, 
          startDateNext, 
          goalWeeks - currentCount, 
          original.parentId
        );
      }

      return res.json({ message: "Serie actualizada y extendida con éxito" });

    } else {
      // --- ESCENARIO B: EDITAR SOLO ESTA CITA ---
      const isAvailable = await checkSpaceAvailability(prisma, spaceId, date, startTime, endTime, appointmentId);
      
      if (!isAvailable) {
        return res.status(400).json({ message: "Espacio ocupado por otra reserva." });
      }

      const updated = await prisma.appointment.update({
        where: { id: appointmentId },
        data: { title, clientName, date, startTime, endTime, spaceId: parseInt(spaceId) },
      });
      res.json(updated);
    }
  } catch (error) {
    console.error("ERROR EN PUT:", error.message);
    res.status(400).json({ message: error.message });
  }
});

// --- RUTA DELETE ACTUALIZADA (Soluciona el error de Prisma findUnique) ---
app.delete('/appointments/:id', async (req, res) => {
    const { id } = req.params;
    const { deleteAll } = req.query;

    // Validación de ID para evitar que Prisma reciba undefined o NaN
    const appointmentId = parseInt(id);
    if (isNaN(appointmentId)) {
        return res.status(400).json({ error: "ID de cita no válido" });
    }

    try {
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId } // Se asegura que sea un Int válido
        });

        if (!appointment) {
            return res.status(404).json({ message: "Cita no encontrada" });
        }

        if (deleteAll === 'true' && appointment.parentId) {
            await prisma.appointment.deleteMany({
                where: { parentId: appointment.parentId }
            });
            res.json({ message: "Serie eliminada" });
        } else {
            await prisma.appointment.delete({
                where: { id: appointmentId }
            });
            res.json({ message: "Cita eliminada" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar" });
    }
});

// --- RUTAS PARA NOTAS ---

app.get('/notes', async (req, res) => {
    const notes = await prisma.note.findMany({
        orderBy: { createdAt: 'desc' }
    });
    res.json(notes);
});

app.post('/notes', async (req, res) => {
    const { content } = req.body;
    const newNote = await prisma.note.create({
        data: { content }
    });
    res.json(newNote);
});

app.delete('/notes/:id', async (req, res) => {
    await prisma.note.delete({
        where: { id: parseInt(req.params.id) }
    });
    res.json({ message: "Nota eliminada" });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor MiCalendario Pro corriendo en http://localhost:${PORT}`);
});