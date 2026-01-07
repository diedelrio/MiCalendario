// src/App.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

// Importación de componentes
import AppointmentForm from './components/AppointmentForm';
import AppointmentList from './components/AppointmentList';
import NotesSection from './components/NotesSection';
import DeleteModal from './components/DeleteModal';

import './App.css';

function App() {
  // --- ESTADOS DE CITAS ---
  const [appointments, setAppointments] = useState([]);
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [date, setDate] = useState(''); 
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [editId, setEditId] = useState(null);
 
  
  // Nuevo estado para recordar si la cita que se está editando es una serie
  const [isEditingSeries, setIsEditingSeries] = useState(false);

  // --- ESTADOS PARA EL MODAL DE ELIMINACIÓN ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAppoId, setSelectedAppoId] = useState(null);

  // --- ESTADOS DE NOTAS ---
  const [notes, setNotes] = useState([]);
  const [noteContent, setNoteContent] = useState('');

  // --- ESTADO DE CALENDARIO Y FILTRADO ---
  const [selectedDate, setSelectedDate] = useState(new Date());
  const hoy = new Date().toLocaleDateString('en-CA');

  useEffect(() => {
    fetchAppointments();
    fetchNotes();
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
    try {
      const res = await axios.get('http://localhost:3000/notes');
      setNotes(res.data);
    } catch (error) {
      console.error("Error al obtener notas", error);
    }
  };

  // --- MANEJADORES DE EVENTOS ---
  
  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    const dateStr = newDate.toLocaleDateString('en-CA');
    setDate(dateStr); 
  };

  const handleSubmit = async (e, extraData) => {
    e.preventDefault();
    const baseData = { title, clientName, date, startTime, endTime, ...extraData };
    
    try {
      if (editId) {
        let editAll = false;
        // Si detectamos que es parte de una serie por el estado guardado al iniciar edición
        if (isEditingSeries) {
          editAll = window.confirm("Esta cita es parte de una serie recurrente. ¿Deseas aplicar los cambios a TODA la serie?");
        }
        
        await axios.put(`http://localhost:3000/appointments/${editId}`, { 
          ...baseData, 
          editAllSeries: editAll 
        });
      } else {
        await axios.post('http://localhost:3000/appointments', baseData);
      }
      resetForm();
      fetchAppointments();
    } catch (error) {
      alert(error.response?.data?.message || "Error al procesar la reserva");
    }
  };

  const openDeleteDialog = (appo) => {
    
    if (appo.parentId) {
      // Si tiene parentId, NADA de window.confirm. Abrimos el modal.
      setSelectedAppoId(appo.id);
      setIsDeleteModalOpen(true);
    } else {
      // Solo si es cita única usamos el confirm simple
      if (window.confirm("¿Estás seguro de eliminar esta cita única?")) {
        executeDelete(appo.id, false);
      }
    }
  };

  const executeDelete = async (id, deleteAll) => {
    try {
      await axios.delete(`http://localhost:3000/appointments/${id}?deleteAll=${deleteAll}`);
      setIsDeleteModalOpen(false);
      fetchAppointments();
    } catch (error) {
      alert("No se pudo eliminar la cita");
    }
  };

  const startEdit = (appo) => {
    console.log("Editando cita:", appo); // Debug para verificar parentId
    setEditId(appo.id);
    setTitle(appo.title);
    setClientName(appo.clientName);
    setDate(appo.date);
    setStartTime(appo.startTime);
    setEndTime(appo.endTime);
    
    // Guardamos si es serie para que handleSubmit sepa si debe preguntar
    setIsEditingSeries(!!appo.parentId);
    
    setSelectedDate(new Date(appo.date + "T00:00:00"));
  };

  const resetForm = () => {
    setTitle(''); 
    setClientName(''); 
    setDate(hoy); 
    setStartTime(''); 
    setEndTime('');
    setEditId(null);
    setIsEditingSeries(false);
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

  const getTileClassName = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = date.toLocaleDateString('en-CA');
      const hasAppointment = appointments.some(appo => appo.date === dateStr);
      if (hasAppointment) return 'has-appointment';
    }
    return null;
  };

  const dateString = selectedDate.toLocaleDateString('en-CA');
  const filteredAppointments = appointments.filter(appo => appo.date === dateString);

  return (
    <div className="app-container">
      <header>
        <h1>Mi Calendario de Citas Pro</h1>
      </header>

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
          appointmentsOfDay={filteredAppointments} 
        />
      </div>

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
          deleteAppo={openDeleteDialog} 
        />

        {filteredAppointments.length === 0 && (
          <div className="no-appointments">
            <p>No hay citas programadas para este día.</p>
          </div>
        )}
      </main>

      <NotesSection 
        notes={notes}
        noteContent={noteContent}
        setNoteContent={setNoteContent}
        handleNoteSubmit={handleNoteSubmit}
        deleteNote={deleteNote}
      />

      {/* MODAL PERSONALIZADO DE ELIMINACIÓN */}
      <DeleteModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDeleteOne={() => executeDelete(selectedAppoId, false)}
        onDeleteAll={() => executeDelete(selectedAppoId, true)}
      />
    </div>
  );
}

export default App;