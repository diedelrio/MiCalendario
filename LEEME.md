📑 Manual de Inducción: MiCalendario Full-Stack
Desarrollador Original: Diego

Estado: Fase 1 Finalizada (CRUD + Validación de conflictos)

1. Estructura del Proyecto
El sistema se organiza bajo el patrón de separación de responsabilidades (Frontend y Backend).

Plaintext

MiCalendario/
├── backend/                
│   ├── prisma/             # Base de datos SQLite y Modelos
│   ├── utils/              # Lógica de validación (validators.js)
│   ├── index.js            # API REST (Rutas GET, POST, PUT, DELETE)
│   └── .env                # Variables de conexión
└── frontend/               
    ├── src/
    │   ├── App.jsx         # Componente principal (UI + Lógica de Estado)
    │   └── App.css         # Diseño de Admin-Cards y colores dinámicos
2. Archivos Generados y su Propósito
🗄️ Base de Datos (prisma/schema.prisma)
Define las tablas Appointment (Citas) y Note (Notas).

Campo date: Almacenado como String para facilitar la comparación en el frontend.

Campos startTime / endTime: Claves para el ordenamiento cronológico.

🧠 Validación de Conflictos (utils/validators.js)
Función externa que protege la agenda:

JavaScript

async function checkScheduleConflict(prisma, date, startTime) {
  const existing = await prisma.appointment.findFirst({
    where: { date, startTime },
  });
  return !!existing; 
}
🚀 Servidor Principal (index.js)
Puntos de acceso (Endpoints) configurados:

GET /appointments: Devuelve la lista ordenada por fecha y luego por hora.

POST /appointments: Crea una cita previa validación de horario.

PUT /appointments/:id: Actualiza los datos de una cita existente.

DELETE /appointments/:id: Elimina un registro por su ID.

💻 Interfaz de Usuario (App.jsx)
Detección de "Hoy": Compara appo.date con la fecha del sistema para pintar bordes verdes.

Formulario Híbrido: Detecta el estado editId. Si existe, el botón cambia a "Actualizar" y realiza una petición PUT.

3. Guía para Continuar (Próximos Pasos)
Si vas a retomar el proyecto, estos son los objetivos recomendados para la Fase 2:

Refactorización: Dividir App.jsx en componentes más pequeños (Formulario.jsx, ListaCitas.jsx, TarjetaCita.jsx) para que el código sea más fácil de leer.

Validación de Intervalos: No permitir que una cita nueva inicie mientras otra aún no termina (comparar rangos de tiempo).

Buscador: Añadir un campo de texto para filtrar clientes por nombre en tiempo real.

Confirmación de Acción: Añadir un diálogo de confirmación ("¿Estás seguro?") antes de borrar registros.

4. Comandos de Mantenimiento
Encender todo: npm run dev en ambas carpetas.

Cambios en la DB: Si agregas campos nuevos, ejecuta npx prisma migrate dev.

Ver datos crudos: npx prisma studio.