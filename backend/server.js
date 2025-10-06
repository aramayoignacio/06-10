// server.js (versión con logging y manejo extra)
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
const DATA_FILE = path.join(__dirname, 'tasks.json');

console.log('Arrancando server.js — verificación inicial');

process.on('uncaughtException', (err) => {
  console.error('uncaughtException:', err && err.stack ? err.stack : err);
  // opcional: process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('unhandledRejection:', reason);
});

app.use(cors());
app.use(express.json());

console.log('Middlewares cargados (cors, json)');

function readTasks() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      console.warn('No existe tasks.json — se creará uno nuevo');
      fs.writeFileSync(DATA_FILE, '[]', 'utf8');
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error leyendo tasks.json:', err && err.stack ? err.stack : err);
    // intentar re-crear archivo
    try {
      fs.writeFileSync(DATA_FILE, '[]', 'utf8');
      console.log('tasks.json recreado correctamente');
      return [];
    } catch (err2) {
      console.error('Error creando tasks.json:', err2 && err2.stack ? err2.stack : err2);
      throw err2;
    }
  }
}

function writeTasks(tasks) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2), 'utf8');
  } catch (err) {
    console.error('Error escribiendo tasks.json:', err && err.stack ? err.stack : err);
    throw err;
  }
}

app.get('/api/tasks', (req, res) => {
  try {
    const tasks = readTasks();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Error interno leyendo tareas' });
  }
});

app.post('/api/tasks', (req, res) => {
  try {
    const { title } = req.body;
    if (!title || !title.toString().trim()) {
      return res.status(400).json({ error: 'El título es obligatorio' });
    }
    const tasks = readTasks();
    const id = Date.now().toString() + Math.floor(Math.random() * 1000).toString();
    const newTask = { id, title: title.toString(), completed: false };
    tasks.push(newTask);
    writeTasks(tasks);
    res.status(201).json(newTask);
  } catch (err) {
    console.error('POST /api/tasks error:', err && err.stack ? err.stack : err);
    res.status(500).json({ error: 'Error interno creando tarea' });
  }
});

app.put('/api/tasks/:id', (req, res) => {
  try {
    const taskId = req.params.id;
    const { title, completed } = req.body;
    const tasks = readTasks();
    const idx = tasks.findIndex(t => t.id === taskId);
    if (idx === -1) return res.status(404).json({ error: 'Tarea no encontrada' });
    if (typeof title !== 'undefined') tasks[idx].title = title;
    if (typeof completed !== 'undefined') tasks[idx].completed = Boolean(completed);
    writeTasks(tasks);
    res.json(tasks[idx]);
  } catch (err) {
    console.error('PUT /api/tasks/:id error:', err && err.stack ? err.stack : err);
    res.status(500).json({ error: 'Error interno actualizando tarea' });
  }
});

app.delete('/api/tasks/:id', (req, res) => {
  try {
    const taskId = req.params.id;
    const tasks = readTasks();
    const newTasks = tasks.filter(t => t.id !== taskId);
    if (newTasks.length === tasks.length) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    writeTasks(newTasks);
    res.status(204).send();
  } catch (err) {
    console.error('DELETE /api/tasks/:id error:', err && err.stack ? err.stack : err);
    res.status(500).json({ error: 'Error interno eliminando tarea' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend corriendo en http://localhost:${PORT} (PID ${process.pid})`);
});
