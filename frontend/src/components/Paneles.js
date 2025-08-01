import React, { useEffect, useState } from 'react';
import { FaTrash, FaPlus, FaDownload } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { getToken } from '../App';
import { API_URL } from '../config';

// Función helper para obtener el nombre de visualización de un usuario
const getDisplayName = (usuario) => {
  if (!usuario) return '';
  return usuario.nombre_perfil || usuario.nombre || usuario;
};



// Helper para fetch con token
function fetchWithAuth(url, options = {}) {
  const token = getToken();
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: token ? `Bearer ${token}` : undefined,
    },
  });
}

export function InventarioList({ admin, usuario }) {
  const [inventario, setInventario] = useState([]);
  const [filtro, setFiltro] = useState({ tipo: '', estado: '' });
  const [ubicaciones, setUbicaciones] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [nuevoEquipo, setNuevoEquipo] = useState({
    equipo: '',
    tipo: '',
    estado: 'Activo',
    ubicacion_id: '',
    usuario_id: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    Promise.all([
      fetchWithAuth(`${API_URL}/inventario/`).then(res => res.json()),
      fetchWithAuth(`${API_URL}/ubicaciones/`).then(res => res.json()),
      fetchWithAuth(`${API_URL}/usuarios`).then(res => res.json()),
      fetchWithAuth(`${API_URL}/categorias/`).then(res => res.json())
    ]).then(([inv, ubi, usu, cat]) => {
      if (admin) {
        setInventario(inv);
      } else {
        setInventario(inv.filter(e => e.usuario_nombre === usuario || e.usuario_nombre_perfil === usuario));
      }
      setUbicaciones(ubi);
      setUsuarios(usu);
      setCategorias(cat);
    }).catch(err => {
      setError('Error de red o CORS al cargar datos.');
    });
  }, [admin, usuario]);



  const handleEliminar = (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este equipo?')) return;

    fetchWithAuth(`${API_URL}/inventario/${id}`, {
      method: 'DELETE'
    })
    .then(() => {
      setInventario(inventario.filter(item => item.id !== id));
    })
    .catch(err => {
      alert('Error al eliminar equipo');
    });
  };

  const exportarExcel = () => {
    const ws = XLSX.utils.json_to_sheet(inventario);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");
    XLSX.writeFile(wb, "inventario.xlsx");
  };

  const agregarEquipo = () => {
    if (!nuevoEquipo.equipo || !nuevoEquipo.tipo) {
      alert('Por favor completa el nombre del equipo y tipo');
      return;
    }

    fetchWithAuth(`${API_URL}/inventario/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevoEquipo)
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert('Error: ' + data.error);
      } else {
        setInventario([...inventario, data]);
        setNuevoEquipo({
          equipo: '',
          tipo: '',
          estado: 'Activo',
          ubicacion_id: '',
          usuario_id: ''
        });
      }
    })
    .catch(err => {
      alert('Error al agregar equipo: ' + err.message);
    });
  };

  const getSucursal = (inv) => {
    const ubicacion = ubicaciones.find(u => u.id === inv.ubicacion_id);
    return ubicacion ? ubicacion.nombre : 'Sin ubicación';
  };

  const getResponsable = (inv) => {
    const user = usuarios.find(u => u.id === inv.usuario_id);
    return user ? getDisplayName(user) : 'Sin asignar';
  };



  const inventarioFiltrado = inventario.filter(item => {
    return (!filtro.tipo || item.tipo === filtro.tipo) &&
           (!filtro.estado || item.estado === filtro.estado);
  });

  return (
    <article className="inventario-container">
      <header className="inventario-header">
        <h2>📦 Gestión de Inventario</h2>
        <nav className="inventario-actions">
          <button onClick={exportarExcel} className="action-btn export-btn">
            <FaDownload /> Exportar Excel
          </button>
        </nav>
      </header>

      {error && (
        <section className="error-message">
          {error}
        </section>
      )}

      <section className="inventario-list">
          <aside className="filtros">
            <select 
              value={filtro.tipo} 
              onChange={(e) => setFiltro({...filtro, tipo: e.target.value})}
              className="filtro-select"
            >
              <option value="">Todos los tipos</option>
              {[...new Set(inventario.map(item => item.tipo))].map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
            <select 
              value={filtro.estado} 
              onChange={(e) => setFiltro({...filtro, estado: e.target.value})}
              className="filtro-select"
            >
              <option value="">Todos los estados</option>
              {[...new Set(inventario.map(item => item.estado))].map(estado => (
                <option key={estado} value={estado}>{estado}</option>
              ))}
            </select>
          </aside>

          {admin && (
            <section className="agregar-equipo-section">
              <h3>➕ Agregar Nuevo Equipo</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Equipo:</label>
                  <input
                    type="text"
                    value={nuevoEquipo.equipo}
                    onChange={(e) => setNuevoEquipo({...nuevoEquipo, equipo: e.target.value})}
                    placeholder="Nombre del equipo"
                  />
                </div>
                <div className="form-group">
                  <label>Tipo:</label>
                  <input
                    type="text"
                    value={nuevoEquipo.tipo}
                    onChange={(e) => setNuevoEquipo({...nuevoEquipo, tipo: e.target.value})}
                    placeholder="Tipo de equipo"
                  />
                </div>
                <div className="form-group">
                  <label>Estado:</label>
                  <select
                    value={nuevoEquipo.estado}
                    onChange={(e) => setNuevoEquipo({...nuevoEquipo, estado: e.target.value})}
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                    <option value="En Mantenimiento">En Mantenimiento</option>
                    <option value="Fuera de Servicio">Fuera de Servicio</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Ubicación:</label>
                  <select
                    value={nuevoEquipo.ubicacion_id}
                    onChange={(e) => setNuevoEquipo({...nuevoEquipo, ubicacion_id: e.target.value})}
                  >
                    <option value="">Seleccionar ubicación</option>
                    {ubicaciones.map(ubicacion => (
                      <option key={ubicacion.id} value={ubicacion.id}>
                        {ubicacion.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Responsable:</label>
                  <select
                    value={nuevoEquipo.usuario_id}
                    onChange={(e) => setNuevoEquipo({...nuevoEquipo, usuario_id: e.target.value})}
                  >
                    <option value="">Seleccionar responsable</option>
                    {usuarios.map(user => (
                      <option key={user.id} value={user.id}>
                        {getDisplayName(user)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <button onClick={agregarEquipo} className="btn-primary">
                    <FaPlus /> Agregar Equipo
                  </button>
                </div>
              </div>
            </section>
          )}

          <section className="equipos-grid">
            {inventarioFiltrado.map(item => (
              <article key={item.id} className="equipo-card">
                <header className="equipo-header">
                  <h3>{item.equipo}</h3>
                  <span className={`estado-badge ${item.estado.toLowerCase().replace(' ', '-')}`}>
                    {item.estado}
                  </span>
                </header>
                <section className="equipo-info">
                  <p><strong>Tipo:</strong> {item.tipo}</p>
                  <p><strong>Sucursal:</strong> {getSucursal(item)}</p>
                  <p><strong>Responsable:</strong> {getResponsable(item)}</p>
                </section>
                {admin && (
                  <nav className="equipo-actions">
                    <button onClick={() => handleEliminar(item.id)} className="action-btn delete-btn">
                      <FaTrash />
                    </button>
                  </nav>
                )}
              </article>
            ))}
          </section>
        </section>
    </article>
  );
}

export function TicketsList({ admin, usuario }) {
  const [tickets, setTickets] = useState([]);
  const [nuevoTicket, setNuevoTicket] = useState({
    titulo: '',
    descripcion: '',
    prioridad: 'Media',
    categoria: '',
    estado: 'Abierto'
  });
  const [filtro, setFiltro] = useState({ estado: '', prioridad: '', categoria: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    fetchWithAuth(`${API_URL}/tickets/`)
      .then(res => res.json())
      .then(data => {
        if (admin) {
          setTickets(data);
        } else {
          setTickets(data.filter(t => t.usuario_nombre === usuario || t.usuario_nombre_perfil === usuario));
        }
      })
      .catch(err => {
        setError('Error al cargar tickets: ' + err.message);
      });
  }, [admin, usuario]);

  const crearTicket = () => {
    if (!nuevoTicket.titulo || !nuevoTicket.descripcion) {
      alert('Por favor completa título y descripción');
      return;
    }

    fetchWithAuth(`${API_URL}/tickets/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevoTicket)
    })
    .then(res => res.json())
    .then(data => {
      setTickets([...tickets, data]);
      setNuevoTicket({
        titulo: '',
        descripcion: '',
        prioridad: 'Media',
        categoria: '',
        estado: 'Abierto'
      });
    })
    .catch(err => {
      alert('Error al crear ticket: ' + err.message);
    });
  };

  const actualizarEstado = (id, nuevoEstado) => {
    fetchWithAuth(`${API_URL}/tickets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado })
    })
    .then(res => res.json())
    .then(data => {
      setTickets(tickets.map(t => t.id === id ? data : t));
    })
    .catch(err => {
      alert('Error al actualizar ticket: ' + err.message);
    });
  };

  const eliminarTicket = (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este ticket?')) return;

    fetchWithAuth(`${API_URL}/tickets/${id}`, {
      method: 'DELETE'
    })
    .then(() => {
      setTickets(tickets.filter(t => t.id !== id));
    })
    .catch(err => {
      alert('Error al eliminar ticket: ' + err.message);
    });
  };

  const ticketsFiltrados = tickets.filter(ticket => {
    return (!filtro.estado || ticket.estado === filtro.estado) &&
           (!filtro.prioridad || ticket.prioridad === filtro.prioridad) &&
           (!filtro.categoria || ticket.categoria === filtro.categoria);
  });

  const getPrioridadColor = (prioridad) => {
    switch (prioridad) {
      case 'Alta': return '#ff6b6b';
      case 'Media': return '#fbc02d';
      case 'Baja': return '#43a047';
      default: return '#666';
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Abierto': return '#1976d2';
      case 'En Proceso': return '#f57c00';
      case 'Resuelto': return '#43a047';
      case 'Cerrado': return '#666';
      default: return '#666';
    }
  };

  return (
    <div className="tickets-container">
      <header className="tickets-header">
        <h2>🎫 Sistema de Tickets</h2>
        <div className="tickets-actions">
          <button className="action-btn export-btn" onClick={() => alert('Función de exportar en desarrollo')}>
            <FaDownload /> Exportar
          </button>
        </div>
      </header>

      {error && <div className="error-message">{error}</div>}

      {/* Formulario para crear ticket */}
      <section className="ticket-form-section">
        <h3>📝 Crear Nuevo Ticket</h3>
        <div className="form-grid">
          <div className="form-field">
            <label>Título *</label>
            <input
              type="text"
              className="form-input"
              value={nuevoTicket.titulo}
              onChange={(e) => setNuevoTicket({...nuevoTicket, titulo: e.target.value})}
              placeholder="Título del ticket"
            />
          </div>
          <div className="form-field">
            <label>Prioridad</label>
            <select
              className="form-select"
              value={nuevoTicket.prioridad}
              onChange={(e) => setNuevoTicket({...nuevoTicket, prioridad: e.target.value})}
            >
              <option value="Baja">Baja</option>
              <option value="Media">Media</option>
              <option value="Alta">Alta</option>
            </select>
          </div>
          <div className="form-field">
            <label>Categoría</label>
            <select
              className="form-select"
              value={nuevoTicket.categoria}
              onChange={(e) => setNuevoTicket({...nuevoTicket, categoria: e.target.value})}
            >
              <option value="">Seleccionar categoría</option>
              <option value="Hardware">Hardware</option>
              <option value="Software">Software</option>
              <option value="Red">Red</option>
              <option value="Usuario">Usuario</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
        </div>
        <div className="form-field">
          <label>Descripción *</label>
          <textarea
            className="form-input"
            value={nuevoTicket.descripcion}
            onChange={(e) => setNuevoTicket({...nuevoTicket, descripcion: e.target.value})}
            placeholder="Describe el problema o solicitud..."
            rows="3"
          />
        </div>
        <button className="submit-btn" onClick={crearTicket}>
          <FaPlus /> Crear Ticket
        </button>
      </section>

      {/* Filtros */}
      <section className="filtros-section">
        <h3>🔍 Filtros</h3>
        <div className="filtros">
          <select
            className="filtro-select"
            value={filtro.estado}
            onChange={(e) => setFiltro({...filtro, estado: e.target.value})}
          >
            <option value="">Todos los estados</option>
            <option value="Abierto">Abierto</option>
            <option value="En Proceso">En Proceso</option>
            <option value="Resuelto">Resuelto</option>
            <option value="Cerrado">Cerrado</option>
          </select>
          <select
            className="filtro-select"
            value={filtro.prioridad}
            onChange={(e) => setFiltro({...filtro, prioridad: e.target.value})}
          >
            <option value="">Todas las prioridades</option>
            <option value="Alta">Alta</option>
            <option value="Media">Media</option>
            <option value="Baja">Baja</option>
          </select>
          <select
            className="filtro-select"
            value={filtro.categoria}
            onChange={(e) => setFiltro({...filtro, categoria: e.target.value})}
          >
            <option value="">Todas las categorías</option>
            <option value="Hardware">Hardware</option>
            <option value="Software">Software</option>
            <option value="Red">Red</option>
            <option value="Usuario">Usuario</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
      </section>

      {/* Lista de tickets */}
      <section className="tickets-list-section">
        <h3>📋 Tickets ({ticketsFiltrados.length})</h3>
        <div className="tickets-grid">
          {ticketsFiltrados.map(ticket => (
            <article key={ticket.id} className="ticket-card">
              <header className="ticket-header">
                <h4>{ticket.titulo}</h4>
                <div className="ticket-badges">
                  <span 
                    className="prioridad-badge"
                    style={{backgroundColor: getPrioridadColor(ticket.prioridad)}}
                  >
                    {ticket.prioridad}
                  </span>
                  <span 
                    className="estado-badge"
                    style={{backgroundColor: getEstadoColor(ticket.estado)}}
                  >
                    {ticket.estado}
                  </span>
                </div>
              </header>
              <div className="ticket-content">
                <p><strong>Descripción:</strong> {ticket.descripcion}</p>
                <p><strong>Categoría:</strong> {ticket.categoria || 'Sin categoría'}</p>
                <p><strong>Usuario:</strong> {getDisplayName(ticket.usuario_nombre)}</p>
                <p><strong>Fecha:</strong> {new Date(ticket.fecha_creacion).toLocaleDateString()}</p>
              </div>
              <footer className="ticket-actions">
                {admin && (
                  <select
                    className="estado-select"
                    value={ticket.estado}
                    onChange={(e) => actualizarEstado(ticket.id, e.target.value)}
                  >
                    <option value="Abierto">Abierto</option>
                    <option value="En Proceso">En Proceso</option>
                    <option value="Resuelto">Resuelto</option>
                    <option value="Cerrado">Cerrado</option>
                  </select>
                )}
                <button 
                  className="action-btn delete-btn"
                  onClick={() => eliminarTicket(ticket.id)}
                  title="Eliminar ticket"
                >
                  <FaTrash />
                </button>
              </footer>
            </article>
          ))}
        </div>
        {ticketsFiltrados.length === 0 && (
          <div className="empty-state">
            <p>No hay tickets que coincidan con los filtros seleccionados.</p>
          </div>
        )}
      </section>
    </div>
  );
}

export function AdminPanel() {
  const [usuarios, setUsuarios] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: '',
    nombre_perfil: '',
    contrasena: '',
    rol: 'usuario'
  });
  const [nuevoUbicacion, setNuevoUbicacion] = useState({
    nombre: '',
    descripcion: ''
  });
  const [nuevoCategoria, setNuevoCategoria] = useState({
    nombre: '',
    descripcion: ''
  });
  const [filtro, setFiltro] = useState({ rol: '', estado: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    Promise.all([
      fetchWithAuth(`${API_URL}/usuarios`).then(res => res.json()),
      fetchWithAuth(`${API_URL}/ubicaciones/`).then(res => res.json()),
      fetchWithAuth(`${API_URL}/categorias/`).then(res => res.json())
    ]).then(([usu, ubi, cat]) => {
      setUsuarios(usu);
      setUbicaciones(ubi);
      setCategorias(cat);
    }).catch(err => {
      setError('Error al cargar datos: ' + err.message);
    });
  }, []);

  const crearUsuario = () => {
    if (!nuevoUsuario.nombre || !nuevoUsuario.contrasena) {
      alert('Por favor completa nombre de usuario y contraseña');
      return;
    }

    fetchWithAuth(`${API_URL}/usuarios/crear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevoUsuario)
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert('Error: ' + data.error);
      } else {
        setUsuarios([...usuarios, data]);
        setNuevoUsuario({
          nombre: '',
          nombre_perfil: '',
          contrasena: '',
          rol: 'usuario'
        });
      }
    })
    .catch(err => {
      alert('Error al crear usuario: ' + err.message);
    });
  };

  const eliminarUsuario = (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) return;

    fetchWithAuth(`${API_URL}/usuarios/${id}`, {
      method: 'DELETE'
    })
    .then(res => {
      if (res.ok) {
        setUsuarios(usuarios.filter(u => u.id !== id));
      } else {
        alert('Error al eliminar usuario');
      }
    })
    .catch(err => {
      alert('Error al eliminar usuario: ' + err.message);
    });
  };

  const crearUbicacion = () => {
    if (!nuevoUbicacion.nombre) {
      alert('Por favor completa el nombre de la ubicación');
      return;
    }

    fetchWithAuth(`${API_URL}/ubicaciones/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevoUbicacion)
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert('Error: ' + data.error);
      } else {
        setUbicaciones([...ubicaciones, data]);
        setNuevoUbicacion({ nombre: '', descripcion: '' });
      }
    })
    .catch(err => {
      alert('Error al crear ubicación: ' + err.message);
    });
  };

  const crearCategoria = () => {
    if (!nuevoCategoria.nombre) {
      alert('Por favor completa el nombre de la categoría');
      return;
    }

    fetchWithAuth(`${API_URL}/categorias/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevoCategoria)
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert('Error: ' + data.error);
      } else {
        setCategorias([...categorias, data]);
        setNuevoCategoria({ nombre: '', descripcion: '' });
      }
    })
    .catch(err => {
      alert('Error al crear categoría: ' + err.message);
    });
  };

  const getRolColor = (rol) => {
    switch (rol) {
      case 'admin': return '#e74c3c';
      case 'supervisor': return '#f39c12';
      case 'usuario': return '#3498db';
      default: return '#95a5a6';
    }
  };

  const usuariosFiltrados = usuarios.filter(usuario => {
    if (filtro.rol && usuario.rol !== filtro.rol) return false;
    return true;
  });

  return (
    <article className="admin-container">
      <header className="admin-header">
        <h2>👨‍💼 Panel de Administración</h2>
        <p>Gestión de usuarios del sistema</p>
      </header>

      <section className="admin-content">
        {error && <div className="error-message">{error}</div>}

        {/* Formulario para crear usuario */}
        <div className="form-section">
          <h3>➕ Crear Nuevo Usuario</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Usuario:</label>
              <input
                type="text"
                value={nuevoUsuario.nombre}
                onChange={(e) => setNuevoUsuario({...nuevoUsuario, nombre: e.target.value})}
                placeholder="Nombre de usuario"
              />
            </div>
            <div className="form-group">
              <label>Nombre Perfil:</label>
              <input
                type="text"
                value={nuevoUsuario.nombre_perfil}
                onChange={(e) => setNuevoUsuario({...nuevoUsuario, nombre_perfil: e.target.value})}
                placeholder="Nombre completo"
              />
            </div>
            <div className="form-group">
              <label>Contraseña:</label>
              <input
                type="password"
                value={nuevoUsuario.contrasena}
                onChange={(e) => setNuevoUsuario({...nuevoUsuario, contrasena: e.target.value})}
                placeholder="Contraseña"
              />
            </div>
            <div className="form-group">
              <label>Rol:</label>
              <select
                value={nuevoUsuario.rol}
                onChange={(e) => setNuevoUsuario({...nuevoUsuario, rol: e.target.value})}
              >
                <option value="usuario">Usuario</option>
                <option value="supervisor">Supervisor</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="form-group">
              <button onClick={crearUsuario} className="btn-primary">
                <FaPlus /> Crear Usuario
              </button>
            </div>
          </div>
        </div>

        {/* Formulario para crear ubicación */}
        <div className="form-section">
          <h3>📍 Crear Nueva Ubicación</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Nombre:</label>
              <input
                type="text"
                value={nuevoUbicacion.nombre}
                onChange={(e) => setNuevoUbicacion({...nuevoUbicacion, nombre: e.target.value})}
                placeholder="Nombre de la ubicación"
              />
            </div>
            <div className="form-group">
              <label>Descripción:</label>
              <input
                type="text"
                value={nuevoUbicacion.descripcion}
                onChange={(e) => setNuevoUbicacion({...nuevoUbicacion, descripcion: e.target.value})}
                placeholder="Descripción de la ubicación"
              />
            </div>
            <div className="form-group">
              <button onClick={crearUbicacion} className="btn-primary">
                <FaPlus /> Crear Ubicación
              </button>
            </div>
          </div>
        </div>

        {/* Formulario para crear categoría */}
        <div className="form-section">
          <h3>🏷️ Crear Nueva Categoría</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Nombre:</label>
              <input
                type="text"
                value={nuevoCategoria.nombre}
                onChange={(e) => setNuevoCategoria({...nuevoCategoria, nombre: e.target.value})}
                placeholder="Nombre de la categoría"
              />
            </div>
            <div className="form-group">
              <label>Descripción:</label>
              <input
                type="text"
                value={nuevoCategoria.descripcion}
                onChange={(e) => setNuevoCategoria({...nuevoCategoria, descripcion: e.target.value})}
                placeholder="Descripción de la categoría"
              />
            </div>
            <div className="form-group">
              <button onClick={crearCategoria} className="btn-primary">
                <FaPlus /> Crear Categoría
              </button>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="filters-section">
          <h3>🔍 Filtros</h3>
          <div className="filters-grid">
            <div className="filter-group">
              <label>Rol:</label>
              <select
                value={filtro.rol}
                onChange={(e) => setFiltro({...filtro, rol: e.target.value})}
              >
                <option value="">Todos</option>
                <option value="usuario">Usuario</option>
                <option value="supervisor">Supervisor</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de usuarios */}
        <div className="list-section">
          <h3>👥 Usuarios ({usuariosFiltrados.length})</h3>
          <div className="cards-grid">
            {usuariosFiltrados.map(usuario => (
              <div key={usuario.id} className="card">
                <div className="card-header">
                  <h4>{usuario.nombre_perfil || usuario.nombre}</h4>
                  <span 
                    className="badge"
                    style={{ backgroundColor: getRolColor(usuario.rol) }}
                  >
                    {usuario.rol}
                  </span>
                </div>
                <div className="card-body">
                  <p><strong>Usuario:</strong> {usuario.nombre}</p>
                  <p><strong>ID:</strong> {usuario.id}</p>
                  <p><strong>Creado:</strong> {new Date(usuario.fecha_creacion).toLocaleDateString()}</p>
                </div>
                <div className="card-actions">
                  <button 
                    onClick={() => eliminarUsuario(usuario.id)}
                    className="btn-danger"
                    title="Eliminar usuario"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lista de ubicaciones */}
        <div className="list-section">
          <h3>📍 Ubicaciones ({ubicaciones.length})</h3>
          <div className="cards-grid">
            {ubicaciones.map(ubicacion => (
              <div key={ubicacion.id} className="card">
                <div className="card-header">
                  <h4>{ubicacion.nombre}</h4>
                </div>
                <div className="card-body">
                  <p><strong>Descripción:</strong> {ubicacion.descripcion || 'Sin descripción'}</p>
                  <p><strong>ID:</strong> {ubicacion.id}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lista de categorías */}
        <div className="list-section">
          <h3>🏷️ Categorías ({categorias.length})</h3>
          <div className="cards-grid">
            {categorias.map(categoria => (
              <div key={categoria.id} className="card">
                <div className="card-header">
                  <h4>{categoria.nombre}</h4>
                </div>
                <div className="card-body">
                  <p><strong>Descripción:</strong> {categoria.descripcion || 'Sin descripción'}</p>
                  <p><strong>ID:</strong> {categoria.id}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </article>
  );
}

export function DocumentosPanel() {
  const [documentos, setDocumentos] = useState([]);
  const [nuevoDocumento, setNuevoDocumento] = useState({
    titulo: '',
    descripcion: '',
    categoria: '',
    archivo: null
  });
  const [filtro, setFiltro] = useState({ categoria: '', estado: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    fetchWithAuth(`${API_URL}/documentos/`)
      .then(res => res.json())
      .then(data => {
        setDocumentos(data);
      })
      .catch(err => {
        setError('Error al cargar documentos: ' + err.message);
      });
  }, []);

  const crearDocumento = () => {
    if (!nuevoDocumento.titulo || !nuevoDocumento.descripcion) {
      alert('Por favor completa título y descripción');
      return;
    }

    const formData = new FormData();
    formData.append('titulo', nuevoDocumento.titulo);
    formData.append('descripcion', nuevoDocumento.descripcion);
    formData.append('categoria', nuevoDocumento.categoria);
    if (nuevoDocumento.archivo) {
      formData.append('archivo', nuevoDocumento.archivo);
    }

    fetchWithAuth(`${API_URL}/documentos/`, {
      method: 'POST',
      body: formData
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert('Error: ' + data.error);
      } else {
        setDocumentos([...documentos, data]);
        setNuevoDocumento({
          titulo: '',
          descripcion: '',
          categoria: '',
          archivo: null
        });
      }
    })
    .catch(err => {
      alert('Error al crear documento: ' + err.message);
    });
  };

  const eliminarDocumento = (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este documento?')) return;

    fetchWithAuth(`${API_URL}/documentos/${id}`, {
      method: 'DELETE'
    })
    .then(res => {
      if (res.ok) {
        setDocumentos(documentos.filter(d => d.id !== id));
      } else {
        alert('Error al eliminar documento');
      }
    })
    .catch(err => {
      alert('Error al eliminar documento: ' + err.message);
    });
  };

  const descargarDocumento = (id, nombreArchivo) => {
    fetchWithAuth(`${API_URL}/documentos/${id}/descargar`)
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nombreArchivo;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      })
      .catch(err => {
        alert('Error al descargar documento: ' + err.message);
      });
  };

  const getCategoriaColor = (categoria) => {
    switch (categoria) {
      case 'Manual': return '#3498db';
      case 'Procedimiento': return '#e74c3c';
      case 'Formulario': return '#f39c12';
      case 'Política': return '#9b59b6';
      case 'Reporte': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  const documentosFiltrados = documentos.filter(documento => {
    if (filtro.categoria && documento.categoria !== filtro.categoria) return false;
    return true;
  });

  return (
    <article className="documentos-container">
      <header className="documentos-header">
        <h2>📄 Gestión de Documentos</h2>
        <p>Administración y almacenamiento de documentos del sistema</p>
      </header>

      <section className="documentos-content">
        {error && <div className="error-message">{error}</div>}

        {/* Formulario para crear documento */}
        <div className="form-section">
          <h3>📝 Subir Nuevo Documento</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Título:</label>
              <input
                type="text"
                value={nuevoDocumento.titulo}
                onChange={(e) => setNuevoDocumento({...nuevoDocumento, titulo: e.target.value})}
                placeholder="Título del documento"
              />
            </div>
            <div className="form-group">
              <label>Descripción:</label>
              <textarea
                value={nuevoDocumento.descripcion}
                onChange={(e) => setNuevoDocumento({...nuevoDocumento, descripcion: e.target.value})}
                placeholder="Descripción del documento"
                rows="3"
              />
            </div>
            <div className="form-group">
              <label>Categoría:</label>
              <select
                value={nuevoDocumento.categoria}
                onChange={(e) => setNuevoDocumento({...nuevoDocumento, categoria: e.target.value})}
              >
                <option value="">Seleccionar categoría</option>
                <option value="Manual">Manual</option>
                <option value="Procedimiento">Procedimiento</option>
                <option value="Formulario">Formulario</option>
                <option value="Política">Política</option>
                <option value="Reporte">Reporte</option>
              </select>
            </div>
            <div className="form-group">
              <label>Archivo:</label>
              <input
                type="file"
                onChange={(e) => setNuevoDocumento({...nuevoDocumento, archivo: e.target.files[0]})}
                accept=".pdf,.doc,.docx,.txt,.xlsx,.xls"
              />
            </div>
            <div className="form-group">
              <button onClick={crearDocumento} className="btn-primary">
                <FaPlus /> Subir Documento
              </button>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="filters-section">
          <h3>🔍 Filtros</h3>
          <div className="filters-grid">
            <div className="filter-group">
              <label>Categoría:</label>
              <select
                value={filtro.categoria}
                onChange={(e) => setFiltro({...filtro, categoria: e.target.value})}
              >
                <option value="">Todas</option>
                <option value="Manual">Manual</option>
                <option value="Procedimiento">Procedimiento</option>
                <option value="Formulario">Formulario</option>
                <option value="Política">Política</option>
                <option value="Reporte">Reporte</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de documentos */}
        <div className="list-section">
          <h3>📚 Documentos ({documentosFiltrados.length})</h3>
          <div className="cards-grid">
            {documentosFiltrados.map(documento => (
              <div key={documento.id} className="card">
                <div className="card-header">
                  <h4>{documento.titulo}</h4>
                  <span 
                    className="badge"
                    style={{ backgroundColor: getCategoriaColor(documento.categoria) }}
                  >
                    {documento.categoria}
                  </span>
                </div>
                <div className="card-body">
                  <p><strong>Descripción:</strong> {documento.descripcion}</p>
                  <p><strong>Archivo:</strong> {documento.nombre_archivo}</p>
                  <p><strong>Tamaño:</strong> {documento.tamaño ? `${(documento.tamaño / 1024).toFixed(1)} KB` : 'N/A'}</p>
                  <p><strong>Subido:</strong> {new Date(documento.fecha_subida).toLocaleDateString()}</p>
                </div>
                <div className="card-actions">
                  <button 
                    onClick={() => descargarDocumento(documento.id, documento.nombre_archivo)}
                    className="btn-secondary"
                    title="Descargar documento"
                  >
                    <FaDownload />
                  </button>
                  <button 
                    onClick={() => eliminarDocumento(documento.id)}
                    className="btn-danger"
                    title="Eliminar documento"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </article>
  );
}

export function BitacorasPanel() {
  return (
    <article className="bitacoras-container">
      <header className="bitacoras-header">
        <h2>📝 Bitácoras de Mantenimiento</h2>
      </header>
      <section className="bitacoras-content">
        <p>Bitácoras de mantenimiento en desarrollo...</p>
      </section>
    </article>
  );
}

export function TrabajosAdminPanel({ admin }) {
  return (
    <article className="trabajos-container">
      <header className="trabajos-header">
        <h2>🔧 Gestión de Trabajos</h2>
      </header>
      <section className="trabajos-content">
        <p>Gestión de trabajos en desarrollo...</p>
      </section>
    </article>
  );
}

export function MantenimientosPanel({ admin }) {
  const [mantenimientos, setMantenimientos] = useState([]);
  const [nuevoMantenimiento, setNuevoMantenimiento] = useState({
    equipo_id: '',
    tipo: 'Preventivo',
    descripcion: '',
    fecha_programada: '',
    responsable: '',
    estado: 'Programado'
  });
  const [equipos, setEquipos] = useState([]);
  const [filtro, setFiltro] = useState({ estado: '', tipo: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    Promise.all([
      fetchWithAuth(`${API_URL}/bitacoras/`).then(res => res.json()),
      fetchWithAuth(`${API_URL}/inventario/`).then(res => res.json())
    ]).then(([mant, eq]) => {
      setMantenimientos(mant);
      setEquipos(eq);
    }).catch(err => {
      setError('Error al cargar datos: ' + err.message);
    });
  }, []);

  const crearMantenimiento = () => {
    if (!nuevoMantenimiento.equipo_id || !nuevoMantenimiento.descripcion) {
      alert('Por favor completa equipo y descripción');
      return;
    }

    fetchWithAuth(`${API_URL}/bitacoras/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevoMantenimiento)
    })
    .then(res => res.json())
    .then(data => {
      setMantenimientos([...mantenimientos, data]);
      setNuevoMantenimiento({
        equipo_id: '',
        tipo: 'Preventivo',
        descripcion: '',
        fecha_programada: '',
        responsable: '',
        estado: 'Programado'
      });
    })
    .catch(err => {
      alert('Error al crear mantenimiento: ' + err.message);
    });
  };

  const actualizarEstado = (id, nuevoEstado) => {
    fetchWithAuth(`${API_URL}/bitacoras/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado })
    })
    .then(res => res.json())
    .then(data => {
      setMantenimientos(mantenimientos.map(m => m.id === id ? data : m));
    })
    .catch(err => {
      alert('Error al actualizar mantenimiento: ' + err.message);
    });
  };

  const eliminarMantenimiento = (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este mantenimiento?')) return;

    fetchWithAuth(`${API_URL}/bitacoras/${id}`, {
      method: 'DELETE'
    })
    .then(() => {
      setMantenimientos(mantenimientos.filter(m => m.id !== id));
    })
    .catch(err => {
      alert('Error al eliminar mantenimiento: ' + err.message);
    });
  };

  const mantenimientosFiltrados = mantenimientos.filter(mant => {
    return (!filtro.estado || mant.estado === filtro.estado) &&
           (!filtro.tipo || mant.tipo === filtro.tipo);
  });

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Programado': return '#1976d2';
      case 'En Proceso': return '#f57c00';
      case 'Completado': return '#43a047';
      case 'Cancelado': return '#666';
      default: return '#666';
    }
  };

  const getTipoColor = (tipo) => {
    switch (tipo) {
      case 'Preventivo': return '#43a047';
      case 'Correctivo': return '#ff6b6b';
      case 'Predictivo': return '#8e24aa';
      default: return '#666';
    }
  };

  const getEquipoNombre = (equipoId) => {
    const equipo = equipos.find(e => e.id === equipoId);
    return equipo ? equipo.equipo : 'Equipo no encontrado';
  };

  return (
    <div className="mantenimientos-container">
      <header className="mantenimientos-header">
        <h2>🔧 Gestión de Mantenimientos</h2>
        <div className="mantenimientos-actions">
          <button className="action-btn export-btn" onClick={() => alert('Función de exportar en desarrollo')}>
            <FaDownload /> Exportar
          </button>
        </div>
      </header>

      {error && <div className="error-message">{error}</div>}

      {/* Formulario para crear mantenimiento */}
      <section className="mantenimiento-form-section">
        <h3>📝 Programar Nuevo Mantenimiento</h3>
        <div className="form-grid">
          <div className="form-field">
            <label>Equipo *</label>
            <select
              className="form-select"
              value={nuevoMantenimiento.equipo_id}
              onChange={(e) => setNuevoMantenimiento({...nuevoMantenimiento, equipo_id: e.target.value})}
            >
              <option value="">Seleccionar equipo</option>
              {equipos.map(equipo => (
                <option key={equipo.id} value={equipo.id}>
                  {equipo.equipo} - {equipo.tipo}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>Tipo de Mantenimiento</label>
            <select
              className="form-select"
              value={nuevoMantenimiento.tipo}
              onChange={(e) => setNuevoMantenimiento({...nuevoMantenimiento, tipo: e.target.value})}
            >
              <option value="Preventivo">Preventivo</option>
              <option value="Correctivo">Correctivo</option>
              <option value="Predictivo">Predictivo</option>
            </select>
          </div>
          <div className="form-field">
            <label>Fecha Programada</label>
            <input
              type="date"
              className="form-input"
              value={nuevoMantenimiento.fecha_programada}
              onChange={(e) => setNuevoMantenimiento({...nuevoMantenimiento, fecha_programada: e.target.value})}
            />
          </div>
          <div className="form-field">
            <label>Responsable</label>
            <input
              type="text"
              className="form-input"
              value={nuevoMantenimiento.responsable}
              onChange={(e) => setNuevoMantenimiento({...nuevoMantenimiento, responsable: e.target.value})}
              placeholder="Nombre del responsable"
            />
          </div>
        </div>
        <div className="form-field">
          <label>Descripción *</label>
          <textarea
            className="form-input"
            value={nuevoMantenimiento.descripcion}
            onChange={(e) => setNuevoMantenimiento({...nuevoMantenimiento, descripcion: e.target.value})}
            placeholder="Describe las tareas de mantenimiento a realizar..."
            rows="3"
          />
        </div>
        <button className="submit-btn" onClick={crearMantenimiento}>
          <FaPlus /> Programar Mantenimiento
        </button>
      </section>

      {/* Filtros */}
      <section className="filtros-section">
        <h3>🔍 Filtros</h3>
        <div className="filtros">
          <select
            className="filtro-select"
            value={filtro.estado}
            onChange={(e) => setFiltro({...filtro, estado: e.target.value})}
          >
            <option value="">Todos los estados</option>
            <option value="Programado">Programado</option>
            <option value="En Proceso">En Proceso</option>
            <option value="Completado">Completado</option>
            <option value="Cancelado">Cancelado</option>
          </select>
          <select
            className="filtro-select"
            value={filtro.tipo}
            onChange={(e) => setFiltro({...filtro, tipo: e.target.value})}
          >
            <option value="">Todos los tipos</option>
            <option value="Preventivo">Preventivo</option>
            <option value="Correctivo">Correctivo</option>
            <option value="Predictivo">Predictivo</option>
          </select>
        </div>
      </section>

      {/* Lista de mantenimientos */}
      <section className="mantenimientos-list-section">
        <h3>📋 Mantenimientos ({mantenimientosFiltrados.length})</h3>
        <div className="mantenimientos-grid">
          {mantenimientosFiltrados.map(mantenimiento => (
            <article key={mantenimiento.id} className="mantenimiento-card">
              <header className="mantenimiento-header">
                <h4>{getEquipoNombre(mantenimiento.equipo_id)}</h4>
                <div className="mantenimiento-badges">
                  <span 
                    className="tipo-badge"
                    style={{backgroundColor: getTipoColor(mantenimiento.tipo)}}
                  >
                    {mantenimiento.tipo}
                  </span>
                  <span 
                    className="estado-badge"
                    style={{backgroundColor: getEstadoColor(mantenimiento.estado)}}
                  >
                    {mantenimiento.estado}
                  </span>
                </div>
              </header>
              <div className="mantenimiento-content">
                <p><strong>Descripción:</strong> {mantenimiento.descripcion}</p>
                <p><strong>Responsable:</strong> {mantenimiento.responsable || 'No asignado'}</p>
                <p><strong>Fecha Programada:</strong> {mantenimiento.fecha_programada ? new Date(mantenimiento.fecha_programada).toLocaleDateString() : 'No programada'}</p>
                <p><strong>Fecha Creación:</strong> {new Date(mantenimiento.fecha_creacion).toLocaleDateString()}</p>
              </div>
              <footer className="mantenimiento-actions">
                {admin && (
                  <select
                    className="estado-select"
                    value={mantenimiento.estado}
                    onChange={(e) => actualizarEstado(mantenimiento.id, e.target.value)}
                  >
                    <option value="Programado">Programado</option>
                    <option value="En Proceso">En Proceso</option>
                    <option value="Completado">Completado</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                )}
                <button 
                  className="action-btn delete-btn"
                  onClick={() => eliminarMantenimiento(mantenimiento.id)}
                  title="Eliminar mantenimiento"
                >
                  <FaTrash />
                </button>
              </footer>
            </article>
          ))}
        </div>
        {mantenimientosFiltrados.length === 0 && (
          <div className="empty-state">
            <p>No hay mantenimientos que coincidan con los filtros seleccionados.</p>
          </div>
        )}
      </section>
    </div>
  );
}

export function PropuestasMejoraPanel({ admin, usuario }) {
  const [propuestas, setPropuestas] = useState([]);
  const [nuevaPropuesta, setNuevaPropuesta] = useState({
    titulo: '',
    descripcion: '',
    categoria: '',
    prioridad: 'Media',
    estado: 'Pendiente',
    beneficios: '',
    costo_estimado: ''
  });
  const [filtro, setFiltro] = useState({ estado: '', prioridad: '', categoria: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    fetchWithAuth(`${API_URL}/propuestas/`)
      .then(res => res.json())
      .then(data => {
        if (admin) {
          setPropuestas(data);
        } else {
          setPropuestas(data.filter(p => p.usuario_nombre === usuario || p.usuario_nombre_perfil === usuario));
        }
      })
      .catch(err => {
        setError('Error al cargar propuestas: ' + err.message);
      });
  }, [admin, usuario]);

  const crearPropuesta = () => {
    if (!nuevaPropuesta.titulo || !nuevaPropuesta.descripcion) {
      alert('Por favor completa título y descripción');
      return;
    }

    fetchWithAuth(`${API_URL}/propuestas/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevaPropuesta)
    })
    .then(res => res.json())
    .then(data => {
      setPropuestas([...propuestas, data]);
      setNuevaPropuesta({
        titulo: '',
        descripcion: '',
        categoria: '',
        prioridad: 'Media',
        estado: 'Pendiente',
        beneficios: '',
        costo_estimado: ''
      });
    })
    .catch(err => {
      alert('Error al crear propuesta: ' + err.message);
    });
  };

  const actualizarEstado = (id, nuevoEstado) => {
    fetchWithAuth(`${API_URL}/propuestas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado })
    })
    .then(res => res.json())
    .then(data => {
      setPropuestas(propuestas.map(p => p.id === id ? data : p));
    })
    .catch(err => {
      alert('Error al actualizar propuesta: ' + err.message);
    });
  };

  const eliminarPropuesta = (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta propuesta?')) return;

    fetchWithAuth(`${API_URL}/propuestas/${id}`, {
      method: 'DELETE'
    })
    .then(() => {
      setPropuestas(propuestas.filter(p => p.id !== id));
    })
    .catch(err => {
      alert('Error al eliminar propuesta: ' + err.message);
    });
  };

  const propuestasFiltradas = propuestas.filter(propuesta => {
    return (!filtro.estado || propuesta.estado === filtro.estado) &&
           (!filtro.prioridad || propuesta.prioridad === filtro.prioridad) &&
           (!filtro.categoria || propuesta.categoria === filtro.categoria);
  });

  const getPrioridadColor = (prioridad) => {
    switch (prioridad) {
      case 'Alta': return '#ff6b6b';
      case 'Media': return '#fbc02d';
      case 'Baja': return '#43a047';
      default: return '#666';
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Pendiente': return '#1976d2';
      case 'En Revisión': return '#f57c00';
      case 'Aprobada': return '#43a047';
      case 'Rechazada': return '#666';
      case 'Implementada': return '#2e7d32';
      default: return '#666';
    }
  };

  return (
    <div className="propuestas-container">
      <header className="propuestas-header">
        <h2>💡 Propuestas de Mejora</h2>
        <div className="propuestas-actions">
          <button className="action-btn export-btn" onClick={() => alert('Función de exportar en desarrollo')}>
            <FaDownload /> Exportar
          </button>
        </div>
      </header>

      {error && <div className="error-message">{error}</div>}

      {/* Formulario para crear propuesta */}
      <section className="propuesta-form-section">
        <h3>📝 Crear Nueva Propuesta</h3>
        <div className="form-grid">
          <div className="form-field">
            <label>Título *</label>
            <input
              type="text"
              className="form-input"
              value={nuevaPropuesta.titulo}
              onChange={(e) => setNuevaPropuesta({...nuevaPropuesta, titulo: e.target.value})}
              placeholder="Título de la propuesta"
            />
          </div>
          <div className="form-field">
            <label>Categoría</label>
            <select
              className="form-select"
              value={nuevaPropuesta.categoria}
              onChange={(e) => setNuevaPropuesta({...nuevaPropuesta, categoria: e.target.value})}
            >
              <option value="">Seleccionar categoría</option>
              <option value="Procesos">Procesos</option>
              <option value="Tecnología">Tecnología</option>
              <option value="Infraestructura">Infraestructura</option>
              <option value="Seguridad">Seguridad</option>
              <option value="Productividad">Productividad</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
          <div className="form-field">
            <label>Prioridad</label>
            <select
              className="form-select"
              value={nuevaPropuesta.prioridad}
              onChange={(e) => setNuevaPropuesta({...nuevaPropuesta, prioridad: e.target.value})}
            >
              <option value="Baja">Baja</option>
              <option value="Media">Media</option>
              <option value="Alta">Alta</option>
            </select>
          </div>
          <div className="form-field">
            <label>Costo Estimado</label>
            <input
              type="text"
              className="form-input"
              value={nuevaPropuesta.costo_estimado}
              onChange={(e) => setNuevaPropuesta({...nuevaPropuesta, costo_estimado: e.target.value})}
              placeholder="Ej: $5,000 USD"
            />
          </div>
        </div>
        <div className="form-field">
          <label>Descripción *</label>
          <textarea
            className="form-input"
            value={nuevaPropuesta.descripcion}
            onChange={(e) => setNuevaPropuesta({...nuevaPropuesta, descripcion: e.target.value})}
            placeholder="Describe la propuesta de mejora..."
            rows="3"
          />
        </div>
        <div className="form-field">
          <label>Beneficios Esperados</label>
          <textarea
            className="form-input"
            value={nuevaPropuesta.beneficios}
            onChange={(e) => setNuevaPropuesta({...nuevaPropuesta, beneficios: e.target.value})}
            placeholder="Describe los beneficios que se esperan obtener..."
            rows="2"
          />
        </div>
        <button className="submit-btn" onClick={crearPropuesta}>
          <FaPlus /> Crear Propuesta
        </button>
      </section>

      {/* Filtros */}
      <section className="filtros-section">
        <h3>🔍 Filtros</h3>
        <div className="filtros">
          <select
            className="filtro-select"
            value={filtro.estado}
            onChange={(e) => setFiltro({...filtro, estado: e.target.value})}
          >
            <option value="">Todos los estados</option>
            <option value="Pendiente">Pendiente</option>
            <option value="En Revisión">En Revisión</option>
            <option value="Aprobada">Aprobada</option>
            <option value="Rechazada">Rechazada</option>
            <option value="Implementada">Implementada</option>
          </select>
          <select
            className="filtro-select"
            value={filtro.prioridad}
            onChange={(e) => setFiltro({...filtro, prioridad: e.target.value})}
          >
            <option value="">Todas las prioridades</option>
            <option value="Alta">Alta</option>
            <option value="Media">Media</option>
            <option value="Baja">Baja</option>
          </select>
          <select
            className="filtro-select"
            value={filtro.categoria}
            onChange={(e) => setFiltro({...filtro, categoria: e.target.value})}
          >
            <option value="">Todas las categorías</option>
            <option value="Procesos">Procesos</option>
            <option value="Tecnología">Tecnología</option>
            <option value="Infraestructura">Infraestructura</option>
            <option value="Seguridad">Seguridad</option>
            <option value="Productividad">Productividad</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
      </section>

      {/* Lista de propuestas */}
      <section className="propuestas-list-section">
        <h3>📋 Propuestas ({propuestasFiltradas.length})</h3>
        <div className="propuestas-grid">
          {propuestasFiltradas.map(propuesta => (
            <article key={propuesta.id} className="propuesta-card">
              <header className="propuesta-header">
                <h4>{propuesta.titulo}</h4>
                <div className="propuesta-badges">
                  <span 
                    className="prioridad-badge"
                    style={{backgroundColor: getPrioridadColor(propuesta.prioridad)}}
                  >
                    {propuesta.prioridad}
                  </span>
                  <span 
                    className="estado-badge"
                    style={{backgroundColor: getEstadoColor(propuesta.estado)}}
                  >
                    {propuesta.estado}
                  </span>
                </div>
              </header>
              <div className="propuesta-content">
                <p><strong>Descripción:</strong> {propuesta.descripcion}</p>
                <p><strong>Categoría:</strong> {propuesta.categoria || 'Sin categoría'}</p>
                <p><strong>Beneficios:</strong> {propuesta.beneficios || 'No especificado'}</p>
                <p><strong>Costo Estimado:</strong> {propuesta.costo_estimado || 'No especificado'}</p>
                <p><strong>Proponente:</strong> {getDisplayName(propuesta.usuario_nombre)}</p>
                <p><strong>Fecha:</strong> {new Date(propuesta.fecha_creacion).toLocaleDateString()}</p>
              </div>
              <footer className="propuesta-actions">
                {admin && (
                  <select
                    className="estado-select"
                    value={propuesta.estado}
                    onChange={(e) => actualizarEstado(propuesta.id, e.target.value)}
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="En Revisión">En Revisión</option>
                    <option value="Aprobada">Aprobada</option>
                    <option value="Rechazada">Rechazada</option>
                    <option value="Implementada">Implementada</option>
                  </select>
                )}
                <button 
                  className="action-btn delete-btn"
                  onClick={() => eliminarPropuesta(propuesta.id)}
                  title="Eliminar propuesta"
                >
                  <FaTrash />
                </button>
              </footer>
            </article>
          ))}
        </div>
        {propuestasFiltradas.length === 0 && (
          <div className="empty-state">
            <p>No hay propuestas que coincidan con los filtros seleccionados.</p>
          </div>
        )}
      </section>
    </div>
  );
}

export function SoportePanel({ admin, usuario }) {
  return (
    <article className="soporte-container">
      <header className="soporte-header">
        <h2>🆘 Sistema de Soporte</h2>
      </header>
      <section className="soporte-content">
        <p>Sistema de soporte en desarrollo...</p>
      </section>
    </article>
  );
}