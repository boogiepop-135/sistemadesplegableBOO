import React, { useState, useEffect } from 'react';
import { FaCheck, FaEdit, FaTrash, FaPlus } from 'react-icons/fa';

const TodoList = () => {
  const [todos, setTodos] = useState(() => {
    const savedTodos = localStorage.getItem('todos');
    return savedTodos ? JSON.parse(savedTodos) : [];
  });
  const [newTodo, setNewTodo] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = (e) => {
    e.preventDefault();
    if (newTodo.trim()) {
      const todo = {
        id: Date.now(),
        text: newTodo.trim(),
        completed: false,
        createdAt: new Date().toISOString()
      };
      setTodos([...todos, todo]);
      setNewTodo('');
    }
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const startEdit = (todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
  };

  const saveEdit = (id) => {
    if (editText.trim()) {
      setTodos(todos.map(todo =>
        todo.id === id ? { ...todo, text: editText.trim() } : todo
      ));
      setEditingId(null);
      setEditText('');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const completedCount = todos.filter(todo => todo.completed).length;
  const totalCount = todos.length;

  return (
    <article className="todo-container animate-fade-in">
      <header className="todo-header">
        <h3>📝 Lista de Tareas</h3>
        <span className="todo-stats">
          {completedCount} de {totalCount} completadas
        </span>
      </header>

      <form onSubmit={addTodo} className="todo-form">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Agregar nueva tarea..."
          className="todo-input"
        />
        <button type="submit" className="todo-add-btn">
          <FaPlus />
          Agregar
        </button>
      </form>

      <section className="todo-list">
        {todos.length === 0 ? (
          <p className="empty-state">
            No hay tareas pendientes. ¡Agrega una nueva tarea!
          </p>
        ) : (
          todos.map(todo => (
            <article 
              key={todo.id} 
              className={`todo-item ${todo.completed ? 'completed' : ''}`}
            >
              <button 
                className={`todo-checkbox ${todo.completed ? 'checked' : ''}`}
                onClick={() => toggleTodo(todo.id)}
                aria-label={todo.completed ? 'Desmarcar tarea' : 'Marcar como completada'}
              >
                {todo.completed && <FaCheck size={12} />}
              </button>
              
              {editingId === todo.id ? (
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onBlur={() => saveEdit(todo.id)}
                  onKeyPress={(e) => e.key === 'Enter' && saveEdit(todo.id)}
                  onKeyDown={(e) => e.key === 'Escape' && cancelEdit()}
                  className="todo-edit-input"
                  autoFocus
                />
              ) : (
                <span className="todo-text">{todo.text}</span>
              )}
              
              <nav className="todo-actions">
                {editingId !== todo.id && (
                  <button 
                    className="edit-btn"
                    onClick={() => startEdit(todo)}
                    title="Editar"
                    aria-label="Editar tarea"
                  >
                    <FaEdit />
                  </button>
                )}
                <button 
                  className="delete-btn"
                  onClick={() => deleteTodo(todo.id)}
                  title="Eliminar"
                  aria-label="Eliminar tarea"
                >
                  <FaTrash />
                </button>
              </nav>
            </article>
          ))
        )}
      </section>

      {todos.length > 0 && (
        <aside className="todo-tip">
          💡 Consejo: Marca las tareas como completadas haciendo clic en el checkbox
        </aside>
      )}
    </article>
  );
};

export default TodoList; 