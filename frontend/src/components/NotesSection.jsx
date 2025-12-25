// src/components/NotesSection.jsx
import React from 'react';

const NotesSection = ({ notes, noteContent, setNoteContent, handleNoteSubmit, deleteNote }) => {
  return (
    <div className="notes-container">
      <hr style={{ margin: '40px 0', borderColor: '#eee' }} />
      <h2>Notas Importantes</h2>
      
      <form onSubmit={handleNoteSubmit} className="admin-card">
        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="Escribe una nota rápida..." 
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            required
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn-save">Agregar</button>
        </div>
      </form>

      <div className="list">
        {notes.map(note => (
          <div key={note.id} className="admin-card" style={{ borderLeftColor: '#f1c40f', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ margin: 0 }}>{note.content}</p>
            <button onClick={() => deleteNote(note.id)} className="btn-delete">X</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotesSection;