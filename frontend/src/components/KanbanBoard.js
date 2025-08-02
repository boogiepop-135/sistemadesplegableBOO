import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaEdit, FaCheck, FaCalendarAlt, FaUser } from 'react-icons/fa';

const KanbanBoard = () => {
  const [columns, setColumns] = useState(() => {
    const saved = localStorage.getItem('kanban-data');
    return saved ? JSON.parse(saved) : {
      todo: {
        id: 'todo',
        title: 'Por Hacer',
        icon: '📋',
        color: '#667eea',
        tasks: []
      },
      inProgress: {
        id: 'inProgress',
        title: 'En Progreso',
        icon: '⚡',
        color: '#f39c12',
        tasks: []
      },
      done: {
        id: 'done',
        title: 'Completado',
        icon: '✅',
        color: '#27ae60',
        tasks: []
      }
    };
  });

  const [newTask, setNewTask] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [editText, setEditText] = useState('');
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [draggingTask, setDraggingTask] = useState(null);

  useEffect(() => {
    localStorage.setItem('kanban-data', JSON.stringify(columns));
  }, [columns]);

  const addTask = (columnId) => {
    if (!newTask.trim()) return;
    
    const task = {
      id: Date.now(),
      content: newTask.trim(),
      createdAt: new Date().toISOString(),
      priority: 'medium',
      assignee: 'Sin asignar'
    };

    setColumns(prev => ({
      ...prev,
      [columnId]: {
        ...prev[columnId],
        tasks: [...prev[columnId].tasks, task]
      }
    }));
    setNewTask('');
  };

  const moveTask = (taskId, fromColumn, toColumn) => {
    if (fromColumn === toColumn) return;

    const task = columns[fromColumn].tasks.find(t => t.id === taskId);
    if (!task) return;

    setColumns(prev => ({
      ...prev,
      [fromColumn]: {
        ...prev[fromColumn],
        tasks: prev[fromColumn].tasks.filter(t => t.id !== taskId)
      },
      [toColumn]: {
        ...prev[toColumn],
        tasks: [...prev[toColumn].tasks, task]
      }
    }));
  };

  const deleteTask = (columnId, taskId) => {
    setColumns(prev => ({
      ...prev,
      [columnId]: {
        ...prev[columnId],
        tasks: prev[columnId].tasks.filter(t => t.id !== taskId)
      }
    }));
  };

  const startEdit = (task) => {
    setEditingTask(task.id);
    setEditText(task.content);
  };

  const saveEdit = (columnId, taskId) => {
    if (!editText.trim()) return;

    setColumns(prev => ({
      ...prev,
      [columnId]: {
        ...prev[columnId],
        tasks: prev[columnId].tasks.map(t => 
          t.id === taskId ? { ...t, content: editText.trim() } : t
        )
      }
    }));
    setEditingTask(null);
    setEditText('');
  };

  const cancelEdit = () => {
    setEditingTask(null);
    setEditText('');
  };

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('taskId', taskId);
    setDraggingTask(taskId);
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    setDraggingTask(null);
    setDragOverColumn(null);
    e.target.style.opacity = '1';
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOverColumn(null);
  };

  const handleDrop = (e, columnId) => {
    e.preventDefault();
    const taskId = parseInt(e.dataTransfer.getData('taskId'));
    const fromColumn = Object.keys(columns).find(col => 
      columns[col].tasks.some(t => t.id === taskId)
    );
    if (fromColumn) {
      moveTask(taskId, fromColumn, columnId);
    }
    setDragOverColumn(null);
    setDraggingTask(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#e74c3c';
      case 'medium': return '#f39c12';
      case 'low': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  return (
    <div className="kanban-container">
      <div className="kanban-header">
        <h2>📋 Tablero Kanban</h2>
        <p>Organiza tus tareas arrastrándolas entre columnas • Sistema de gestión visual</p>
      </div>

      <div className="kanban-board">
        {Object.values(columns).map(column => (
          <div 
            key={column.id} 
            className={`kanban-column ${dragOverColumn === column.id ? 'drag-over' : ''}`}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
            style={{
              '--column-color': column.color
            }}
          >
            <div className="column-header">
              <div className="column-title">
                <span className="column-icon">{column.icon}</span>
                <h3>{column.title}</h3>
              </div>
              <span className="task-count">{column.tasks.length}</span>
            </div>

            <div className="column-content">
              {column.tasks.map(task => (
                <div
                  key={task.id}
                  className={`kanban-task ${draggingTask === task.id ? 'dragging' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onDragEnd={handleDragEnd}
                >
                  {editingTask === task.id ? (
                    <div className="task-edit">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && saveEdit(column.id, task.id)}
                        autoFocus
                      />
                      <div className="edit-actions">
                        <button onClick={() => saveEdit(column.id, task.id)} title="Guardar">
                          <FaCheck />
                        </button>
                        <button onClick={cancelEdit} title="Cancelar">
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="task-header">
                        <div className="task-priority" style={{ backgroundColor: getPriorityColor(task.priority) }}>
                          {task.priority === 'high' ? '🔥' : task.priority === 'medium' ? '⚡' : '💡'}
                        </div>
                        <div className="task-date">
                          <FaCalendarAlt />
                          <span>{formatDate(task.createdAt)}</span>
                        </div>
                      </div>
                      <div className="task-content">{task.content}</div>
                      <div className="task-footer">
                        <div className="task-assignee">
                          <FaUser />
                          <span>{task.assignee}</span>
                        </div>
                        <div className="task-actions">
                          <button onClick={() => startEdit(task)} title="Editar tarea">
                            <FaEdit />
                          </button>
                          <button onClick={() => deleteTask(column.id, task.id)} title="Eliminar tarea">
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="add-task-section">
              <input
                type="text"
                placeholder={`Agregar tarea a ${column.title.toLowerCase()}...`}
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTask(column.id)}
              />
              <button onClick={() => addTask(column.id)} title={`Agregar tarea a ${column.title}`}>
                <FaPlus />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KanbanBoard; 