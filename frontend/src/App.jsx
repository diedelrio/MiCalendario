// src/App.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

// Importación de componentes refactorizados
import AppointmentForm from './components/AppointmentForm';
import AppointmentList from './components/AppointmentList';
import NotesSection from './components/NotesSection';

import './App.css';

function App() {
  // --- ESTADOS DE CITAS ---
  const [appointments, setAppointments] = useState([]);
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [date, setDate] = useState(''); // Estado para el input del formulario
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [editId, setEditId] = useState(null);

  // --- ESTADOS DE NOTAS ---
  const [notes, setNotes] = useState([]);
  const [noteContent, setNoteContent] = useState('');

  // --- ESTADO DE CALENDARIO Y FILTRADO ---
  const [selectedDate, setSelectedDate] = useState(new Date());
  const hoy = new Date().toLocaleDateString('en-CA');

  // Carga inicial
  useEffect(() => {
    fetchAppointments();
    fetchNotes();
    // Inicializar la fecha del formulario con la fecha de hoy
    setDate(hoy);
  }, []);

  // --- FUNCIONES DE API ---
  const fetchAppointments = async () => {
    try {
      const res = await axios.get('http://localhost:3000/appointments');
      setAppointments(res.data);
    } catch (error) {
      console.error("Error al obtener citas", error);
    }
  };

  const fetchNotes = async () => {
    const res = await axios.get('http://localhost:3000/notes');
    setNotes(res.data);
  };

  // --- MANEJADORES DE EVENTOS ---
  
  // Cambio de fecha en el Calendario
  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    const dateStr = newDate.toLocaleDateString('en-CA');
    setDate(dateStr); // Sincroniza el formulario con el click en el calendario
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { title, clientName, date, startTime, endTime };
    try {
      if (editId) {
        await axios.put(`http://localhost:3000/appointments/${editId}`, data);
        setEditId(null);
      } else {
        await axios.post('http://localhost:3000/appointments', data);
      }
      resetForm();
      fetchAppointments();
    } catch (error) {
      alert(error.response?.data?.message || "Ocurrió un error");
    }
  };

  const deleteAppo = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar esta cita?")) {
      await axios.delete(`http://localhost:3000/appointments/${id}`);
      fetchAppointments();
    }
  };

  const startEdit = (appo) => {
    setEditId(appo.id);
    setTitle(appo.title);
    setClientName(appo.clientName);
    setDate(appo.date);
    setStartTime(appo.startTime);
    setEndTime(appo.endTime);
    // Opcional: mover el calendario a la fecha de la cita editada
    setSelectedDate(new Date(appo.date + "T00:00:00"));
  };

  const resetForm = () => {
    setTitle(''); setClientName(''); setDate(hoy); setStartTime(''); setEndTime('');
  };

  const handleNoteSubmit = async (e) => {
    e.preventDefault();
    await axios.post('http://localhost:3000/notes', { content: noteContent });
    setNoteContent('');
    fetchNotes();
  };

  const deleteNote = async (id) => {
    await axios.delete(`http://localhost:3000/notes/${id}`);
    fetchNotes();
  };
  //  -- LÓGICA DE MARCAS EN EL CALENDARIO ---
  const getTileClassName = ({ date, view }) => {
    // Solo aplicamos la marca en la vista de "mes"
    if (view === 'month') {
      const dateStr = date.toLocaleDateString('en-CA');
      // Buscamos si existe al menos una cita en ese día
      const hasAppointment = appointments.some(appo => appo.date === dateStr);
      
      if (hasAppointment) {
        return 'has-appointment'; // Esta es la clase que definiremos en el CSS
      }
    }
    return null;
  };

  // --- LÓGICA DE FILTRADO ---
  const dateString = selectedDate.toLocaleDateString('en-CA');
  const filteredAppointments = appointments.filter(appo => appo.date === dateString);

  return (
  <div className="app-container">
    <header>
      <h1>Mi Calendario de Citas</h1>
    </header>

    {/* SECCIÓN SUPERIOR: Calendario + Formulario */}
    <div className="top-control-section">
      <div className="calendar-card">
        <Calendar 
          onChange={handleDateChange} 
          value={selectedDate}
          locale="es-ES"
          tileClassName={getTileClassName}
        />
      </div>

      <AppointmentForm 
        handleSubmit={handleSubmit}
        title={title} setTitle={setTitle}
        clientName={clientName} setClientName={setClientName}
        date={date} setDate={setDate}
        startTime={startTime} setStartTime={setStartTime}
        endTime={endTime} setEndTime={setEndTime}
        editId={editId} setEditId={setEditId}
        resetForm={resetForm}
      />
    </div>

    {/* SECCIÓN INFERIOR: Listado de Citas */}
    <main className="full-content">
      <div className="content-header">
        <div>
          <h2>Citas para el día</h2>
          <p className="date-display">
            {dateString === hoy ? 'Hoy, ' : ''} {dateString}
          </p>
        </div>
        <span className="count-badge">{filteredAppointments.length} citas</span>
      </div>

      <AppointmentList 
        appointments={filteredAppointments} 
        hoy={hoy} 
        startEdit={startEdit} 
        deleteAppo={deleteAppo} 
      />

      {filteredAppointments.length === 0 && (
        <div className="no-appointments">
          <p>No hay citas programadas para este día.</p>
        </div>
      )}
    </main>

    {/* NOTAS al final o flotantes */}
    <NotesSection 
      notes={notes}
      noteContent={noteContent}
      setNoteContent={setNoteContent}
      handleNoteSubmit={handleNoteSubmit}
      deleteNote={deleteNote}
    />
  </div>
);
}

export default App;