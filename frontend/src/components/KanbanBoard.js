import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaEdit, FaCheck } from 'react-icons/fa';

const KanbanBoard = () => {
  const [columns, setColumns] = useState(() => {
    const saved = localStorage.getItem('kanban-data');
    return saved ? JSON.parse(saved) : {
      todo: {
        id: 'todo',
        title: 'Por Hacer',
        tasks: []
      },
      inProgress: {
        id: 'inProgress',
        title: 'En Progreso',
        tasks: []
      },
      done: {
        id: 'done',
        title: 'Completado',
        tasks: []
      }
    };
  });

  const [newTask, setNewTask] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    localStorage.setItem('kanban-data', JSON.stringify(columns));
  }, [columns]);

  const addTask = (columnId) => {
    if (!newTask.trim()) return;
    
    const task = {
      id: Date.now(),
      content: newTask.trim(),
      createdAt: new Date().toISOString()
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
  };

  const handleDragOver = (e) => {
    e.preventDefault();
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
  };

  return (
    <div className="kanban-container">
      <div className="kanban-header">
        <h2>Tablero Kanban</h2>
        <p>Organiza tus tareas arrastrándolas entre columnas</p>
      </div>

      <div className="kanban-board">
        {Object.values(columns).map(column => (
          <div 
            key={column.id} 
            className="kanban-column"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="column-header">
              <h3>{column.title}</h3>
              <span className="task-count">{column.tasks.length}</span>
            </div>

            <div className="column-content">
              {column.tasks.map(task => (
                <div
                  key={task.id}
                  className="kanban-task"
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
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
                        <button onClick={() => saveEdit(column.id, task.id)}>
                          <FaCheck />
                        </button>
                        <button onClick={cancelEdit}>
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="task-content">{task.content}</div>
                      <div className="task-actions">
                        <button onClick={() => startEdit(task)} title="Editar">
                          <FaEdit />
                        </button>
                        <button onClick={() => deleteTask(column.id, task.id)} title="Eliminar">
                          <FaTrash />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="add-task-section">
              <input
                type="text"
                placeholder="Agregar nueva tarea..."
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTask(column.id)}
              />
              <button onClick={() => addTask(column.id)}>
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