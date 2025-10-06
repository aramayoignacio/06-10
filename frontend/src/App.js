import React, { useEffect, useState } from 'react';
import './App.css';

const API_BASE = 'http://localhost:3001/api/tasks';

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error(`Error al cargar tareas (${res.status})`);
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      setError(err.message || 'Error desconocido al cargar tareas');
    } finally {
      setLoading(false);
    }
  }

  async function addTask() {
    const title = newTitle.trim();
    if (!title) {
      setError('La tarea no puede estar vacía');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, completed: false })
      });
      if (!res.ok) throw new Error(`Error al crear tarea (${res.status})`);
      const created = await res.json();
      setTasks(prev => [...prev, created]);
      setNewTitle('');
    } catch (err) {
      setError(err.message || 'Error desconocido al crear tarea');
    } finally {
      setLoading(false);
    }
  }

  async function toggleCompleted(taskId) {
    try {
      const current = tasks.find(t => t.id === taskId);
      if (!current) return;
      setLoading(true);
      setError('');
      const res = await fetch(`${API_BASE}/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...current, completed: !current.completed })
      });
      if (!res.ok) {
        if (res.status === 404) throw new Error('Tarea no encontrada');
        throw new Error(`Error al actualizar tarea (${res.status})`);
      }
      const updated = await res.json();
      setTasks(prev => prev.map(t => (t.id === updated.id ? updated : t)));
    } catch (err) {
      setError(err.message || 'Error desconocido al actualizar tarea');
    } finally {
      setLoading(false);
    }
  }

  async function deleteTask(taskId) {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_BASE}/${taskId}`, { method: 'DELETE' });
      if (!res.ok) {
        if (res.status === 404) throw new Error('Tarea no encontrada');
        throw new Error(`Error al eliminar tarea (${res.status})`);
      }
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err) {
      setError(err.message || 'Error desconocido al eliminar tarea');
    } finally {
      setLoading(false);
    }
  }

  function handleAddSubmit(e) {
    e.preventDefault();
    addTask();
  }

  return (
    <div className="container">
      <h1>Lista de Tareas</h1>

      <form className="add-form" onSubmit={handleAddSubmit}>
        <input
          type="text"
          placeholder="Nueva tarea..."
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !newTitle.trim()}>
          Agregar
        </button>
      </form>

      {loading && <div className="status">Cargando...</div>}
      {error && <div className="status error">Error: {error}</div>}

      <ul className="task-list">
        {tasks.map(task => (
          <li key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
            <span
              className="task-title"
              role="button"
              onClick={() => toggleCompleted(task.id)}
              title="Marcar como completada / desmarcar"
            >
              {task.title}
            </span>
            <span className={`badge ${task.completed ? 'badge-ok' : 'badge-pending'}`}>
              {task.completed ? 'Completada' : 'Pendiente'}
            </span>
            <button className="delete-btn" onClick={() => deleteTask(task.id)} disabled={loading}>
              Eliminar
            </button>
          </li>
        ))}
      </ul>

      {!loading && tasks.length === 0 && <div className="empty">No hay tareas aún</div>}
    </div>
  );
}

export default App;
