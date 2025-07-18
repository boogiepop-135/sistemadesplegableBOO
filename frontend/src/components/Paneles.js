import React, { useEffect, useState } from 'react';
import { FaPlus, FaBell, FaMapMarkerAlt, FaTag, FaTrash, FaEdit, FaUserPlus } from 'react-icons/fa';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { DataGrid } from '@mui/x-data-grid';
import { Button, Box, Tabs, Tab, Grid, Paper } from '@mui/material';

export function InventarioList({ admin, usuario }) {
  const [inventario, setInventario] = useState([]);
  const [nuevoEquipo, setNuevoEquipo] = useState({ nombre: '', tipo: '', estado: 'Disponible', identificador: '' });
  const [asignaciones, setAsignaciones] = useState({});
  const [filtro, setFiltro] = useState({ tipo: '', estado: '' });
  const [tab, setTab] = useState(0);

  useEffect(() => {
    fetch('http://localhost:5000/inventario/')
      .then(res => res.json())
      .then(data => {
        if (admin) {
          setInventario(data);
        } else {
          setInventario(data.filter(e => e.usuario_nombre === usuario));
        }
      });
  }, [admin, usuario]);

  const agregarEquipo = () => {
    if (!nuevoEquipo.nombre || !nuevoEquipo.tipo || !nuevoEquipo.estado || !nuevoEquipo.identificador) return;
    fetch('http://localhost:5000/inventario/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        equipo: nuevoEquipo.nombre,
        tipo: nuevoEquipo.tipo,
        estado: nuevoEquipo.estado,
        identificador: nuevoEquipo.identificador
      })
    })
      .then(res => res.json())
      .then(data => {
        setInventario([...inventario, data]);
        setNuevoEquipo({ nombre: '', tipo: '', estado: 'Disponible', identificador: '' });
      });
  };

  // Columnas para DataGrid
  const columns = [
    { field: 'equipo', headerName: 'Equipo', flex: 1 },
    { field: 'tipo', headerName: 'Tipo', flex: 1 },
    { field: 'estado', headerName: 'Estado', flex: 1 },
    { field: 'usuario_nombre', headerName: 'Usuario', flex: 1 },
    { field: 'codigo_unico', headerName: 'Código Único', flex: 1 }
  ];

  // Filtro aplicado
  const inventarioFiltrado = inventario.filter(e =>
    (!filtro.tipo || e.tipo === filtro.tipo) &&
    (!filtro.estado || e.estado === filtro.estado)
  );

  // Exportar a Excel usando el endpoint backend
  const exportarExcel = () => {
    const params = [];
    if (filtro.tipo) params.push(`tipo=${encodeURIComponent(filtro.tipo)}`);
    if (filtro.estado) params.push(`estado=${encodeURIComponent(filtro.estado)}`);
    const url = `http://localhost:5000/inventario/exportar${params.length ? '?' + params.join('&') : ''}`;
    window.open(url, '_blank');
  };

  return (
    <Box sx={{ width: '100vw', maxWidth: '100vw', bgcolor: 'background.paper', borderRadius: 2, boxShadow: 2, p: 2, minHeight: '80vh', overflowX: 'auto' }}>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} centered>
        <Tab label="Inventario" />
        <Tab label="Gráficos" />
      </Tabs>
      {tab === 0 && (
        <Grid container spacing={2} sx={{ mt: 2, width: '100vw', maxWidth: '100vw' }}>
          {/* Filtros y formulario a la izquierda */}
          <Grid item xs={12} md={4} lg={3} xl={2}>
            {admin && (
              <Paper sx={{ mb: 2, p: 2, background: '#f8fff8', borderRadius: 2, boxShadow: 1 }}>
                <h3 style={{ color: '#388e3c', marginBottom: 8 }}>Agregar equipo</h3>
                <input
                  type="text"
                  value={nuevoEquipo.nombre}
                  onChange={e => setNuevoEquipo({ ...nuevoEquipo, nombre: e.target.value })}
                  placeholder="Nombre del equipo"
                  style={{ padding: '10px', borderRadius: '6px', border: '1px solid #a5d6a7', minWidth: 160, marginBottom: 8, width: '100%' }}
                />
                <input
                  type="text"
                  value={nuevoEquipo.tipo}
                  onChange={e => setNuevoEquipo({ ...nuevoEquipo, tipo: e.target.value })}
                  placeholder="Tipo/Categoría"
                  style={{ padding: '10px', borderRadius: '6px', border: '1px solid #a5d6a7', minWidth: 160, marginBottom: 8, width: '100%' }}
                />
                <select
                  value={nuevoEquipo.estado}
                  onChange={e => setNuevoEquipo({ ...nuevoEquipo, estado: e.target.value })}
                  style={{ padding: '10px', borderRadius: '6px', border: '1px solid #a5d6a7', minWidth: 140, marginBottom: 8, width: '100%' }}
                >
                  <option value="Disponible">Disponible</option>
                  <option value="Asignado">Asignado</option>
                  <option value="En reparación">En reparación</option>
                  <option value="Baja">Baja</option>
                </select>
                <input
                  type="text"
                  value={nuevoEquipo.identificador}
                  onChange={e => setNuevoEquipo({ ...nuevoEquipo, identificador: e.target.value })}
                  placeholder="Código Único"
                  style={{ padding: '10px', borderRadius: '6px', border: '1px solid #a5d6a7', minWidth: 160, marginBottom: 8, width: '100%' }}
                />
                <Button variant="contained" color="success" onClick={agregarEquipo} sx={{ minWidth: 120, fontWeight: 'bold', fontSize: '1em', width: '100%' }}>
                  <FaPlus style={{ marginRight: 6 }} /> Agregar
                </Button>
              </Paper>
            )}
            <Paper sx={{ p: 2, background: '#f8fff8', borderRadius: 2, boxShadow: 1 }}>
              <h3 style={{ color: '#388e3c', marginBottom: 8 }}>Filtros</h3>
              <select
                value={filtro.tipo}
                onChange={e => setFiltro(f => ({ ...f, tipo: e.target.value }))}
                style={{ padding: 8, borderRadius: 6, border: '1px solid #a5d6a7', marginBottom: 8, width: '100%' }}
              >
                <option value="">Tipo</option>
                {[...new Set(inventario.map(e => e.tipo))].map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
              </select>
              <select
                value={filtro.estado}
                onChange={e => setFiltro(f => ({ ...f, estado: e.target.value }))}
                style={{ padding: 8, borderRadius: 6, border: '1px solid #a5d6a7', marginBottom: 8, width: '100%' }}
              >
                <option value="">Estado</option>
                {[...new Set(inventario.map(e => e.estado))].map(estado => <option key={estado} value={estado}>{estado}</option>)}
              </select>
              <Button variant="contained" color="success" onClick={exportarExcel} sx={{ minWidth: 120, width: '100%' }}>Exportar a Excel</Button>
            </Paper>
          </Grid>
          {/* Tabla a la derecha */}
          <Grid item xs={12} md={8} lg={9} xl={10}>
            <Paper sx={{ p: 2, background: '#fff', borderRadius: 2, boxShadow: 2, width: '100%', minWidth: 0 }}>
              <div style={{ height: 500, width: '100%' }}>
                <DataGrid
                  rows={inventarioFiltrado.map(e => ({ ...e, id: e.id }))}
                  columns={columns}
                  pageSize={10}
                  rowsPerPageOptions={[10, 25, 50]}
                  disableSelectionOnClick
                  autoHeight={false}
                  sx={{ fontFamily: 'Segoe UI, Arial', fontSize: '1em', border: 0 }}
                />
              </div>
            </Paper>
          </Grid>
        </Grid>
      )}
      {tab === 1 && (
        <Box sx={{ mt: 4, display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
          {/* Gráficos aquí */}
        </Box>
      )}
    </Box>
  );
}

export function TicketsList({ admin, usuario }) {
  const [tickets, setTickets] = useState([]);
  const [descripcion, setDescripcion] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/tickets/')
      .then(res => res.json())
      .then(data => setTickets(data));
  }, []);

  const crearTicket = () => {
    if (!descripcion) return;
    fetch('http://localhost:5000/tickets/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ descripcion, usuario_id: usuario.id || 1 }) // Usa el id real si está disponible
    })
      .then(res => res.json())
      .then(data => {
        setTickets([...tickets, data]);
        setDescripcion('');
      });
  };

  const finalizarTicket = (id) => {
    fetch(`http://localhost:5000/tickets/${id}/cerrar`, {
      method: 'POST'
    })
      .then(res => res.json())
      .then(data => {
        setTickets(tickets.map(t => t.id === id ? data : t));
      });
  };

  // Agrega las funciones para pausar y descartar ticket
  const pausarTicket = (id) => {
    fetch(`http://localhost:5000/tickets/${id}/pausar`, {
      method: 'POST'
    })
      .then(res => res.json())
      .then(data => {
        setTickets(tickets.map(t => t.id === id ? data : t));
      });
  };
  const descartarTicket = (id) => {
    fetch(`http://localhost:5000/tickets/${id}/descartar`, {
      method: 'POST'
    })
      .then(res => res.json())
      .then(data => {
        setTickets(tickets.map(t => t.id === id ? data : t));
      });
  };

  // Filtrar tickets según usuario
  const ticketsFiltrados = admin ? tickets : tickets.filter(t => t.usuario_nombre === usuario);

  return (
    <Box sx={{ width: '100vw', maxWidth: '100vw', bgcolor: 'background.paper', borderRadius: 0, boxShadow: 0, p: { xs: 1, md: 3 }, minHeight: '80vh', overflowX: 'auto' }}>
      <Grid container spacing={2} alignItems="flex-start">
        <Grid item xs={12} md={4} lg={3} xl={2}>
          <Paper sx={{ p: 2, mb: 2, background: '#f8fff8', borderRadius: 2, boxShadow: 1, minWidth: 0 }}>
            <h3 style={{ color: '#388e3c', marginBottom: 8, textAlign: 'center' }}>Crear Ticket</h3>
            <textarea
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Descripción del problema..."
              style={{ width: '100%', minHeight: 120, padding: 10, borderRadius: 8, border: '1.5px solid #a5d6a7', marginBottom: 12, fontSize: '1em', resize: 'vertical', boxSizing: 'border-box' }}
            />
            <Button variant="contained" color="success" onClick={crearTicket} sx={{ width: '100%', fontWeight: 'bold', fontSize: '1.1em', py: 1.2, borderRadius: 1 }}>
              <FaPlus style={{ marginRight: 8 }} /> CREAR TICKET
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={8} lg={9} xl={10}>
          <Paper sx={{ p: 2, background: '#fff', borderRadius: 2, boxShadow: 2, width: '100%', minWidth: 0, minHeight: 300 }}>
            <div style={{ maxHeight: 520, overflowY: 'auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {ticketsFiltrados.map(t => (
                <div key={t.id} style={{ background: '#e8f5e9', borderRadius: 12, boxShadow: '0 2px 8px #c8e6c9', padding: '12px 18px', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 60, maxWidth: 420, marginBottom: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 'bold', color: '#388e3c', fontSize: '1.1em', wordBreak: 'break-word' }}>{t.descripcion}</div>
                    <div style={{ fontSize: '0.93em', color: '#888' }}>Apertura: {t.fecha_apertura} | Usuario: {t.usuario_nombre}</div>
                    <div style={{ fontSize: '0.97em', color: '#555' }}>Estado: <strong>{t.estado}</strong></div>
                  </div>
                  {admin && t.estado !== 'cerrado' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginLeft: 8 }}>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={() => finalizarTicket(t.id)}
                        sx={{ minWidth: 40, fontWeight: 'bold', fontSize: '0.85em', px: 1, py: 0.5, borderRadius: 1 }}
                      >
                        ✓
                      </Button>
                      <Button
                        variant="contained"
                        color="warning"
                        size="small"
                        onClick={() => pausarTicket(t.id)}
                        sx={{ minWidth: 40, fontWeight: 'bold', fontSize: '0.85em', px: 1, py: 0.5, borderRadius: 1 }}
                      >
                        ⏸
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        onClick={() => descartarTicket(t.id)}
                        sx={{ minWidth: 40, fontWeight: 'bold', fontSize: '0.85em', px: 1, py: 0.5, borderRadius: 1 }}
                      >
                        ✗
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export function Avisos({ admin }) {
  const [aviso, setAviso] = useState('');
  const [nuevoAviso, setNuevoAviso] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/avisos')
      .then(res => res.json())
      .then(data => setAviso(data.mensaje));
  }, []);

  const fijarAviso = () => {
    if (!nuevoAviso) return;
    fetch('http://localhost:5000/avisos/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mensaje: nuevoAviso })
    })
      .then(res => res.json())
      .then(data => {
        setAviso(data.mensaje);
        setNuevoAviso('');
      });
  };

  return (
    <Box sx={{ width: '100vw', maxWidth: '100vw', bgcolor: 'background.paper', borderRadius: 2, boxShadow: 2, p: 2, minHeight: '80vh', overflowX: 'auto' }}>
      <Grid container spacing={2} justifyContent="center" alignItems="flex-start">
        <Grid item xs={12} md={6} lg={5} xl={4}>
          <Paper sx={{ p: 2, background: 'linear-gradient(135deg, #e8f5e9 80%, #c8e6c9 100%)', borderRadius: 3, boxShadow: 2, minHeight: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', maxWidth: 340, margin: '0 auto' }}>
            <FaBell style={{ color: '#43a047', fontSize: '1.7em', marginBottom: 6 }} />
            <h3 style={{ color: '#388e3c', marginBottom: 4, textAlign: 'center', fontSize: '1.08em' }}>Aviso Importante</h3>
            <p style={{ margin: 0, fontSize: '1em', color: '#2e7d32', textAlign: 'center', fontWeight: 500, wordBreak: 'break-word' }}>{aviso?.mensaje || 'No hay avisos por el momento.'}</p>
            {aviso?.fecha && (
              <span style={{ fontSize: '0.91em', color: '#888', marginTop: 4, textAlign: 'center', display: 'block' }}>
                Publicado: {new Date(aviso.fecha).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
              </span>
            )}
          </Paper>
        </Grid>
        {admin && (
          <Grid item xs={12} md={4} lg={3} xl={2}>
            <Paper sx={{ p: 3, background: '#f8fff8', borderRadius: 3, boxShadow: 1, mt: { xs: 3, md: 0 } }}>
              <h3 style={{ color: '#388e3c', marginBottom: 8, textAlign: 'center' }}>Nuevo Aviso</h3>
              <input
                type="text"
                value={nuevoAviso}
                onChange={e => setNuevoAviso(e.target.value)}
                placeholder="Escribir aviso..."
                style={{ padding: '10px', borderRadius: '6px', border: '1px solid #a5d6a7', width: '100%', marginBottom: 12 }}
              />
              <Button variant="contained" color="success" onClick={fijarAviso} sx={{ minWidth: 120, fontWeight: 'bold', fontSize: '1em', width: '100%' }}>
                <FaPlus style={{ marginRight: 6 }} /> Fijar Aviso
              </Button>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

export function UsuariosAdmin() {
  const [usuarios, setUsuarios] = useState([]);
  const [nuevoUsuario, setNuevoUsuario] = useState({ usuario: '', contrasena: '', rol: 'usuario' });
  const [editData, setEditData] = useState({ usuario: '', contrasena: '', rol: 'usuario' });

  useEffect(() => {
    fetch('http://localhost:5000/usuarios')
      .then(res => res.json())
      .then(data => setUsuarios(data));
  }, [usuarios.length]);

  const crearUsuario = () => {
    if (!nuevoUsuario.usuario || !nuevoUsuario.contrasena) return;
    fetch('http://localhost:5000/usuarios/crear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevoUsuario)
    })
      .then(res => res.json())
      .then(() => {
        setNuevoUsuario({ usuario: '', contrasena: '', rol: 'usuario' });
        fetch('http://localhost:5000/usuarios')
          .then(res => res.json())
          .then(data => setUsuarios(data));
      });
  };

  const borrarUsuario = (id) => {
    fetch(`http://localhost:5000/usuarios/${id}`, {
      method: 'DELETE'
    })
      .then(res => res.json())
      .then(() => {
        fetch('http://localhost:5000/usuarios')
          .then(res => res.json())
          .then(data => setUsuarios(data));
      });
  };

  return (
    <Box sx={{ width: '100vw', maxWidth: '100vw', bgcolor: 'background.paper', borderRadius: 2, boxShadow: 2, p: 2, minHeight: '80vh', overflowX: 'auto' }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4} lg={3} xl={2}>
          <Paper sx={{ p: 2, mb: 2, background: '#f8fff8', borderRadius: 2, boxShadow: 1 }}>
            <h3 style={{ color: '#388e3c', marginBottom: 8 }}>Crear Usuario</h3>
            <input
              type="text"
              placeholder="Usuario"
              value={nuevoUsuario.usuario}
              onChange={e => setNuevoUsuario({ ...nuevoUsuario, usuario: e.target.value })}
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #a5d6a7', width: '100%', marginBottom: 8 }}
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={nuevoUsuario.contrasena}
              onChange={e => setNuevoUsuario({ ...nuevoUsuario, contrasena: e.target.value })}
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #a5d6a7', width: '100%', marginBottom: 8 }}
            />
            <select
              value={nuevoUsuario.rol}
              onChange={e => setNuevoUsuario({ ...nuevoUsuario, rol: e.target.value })}
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #a5d6a7', width: '100%', marginBottom: 8 }}
            >
              <option value="usuario">Usuario</option>
              <option value="admin">Admin</option>
            </select>
            <Button variant="contained" color="success" onClick={crearUsuario} sx={{ minWidth: 120, fontWeight: 'bold', fontSize: '1em', width: '100%' }}>
              <FaUserPlus style={{ marginRight: 6 }} /> Crear
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={8} lg={9} xl={10}>
          <Paper sx={{ p: 2, background: '#fff', borderRadius: 2, boxShadow: 2, width: '100%', minWidth: 0 }}>
            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {usuarios.map(u => (
                  <li key={u.id} style={{ padding: '10px 0', borderBottom: '1px solid #e0e0e0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ color: '#388e3c' }}>{u.nombre}</strong><br />
                        <span style={{ fontSize: '0.9em', color: '#888' }}>Rol: {u.rol} | Usuario: {u.usuario}</span>
                      </div>
                      <div>
                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          onClick={() => borrarUsuario(u.id)}
                          sx={{ minWidth: 80, fontWeight: 'bold', fontSize: '0.9em', ml: 1 }}
                        >
                          Borrar
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export function DocumentosPanel() {
  const [documentos, setDocumentos] = useState([]);
  const [archivo, setArchivo] = useState(null);
  const [descripcion, setDescripcion] = useState('');
  const [ticketId, setTicketId] = useState('');
  const [inventarioId, setInventarioId] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/documentos/')
      .then(res => res.json())
      .then(data => setDocumentos(data));
  }, []);

  const subirDocumento = (e) => {
    e.preventDefault();
    if (!archivo) return setMensaje('Selecciona un archivo');
    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('descripcion', descripcion);
    if (ticketId) formData.append('ticket_id', ticketId);
    if (inventarioId) formData.append('inventario_id', inventarioId);
    fetch('http://localhost:5000/documentos/subir', {
      method: 'POST',
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDocumentos([...documentos, data.documento]);
          setArchivo(null);
          setDescripcion('');
          setTicketId('');
          setInventarioId('');
          setMensaje('Documento subido correctamente');
        } else {
          setMensaje(data.error || 'Error al subir');
        }
      });
  };

  const eliminarDocumento = (id) => {
    fetch(`http://localhost:5000/documentos/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDocumentos(documentos.filter(d => d.id !== id));
        }
      });
  };

  return (
    <Box sx={{ width: '100vw', maxWidth: '100vw', bgcolor: 'background.paper', borderRadius: 2, boxShadow: 2, p: 2, minHeight: '80vh', overflowX: 'auto' }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4} lg={3} xl={2}>
          <Paper sx={{ p: 2, mb: 2, background: '#f8fff8', borderRadius: 2, boxShadow: 1 }}>
            <h3 style={{ color: '#388e3c', marginBottom: 8 }}>Subir Documento</h3>
            <form onSubmit={subirDocumento}>
              <input type="file" onChange={e => setArchivo(e.target.files[0])} style={{ marginBottom: 8, width: '100%' }} />
              <input
                type="text"
                placeholder="Descripción"
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                style={{ marginBottom: 8, padding: 10, borderRadius: '6px', border: '1px solid #a5d6a7', width: '100%' }}
              />
              <input
                type="text"
                placeholder="Ticket ID (opcional)"
                value={ticketId}
                onChange={e => setTicketId(e.target.value)}
                style={{ marginBottom: 8, padding: 10, borderRadius: '6px', border: '1px solid #a5d6a7', width: '100%' }}
              />
              <input
                type="text"
                placeholder="Inventario ID (opcional)"
                value={inventarioId}
                onChange={e => setInventarioId(e.target.value)}
                style={{ marginBottom: 8, padding: 10, borderRadius: '6px', border: '1px solid #a5d6a7', width: '100%' }}
              />
              <Button type="submit" variant="contained" color="success" sx={{ minWidth: 120, fontWeight: 'bold', fontSize: '1em', width: '100%' }}>
                <FaPlus style={{ marginRight: 6 }} /> Subir
              </Button>
            </form>
            {mensaje && <div style={{ color: '#388e3c', marginTop: 10 }}>{mensaje}</div>}
          </Paper>
        </Grid>
        <Grid item xs={12} md={8} lg={9} xl={10}>
          <Paper sx={{ p: 2, background: '#fff', borderRadius: 2, boxShadow: 2, width: '100%', minWidth: 0 }}>
            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {documentos.map(doc => (
                  <li key={doc.id} style={{ padding: '10px 0', borderBottom: '1px solid #e0e0e0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ color: '#388e3c' }}>{doc.nombre_archivo}</strong><br />
                        <span style={{ fontSize: '0.9em', color: '#888' }}>Subido: {doc.fecha_subida} | Descripción: {doc.descripcion}</span>
                      </div>
                      <div>
                        <a href={`http://localhost:5000/documentos/${doc.id}/descargar`} style={{ marginLeft: 16, color: '#43a047', fontWeight: 'bold' }} target="_blank" rel="noopener noreferrer">
                          Descargar
                        </a>
                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          onClick={() => eliminarDocumento(doc.id)}
                          sx={{ minWidth: 80, fontWeight: 'bold', fontSize: '0.9em', ml: 1 }}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export function BitacorasPanel() {
  const [bitacoras, setBitacoras] = useState([]);
  const [descripcion, setDescripcion] = useState('');
  const [inventarioId, setInventarioId] = useState('');
  const [usuarioId, setUsuarioId] = useState('');
  const [tickets, setTickets] = useState([]);
  const [ticketsSeleccionados, setTicketsSeleccionados] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [equipos, setEquipos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/bitacoras/')
      .then(res => res.json())
      .then(data => setBitacoras(data));
    fetch('http://localhost:5000/inventario')
      .then(res => res.json())
      .then(data => setEquipos(data));
    fetch('http://localhost:5000/usuarios')
      .then(res => res.json())
      .then(data => setUsuarios(data));
    fetch('http://localhost:5000/tickets/')
      .then(res => res.json())
      .then(data => setTickets(data));
  }, []);

  const crearBitacora = (e) => {
    e.preventDefault();
    if (!descripcion || !inventarioId) {
      setMensaje('Completa la descripción y selecciona un equipo');
      return;
    }
    fetch('http://localhost:5000/bitacoras/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        descripcion,
        inventario_id: inventarioId,
        usuario_id: usuarioId || null,
        tickets_codigos: ticketsSeleccionados
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.id) {
          setBitacoras([...bitacoras, data]);
          setDescripcion('');
          setInventarioId('');
          setUsuarioId('');
          setTicketsSeleccionados([]);
          setMensaje('Bitácora registrada');
        } else {
          setMensaje(data.error || 'Error al registrar');
        }
      });
  };

  const eliminarBitacora = (id) => {
    fetch(`http://localhost:5000/bitacoras/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setBitacoras(bitacoras.filter(b => b.id !== id));
        }
      });
  };

  const handleTicketSelect = (codigo) => {
    setTicketsSeleccionados(prev =>
      prev.includes(codigo)
        ? prev.filter(c => c !== codigo)
        : [...prev, codigo]
    );
  };

  return (
    <Box sx={{ width: '100vw', maxWidth: '100vw', bgcolor: 'background.paper', borderRadius: 2, boxShadow: 2, p: 2, minHeight: '80vh', overflowX: 'auto' }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4} lg={3} xl={2}>
          <Paper sx={{ p: 2, mb: 2, background: '#f8fff8', borderRadius: 2, boxShadow: 1 }}>
            <h3 style={{ color: '#388e3c', marginBottom: 8 }}>Registrar Bitácora</h3>
            <form onSubmit={crearBitacora}>
              <input
                type="text"
                placeholder="Descripción"
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                style={{ marginBottom: 8, padding: 10, borderRadius: '6px', border: '1px solid #a5d6a7', width: '100%' }}
              />
              <select
                value={inventarioId}
                onChange={e => setInventarioId(e.target.value)}
                style={{ marginBottom: 8, padding: 10, borderRadius: '6px', border: '1px solid #a5d6a7', width: '100%' }}
              >
                <option value="">Seleccionar Equipo</option>
                {equipos.map(eq => (
                  <option key={eq.id} value={eq.id}>{eq.equipo}</option>
                ))}
              </select>
              <select
                value={usuarioId}
                onChange={e => setUsuarioId(e.target.value)}
                style={{ marginBottom: 8, padding: 10, borderRadius: '6px', border: '1px solid #a5d6a7', width: '100%' }}
              >
                <option value="">Usuario (opcional)</option>
                {usuarios.map(u => (
                  <option key={u.id} value={u.id}>{u.nombre}</option>
                ))}
              </select>
              <div style={{ margin: '10px 0' }}>
                <b>Asociar tickets:</b>
                <div style={{ maxHeight: 120, overflowY: 'auto', border: '1px solid #a5d6a7', borderRadius: 6, padding: 6, background: '#f8fff8' }}>
                  {tickets.map(t => (
                    <label key={t.codigo_unico} style={{ display: 'block', fontSize: '0.95em', marginBottom: 2 }}>
                      <input
                        type="checkbox"
                        checked={ticketsSeleccionados.includes(t.codigo_unico)}
                        onChange={() => handleTicketSelect(t.codigo_unico)}
                      />
                      {` [${t.codigo_unico.slice(0, 8)}] ${t.descripcion} (${t.estado})`}
                    </label>
                  ))}
                </div>
              </div>
              <Button type="submit" variant="contained" color="success" sx={{ minWidth: 120, fontWeight: 'bold', fontSize: '1em', width: '100%' }}>
                <FaPlus style={{ marginRight: 6 }} /> Registrar
              </Button>
            </form>
            {mensaje && <div style={{ color: '#388e3c', marginTop: 10 }}>{mensaje}</div>}
          </Paper>
        </Grid>
        <Grid item xs={12} md={8} lg={9} xl={10}>
          <Paper sx={{ p: 2, background: '#fff', borderRadius: 2, boxShadow: 2, width: '100%', minWidth: 0 }}>
            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {bitacoras.map(b => (
                  <li key={b.id} style={{ padding: '10px 0', borderBottom: '1px solid #e0e0e0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ color: '#388e3c' }}>{b.descripcion}</strong><br />
                        <span style={{ fontSize: '0.9em', color: '#888' }}>Equipo: {equipos.find(eq => eq.id === b.inventario_id)?.equipo || b.inventario_id} | Fecha: {b.fecha}</span>
                      </div>
                      <div>
                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          onClick={() => eliminarBitacora(b.id)}
                          sx={{ minWidth: 80, fontWeight: 'bold', fontSize: '0.9em', ml: 1 }}
                        >
                          Eliminar
                        </Button>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={() => window.open(`http://localhost:5000/bitacoras/${b.id}/pdf`, '_blank')}
                          sx={{ minWidth: 80, fontWeight: 'bold', fontSize: '0.9em', ml: 1 }}
                        >
                          PDF
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export function DiaLabores() {
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/avisos')
      .then(res => res.json())
      .then(data => {
        setMensaje(data.mensaje);
      });
  }, []);

  return (
    <Box sx={{ width: '100vw', minHeight: '60vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Paper sx={{ p: 2, background: 'linear-gradient(135deg, #e8f5e9 80%, #c8e6c9 100%)', borderRadius: 3, boxShadow: 2, minHeight: 80, maxWidth: 340, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <FaBell style={{ color: '#43a047', fontSize: '1.7em', marginBottom: 6 }} />
        <h3 style={{ color: '#388e3c', marginBottom: 4, textAlign: 'center', fontSize: '1.08em' }}>Aviso Importante</h3>
        <p style={{ margin: 0, fontSize: '1em', color: '#2e7d32', textAlign: 'center', fontWeight: 500, wordBreak: 'break-word' }}>{mensaje || 'No hay avisos por el momento.'}</p>
      </Paper>
    </Box>
  );
}

export function TableroFlujoTrabajo() {
  const [tickets, setTickets] = useState([]);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [filtrados, setFiltrados] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/tickets')
      .then(res => res.json())
      .then(data => setTickets(data));
  }, []);

  useEffect(() => {
    if (!fechaInicio && !fechaFin) {
      setFiltrados(tickets);
      return;
    }
    setFiltrados(
      tickets.filter(t => {
        const fecha = new Date(t.fecha_apertura);
        const desde = fechaInicio ? new Date(fechaInicio) : null;
        const hasta = fechaFin ? new Date(fechaFin) : null;
        return (!desde || fecha >= desde) && (!hasta || fecha <= hasta);
      })
    );
  }, [fechaInicio, fechaFin, tickets]);

  const estados = ['abierto', 'en proceso', 'cerrado'];

  return (
    <div>
      <h2 style={{ color: '#43a047' }}>Flujo de trabajo</h2>
      <div style={{ marginBottom: 20, display: 'flex', gap: 16, justifyContent: 'center' }}>
        <label>Desde: <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} /></label>
        <label>Hasta: <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} /></label>
      </div>
      <div style={{ display: 'flex', gap: 24, justifyContent: 'center' }}>
        {estados.map(estado => (
          <div key={estado} style={{ minWidth: 260, background: '#e8f5e9', borderRadius: 10, padding: 16, boxShadow: '0 2px 8px #c8e6c9' }}>
            <h3 style={{ color: '#388e3c', textTransform: 'capitalize', textAlign: 'center' }}>{estado}</h3>
            <ul style={{ minHeight: 120 }}>
              {filtrados.filter(t => (estado === 'en proceso' ? t.estado === 'en proceso' : t.estado === estado)).length === 0 && <li style={{ color: '#888' }}>Sin tickets</li>}
              {filtrados.filter(t => (estado === 'en proceso' ? t.estado === 'en proceso' : t.estado === estado)).map(t => (
                <li key={t.id} style={{ background: '#fff', marginBottom: 8, borderRadius: 6, padding: 10, boxShadow: '0 1px 4px #a5d6a7' }}>
                  <b>{t.descripcion}</b><br />
                  <span style={{ fontSize: '0.9em', color: '#888' }}>Apertura: {t.fecha_apertura}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TrabajosAdminPanel({ admin }) {
  const [trabajos, setTrabajos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [nuevo, setNuevo] = useState({ titulo: '', descripcion: '', estado: 'pendiente', responsable_id: '', notas: '' });
  const [relaciones, setRelaciones] = useState([]);
  const [editando, setEditando] = useState(null);
  const [editData, setEditData] = useState({});
  const [detallesAbiertos, setDetallesAbiertos] = useState({});

  useEffect(() => {
    fetch('http://localhost:5000/trabajos/')
      .then(res => res.json())
      .then(data => setTrabajos(data));
    fetch('http://localhost:5000/usuarios')
      .then(res => res.json())
      .then(data => setUsuarios(data));
  }, []);

  const crearTrabajo = () => {
    if (!nuevo.titulo) return;
    fetch('http://localhost:5000/trabajos/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevo)
    })
      .then(res => res.json())
      .then(data => {
        setTrabajos([...trabajos, data]);
        setNuevo({ titulo: '', descripcion: '', estado: 'pendiente', responsable_id: '', notas: '' });
      });
  };

  const eliminarTrabajo = (id) => {
    fetch(`http://localhost:5000/trabajos/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => {
        if (data.success) setTrabajos(trabajos.filter(t => t.id !== id));
      });
  };

  const actualizarTrabajo = (id, campos) => {
    fetch(`http://localhost:5000/trabajos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(campos)
    })
      .then(res => res.json())
      .then(data => {
        setTrabajos(trabajos.map(t => t.id === id ? data : t));
        setEditando(null);
      });
  };

  const asociarEntidades = (id) => {
    fetch(`http://localhost:5000/trabajos/${id}/asociar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entidades: relaciones })
    })
      .then(res => res.json())
      .then(data => {
        setTrabajos(trabajos.map(t => t.id === id ? data : t));
        setRelaciones([]);
      });
  };

  const toggleDetalles = (id) => {
    setDetallesAbiertos(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const estados = [
    { value: 'pendiente', color: '#fbc02d' },
    { value: 'en proceso', color: '#1976d2' },
    { value: 'finalizado', color: '#43a047' },
    { value: 'en pausa', color: '#e74c3c' }
  ];

  // Agrupar trabajos por estado
  const trabajosPorEstado = estados.reduce((acc, e) => {
    acc[e.value] = trabajos.filter(t => t.estado === e.value);
    return acc;
  }, {});

  // Drag & drop handler
  const onDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId !== destination.droppableId) {
      // Cambiar estado en backend
      const trabajo = trabajos.find(t => t.id.toString() === draggableId);
      if (trabajo) {
        actualizarTrabajo(trabajo.id, { estado: destination.droppableId });
      }
    }
  };

  return (
    <div className="KanbanContainer">
      <h2 style={{ color: '#43a047' }}>Panel de Trabajos {admin ? '(Admin)' : ''} - Kanban</h2>
      {admin && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
          <input
            type="text"
            placeholder="Título"
            value={nuevo.titulo}
            onChange={e => setNuevo({ ...nuevo, titulo: e.target.value })}
            style={{ padding: 8, borderRadius: 6, border: '1px solid #a5d6a7' }}
          />
          <input
            type="text"
            placeholder="Descripción"
            value={nuevo.descripcion}
            onChange={e => setNuevo({ ...nuevo, descripcion: e.target.value })}
            style={{ padding: 8, borderRadius: 6, border: '1px solid #a5d6a7' }}
          />
          <select
            value={nuevo.estado}
            onChange={e => setNuevo({ ...nuevo, estado: e.target.value })}
            style={{ padding: 8, borderRadius: 6, border: '1px solid #a5d6a7' }}
          >
            {estados.map(e => <option key={e.value} value={e.value}>{e.value}</option>)}
          </select>
          <select
            value={nuevo.responsable_id}
            onChange={e => setNuevo({ ...nuevo, responsable_id: e.target.value })}
            style={{ padding: 8, borderRadius: 6, border: '1px solid #a5d6a7' }}
          >
            <option value="">Responsable</option>
            {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
          </select>
          <input
            type="text"
            placeholder="Notas"
            value={nuevo.notas}
            onChange={e => setNuevo({ ...nuevo, notas: e.target.value })}
            style={{ padding: 8, borderRadius: 6, border: '1px solid #a5d6a7' }}
          />
          <button onClick={crearTrabajo} style={{ background: '#43a047', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 'bold', cursor: 'pointer' }}>
            <FaPlus /> Crear
          </button>
        </div>
      )}
      <DragDropContext onDragEnd={admin ? onDragEnd : () => {}}>
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', alignItems: 'flex-start' }}>
          {estados.map(e => (
            <Droppable droppableId={e.value} key={e.value} isDropDisabled={!admin}>
              {(provided, snapshot) => (
                <div
                  className="KanbanPanel"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  <h3 style={{ color: e.color, textAlign: 'center', textTransform: 'capitalize' }}>{e.value}</h3>
                  {trabajosPorEstado[e.value].map((t, idx) => (
                    <Draggable draggableId={t.id.toString()} index={idx} key={t.id} isDragDisabled={!admin}>
                      {(prov, snap) => (
                        <div
                          ref={prov.innerRef}
                          {...prov.draggableProps}
                          {...prov.dragHandleProps}
                          style={{
                            background: '#fff',
                            marginBottom: 12,
                            borderRadius: 8,
                            padding: 14,
                            boxShadow: snap.isDragging ? '0 4px 16px #388e3c88' : '0 2px 8px #a5d6a7',
                            borderLeft: `8px solid ${e.color}`,
                            opacity: snap.isDragging ? 0.85 : 1,
                            ...prov.draggableProps.style
                          }}
                        >
                          <div style={{ fontWeight: 'bold', color: '#1976d2', fontSize: '1.1em' }}>{t.titulo}</div>
                          <div style={{ fontSize: '0.95em', color: '#888', marginBottom: 4 }}>
                            Responsable: {usuarios.find(u => u.id === t.responsable_id)?.nombre || 'Sin asignar'}
                          </div>
                          <button onClick={() => toggleDetalles(t.id)} style={{ background: '#43a047', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', fontWeight: 'bold', cursor: 'pointer', marginBottom: 6 }}>
                            {detallesAbiertos[t.id] ? 'Ocultar detalles' : 'Detalles'}
                          </button>
                          {detallesAbiertos[t.id] && (
                            <div style={{ background: '#f1f8e9', borderRadius: 6, padding: 10, marginTop: 6, fontSize: '0.97em', color: '#333' }}>
                              <div><b>Descripción:</b> {t.descripcion}</div>
                              <div><b>Notas:</b> {t.notas}</div>
                              <div><b>Creado:</b> {t.fecha_creacion}</div>
                              <div><b>Relaciones:</b> {t.relaciones && t.relaciones.length > 0 ? t.relaciones.map(r => (
                                <span key={r.entidad_tipo + r.entidad_codigo} style={{ fontSize: '0.95em', marginRight: 4, color: '#1976d2' }}>
                                  [{r.entidad_tipo}:{r.entidad_codigo.slice(0,8)}]
                                </span>
                              )) : 'Ninguna'}</div>
                              {admin && (
                                <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                                  <button onClick={() => eliminarTrabajo(t.id)} style={{ background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontWeight: 'bold', cursor: 'pointer' }}><FaTrash /></button>
                                  <button onClick={() => { setEditData({ titulo: t.titulo, descripcion: t.descripcion, estado: t.estado, responsable_id: t.responsable_id, notas: t.notas }); }} style={{ background: '#43a047', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontWeight: 'bold', cursor: 'pointer' }}><FaEdit /></button>
                                </div>
                              )}
                            </div>
                          )}
                          {admin && (
                            <div style={{ marginTop: 8 }}>
                              <input type="text" placeholder="tipo (ticket, inventario, etc)" style={{ width: 90, marginRight: 2 }} onChange={e => setRelaciones([{ ...relaciones[0], tipo: e.target.value, codigo: relaciones[0]?.codigo || '' }])} />
                              <input type="text" placeholder="código único" style={{ width: 120, marginRight: 2 }} onChange={e => setRelaciones([{ ...relaciones[0], tipo: relaciones[0]?.tipo || '', codigo: e.target.value }])} />
                              <button onClick={() => asociarEntidades(t.id)} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '2px 8px', fontWeight: 'bold', cursor: 'pointer' }}>Asociar</button>
                            </div>
                          )}
                          {editando === t.id && admin && (
                            <div style={{ marginTop: 10, background: '#f1f8e9', borderRadius: 6, padding: 10 }}>
                              <input value={editData.titulo} onChange={e => setEditData({ ...editData, titulo: e.target.value })} placeholder="Título" style={{ marginBottom: 4 }} />
                              <input value={editData.descripcion} onChange={e => setEditData({ ...editData, descripcion: e.target.value })} placeholder="Descripción" style={{ marginBottom: 4 }} />
                              <select value={editData.estado} onChange={e => setEditData({ ...editData, estado: e.target.value })} style={{ marginBottom: 4 }}>
                                {estados.map(e => <option key={e.value} value={e.value}>{e.value}</option>)}
                              </select>
                              <select value={editData.responsable_id} onChange={e => setEditData({ ...editData, responsable_id: e.target.value })} style={{ marginBottom: 4 }}>
                                <option value="">Responsable</option>
                                {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                              </select>
                              <input value={editData.notas} onChange={e => setEditData({ ...editData, notas: e.target.value })} placeholder="Notas" style={{ marginBottom: 4 }} />
                              <button onClick={() => actualizarTrabajo(t.id, editData)} style={{ background: '#43a047', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontWeight: 'bold', cursor: 'pointer', marginRight: 6 }}>Guardar</button>
                              <button onClick={() => setEditando(null)} style={{ background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontWeight: 'bold', cursor: 'pointer' }}>Cancelar</button>
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}

export function AdminConfigPanel() {
  // Gestión de ubicaciones
  const [ubicaciones, setUbicaciones] = useState([]);
  const [nuevaUbicacion, setNuevaUbicacion] = useState({ nombre: '' });
  const [editUbicacion, setEditUbicacion] = useState(null);
  const [editUbicacionData, setEditUbicacionData] = useState({ nombre: '' });
  // Gestión de categorías
  const [categorias, setCategorias] = useState([]);
  const [nuevaCategoria, setNuevaCategoria] = useState({ nombre: '' });
  const [editCategoria, setEditCategoria] = useState(null);
  const [editCategoriaData, setEditCategoriaData] = useState({ nombre: '' });

  useEffect(() => {
    fetch('http://localhost:5000/ubicaciones/')
      .then(res => res.json())
      .then(data => setUbicaciones(data));
    fetch('http://localhost:5000/categorias/')
      .then(res => res.json())
      .then(data => setCategorias(data));
  }, []);

  // CRUD ubicaciones
  const crearUbicacion = () => {
    if (!nuevaUbicacion.nombre) return;
    fetch('http://localhost:5000/ubicaciones/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevaUbicacion)
    })
      .then(res => res.json())
      .then(data => {
        setUbicaciones([...ubicaciones, data]);
        setNuevaUbicacion({ nombre: '' });
      });
  };
  const actualizarUbicacion = (id) => {
    fetch(`http://localhost:5000/ubicaciones/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editUbicacionData)
    })
      .then(res => res.json())
      .then(data => {
        setUbicaciones(ubicaciones.map(u => u.id === id ? data : u));
        setEditUbicacion(null);
        setEditUbicacionData({ nombre: '' });
      });
  };
  const eliminarUbicacion = (id) => {
    fetch(`http://localhost:5000/ubicaciones/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(() => setUbicaciones(ubicaciones.filter(u => u.id !== id)));
  };

  // CRUD categorías
  const crearCategoria = () => {
    if (!nuevaCategoria.nombre) return;
    fetch('http://localhost:5000/categorias/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevaCategoria)
    })
      .then(res => res.json())
      .then(data => {
        setCategorias([...categorias, data]);
        setNuevaCategoria({ nombre: '' });
      });
  };
  const actualizarCategoria = (id) => {
    fetch(`http://localhost:5000/categorias/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editCategoriaData)
    })
      .then(res => res.json())
      .then(data => {
        setCategorias(categorias.map(c => c.id === id ? data : c));
        setEditCategoria(null);
        setEditCategoriaData({ nombre: '' });
      });
  };
  const eliminarCategoria = (id) => {
    fetch(`http://localhost:5000/categorias/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(() => setCategorias(categorias.filter(c => c.id !== id)));
  };

  return (
    <div>
      <h2>Configuración General</h2>
      <Box sx={{ mb: 4, p: 2, background: '#f8fff8', borderRadius: 2, boxShadow: 1 }}>
        <h3 style={{ color: '#388e3c', marginBottom: 8 }}><FaMapMarkerAlt /> Ubicaciones</h3>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
          <input type="text" placeholder="Nombre de ubicación" value={nuevaUbicacion.nombre} onChange={e => setNuevaUbicacion({ ...nuevaUbicacion, nombre: e.target.value })} style={{ padding: 8, borderRadius: 6, border: '1px solid #a5d6a7', minWidth: 180 }} />
          <Button variant="contained" color="success" onClick={crearUbicacion} sx={{ fontWeight: 'bold' }}><FaPlus /> Crear</Button>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {ubicaciones.map(u => (
            <Box key={u.id} sx={{ background: '#fff', borderRadius: 1, p: 1, boxShadow: 1, display: 'flex', alignItems: 'center', mb: 1, mr: 1 }}>
              {editUbicacion === u.id ? (
                <>
                  <input type="text" value={editUbicacionData.nombre} onChange={e => setEditUbicacionData({ ...editUbicacionData, nombre: e.target.value })} style={{ padding: 6, borderRadius: 6, border: '1px solid #a5d6a7', minWidth: 120 }} />
                  <Button onClick={() => actualizarUbicacion(u.id)} color="success" variant="contained" sx={{ ml: 1, fontWeight: 'bold' }}>Guardar</Button>
                  <Button onClick={() => setEditUbicacion(null)} color="error" variant="contained" sx={{ ml: 1, fontWeight: 'bold' }}>Cancelar</Button>
                </>
              ) : (
                <>
                  <span style={{ fontWeight: 'bold', color: '#388e3c', marginRight: 8 }}>{u.nombre}</span>
                  <Button onClick={() => { setEditUbicacion(u.id); setEditUbicacionData({ nombre: u.nombre }); }} color="primary" variant="contained" sx={{ ml: 1, fontWeight: 'bold' }}><FaEdit /></Button>
                  <Button onClick={() => eliminarUbicacion(u.id)} color="error" variant="contained" sx={{ ml: 1, fontWeight: 'bold' }}><FaTrash /></Button>
                </>
              )}
            </Box>
          ))}
        </Box>
      </Box>
      <Box sx={{ mb: 4, p: 2, background: '#f8fff8', borderRadius: 2, boxShadow: 1 }}>
        <h3 style={{ color: '#388e3c', marginBottom: 8 }}><FaTag /> Categorías</h3>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
          <input type="text" placeholder="Nombre de categoría" value={nuevaCategoria.nombre} onChange={e => setNuevaCategoria({ ...nuevaCategoria, nombre: e.target.value })} style={{ padding: 8, borderRadius: 6, border: '1px solid #a5d6a7', minWidth: 180 }} />
          <Button variant="contained" color="success" onClick={crearCategoria} sx={{ fontWeight: 'bold' }}><FaPlus /> Crear</Button>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {categorias.map(c => (
            <Box key={c.id} sx={{ background: '#fff', borderRadius: 1, p: 1, boxShadow: 1, display: 'flex', alignItems: 'center', mb: 1, mr: 1 }}>
              {editCategoria === c.id ? (
                <>
                  <input type="text" value={editCategoriaData.nombre} onChange={e => setEditCategoriaData({ ...editCategoriaData, nombre: e.target.value })} style={{ padding: 6, borderRadius: 6, border: '1px solid #a5d6a7', minWidth: 120 }} />
                  <Button onClick={() => actualizarCategoria(c.id)} color="success" variant="contained" sx={{ ml: 1, fontWeight: 'bold' }}>Guardar</Button>
                  <Button onClick={() => setEditCategoria(null)} color="error" variant="contained" sx={{ ml: 1, fontWeight: 'bold' }}>Cancelar</Button>
                </>
              ) : (
                <>
                  <span style={{ fontWeight: 'bold', color: '#388e3c', marginRight: 8 }}>{c.nombre}</span>
                  <Button onClick={() => { setEditCategoria(c.id); setEditCategoriaData({ nombre: c.nombre }); }} color="primary" variant="contained" sx={{ ml: 1, fontWeight: 'bold' }}><FaEdit /></Button>
                  <Button onClick={() => eliminarCategoria(c.id)} color="error" variant="contained" sx={{ ml: 1, fontWeight: 'bold' }}><FaTrash /></Button>
                </>
              )}
            </Box>
          ))}
        </Box>
      </Box>
    </div>
  );
}