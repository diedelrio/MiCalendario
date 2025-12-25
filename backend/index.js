const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
const { checkScheduleConflict } = require('./utils/validators'); // Importar

const TIEMPO_MINIMO = parseInt(process.env.TIEMPO_MINIMO_MINUTOS) || 60;
const RANGO_PASO = parseInt(process.env.RANGO_PASO_MINUTOS) || 30;

const validarHoras = (startTime, endTime) => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    // 1. Validar que empiecen y terminen en bloques (00 o 30)
    if (start.getMinutes() % RANGO_PASO !== 0 || end.getMinutes() % RANGO_PASO !== 0) {
        return { valido: false, msg: `Las horas deben ser múltiplos de ${RANGO_PASO} minutos.` };
    }

    // 2. Validar duración mínima
    const duracion = (end - start) / (1000 * 60); // Diferencia en minutos
    if (duracion < TIEMPO_MINIMO) {
        return { valido: false, msg: `La cita debe durar al menos ${TIEMPO_MINIMO} minutos.` };
    }

    return { valido: true };
};

const app = express();
const prisma = new PrismaClient();

// Middlewares
app.use(cors()); // Permite que el frontend se conecte
app.use(express.json()); // Permite recibir datos en formato JSON

// --- RUTAS PARA CITAS (Appointments) ---

// 1. Obtener todas las citas
app.get('/appointments', async (req, res) => {
    try {
        const appointments = await prisma.appointment.findMany({
            orderBy: [
                { date: 'asc'}, 
                { startTime: 'asc' }
             ] // Ordenar por fecha y hora de inicio
        });
        res.json(appointments);
    } catch (error) {
        console.error("--- ERROR DETECTADO EN EL ORDENAMIENTO ---"); //--> DEBUG
        console.error(error.message); //--> DEBUG
        res.status(500).json({ error: "No se pudieron obtener las citas" });
    }
});

// 2. Crear una nueva cita
app.post('/appointments', async (req, res) => {
    console.log("Datos recibidos:", req.body); // <-- DEBUG
  const { 
    title, 
    clientName,
    date, 
    startTime,
    endTime,
    description } = req.body;
    try {
    
    // VALIDAR HORAS
    const { startTime, endTime } = req.body;
    const validacion = validarHoras(startTime, endTime);
    
    if (!validacion.valido) {
        return res.status(400).json({ message: validacion.msg });
    }
    
    // 1. BUSCAR SI YA EXISTE UNA CITA IGUAL
    // Buscamos una cita que coincida en FECHA e HORA DE INICIO
    // LLAMADA A LA FUNCIÓN EXTERNA DE VALIDACIÓN
    const isBusy = await checkScheduleConflict(prisma, date, startTime);
    
    // 2. SI EXISTE, ENVIAMOS UN ERROR Y NO GUARDAMOS
    if (isBusy) {
        return res.status(400).json({ 
        error: "Conflicto", 
        message: "El horario ya está ocupado por otra cita." 
    });
    }
    // 3. SI NO EXISTE, CREAMOS LA CITA
    const newAppointment = await prisma.appointment.create({
      data: { 
        title: title,
        clientName: clientName, 
        date: date,
        startTime: startTime,
        endTime: endTime,
        // Si description es undefined, enviamos un string vacío o null
        description: description || ""
    },
    });
    res.json(newAppointment);
  } catch (error) {
    console.error("ERROR EN PRISMA:", error); // <-- DEBUG
    res.status(500).json({ error: "No se pudo crear la cita" });
  }
});

// 3. Eliminar una cita
app.delete('/appointments/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.appointment.delete({
    where: { id: parseInt(id) },
  });
  res.json({ message: "Cita eliminada" });
});

// 4. Editar una cita 
app.put('/appointments/:id', async (req, res) => {
  const { id } = req.params;
  const { title, clientName, date, startTime, endTime } = req.body;
  try {
    const updated = await prisma.appointment.update({
      where: { id: parseInt(id) },
      data: { title, clientName, date, startTime, endTime },
    });
    res.json(updated);
  } catch (error) {
    console.error("Error al editar:", error); // DEBUG
    res.status(500).json({ error: "Error al actualizar" });
  }
});

// --- RUTAS PARA NOTAS ---

// Obtener todas las notas
app.get('/notes', async (req, res) => {
  const notes = await prisma.note.findMany({
    orderBy: { createdAt: 'desc' } // Las más nuevas primero
  });
  res.json(notes);
});

// Crear una nota
app.post('/notes', async (req, res) => {
  const { content } = req.body;
  const newNote = await prisma.note.create({
    data: { content }
  });
  res.json(newNote);
});

// Eliminar una nota
app.delete('/notes/:id', async (req, res) => {
  await prisma.note.delete({
    where: { id: parseInt(req.params.id) }
  });
  res.json({ message: "Nota eliminada" });
});
// Iniciar servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});