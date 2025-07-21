import React, { useEffect, useState } from 'react';
import { FaPlus, FaBell, FaTrash, FaEdit } from 'react-icons/fa';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { DataGrid } from '@mui/x-data-grid';
import { Button, Box, Tabs, Tab, Grid, Paper } from '@mui/material';
import { getToken } from '../App';
import { API_URL } from '../config';
import { BarChart, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Bar, ResponsiveContainer, Cell } from 'recharts';
import * as XLSX from 'xlsx';

// Paleta de colores global para gráficas
const colores = ['#43a047', '#1976d2', '#fbc02d', '#e74c3c', '#8e24aa', '#00897b', '#f57c00', '#6d4c41', '#c62828', '#2e7d32'];

// Helper para fetch con token
function fetchWithAuth(url, options = {}) {
  const token = getToken();
  console.log('fetchWithAuth - URL:', url);
  console.log('fetchWithAuth - Options:', options);
  console.log('fetchWithAuth - Token:', token ? 'Presente' : 'No presente');
  
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
  const [nuevoEquipo, setNuevoEquipo] = useState({ nombre: '', tipo: '', estado: 'Disponible', ubicacion_id: '', usuario_id: '' });
  const [filtro, setFiltro] = useState({ tipo: '', estado: '' });
  const [tab, setTab] = useState(0);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [error, setError] = useState('');
  // NUEVO: Estado para gráficos avanzados
  // const [graficoTipo, setGraficoTipo] = useState('barras'); // 'barras' o 'pastel'
  // const [campoAnalizar, setCampoAnalizar] = useState('tipo'); // 'tipo', 'estado', 'sucursal', 'responsable'
  // Estado para múltiples gráficas
  const [numGraficas, setNumGraficas] = useState(1);
  const [graficas, setGraficas] = useState([
    { campo: 'tipo', tipo: 'barras' },
    { campo: 'estado', tipo: 'pastel' },
    { campo: 'sucursal', tipo: 'barras' }
  ]);
  const [campoAnalizar] = useState('tipo');

  useEffect(() => {
    setError('');
    Promise.all([
      fetchWithAuth(`${API_URL}/inventario/`).then(res => res.json()),
      fetchWithAuth(`${API_URL}/ubicaciones/`).then(res => res.json()),
      fetchWithAuth(`${API_URL}/categorias/`).then(res => res.json()),
      fetchWithAuth(`${API_URL}/usuarios`).then(res => res.json())
    ]).then(([inv, ubi, cat, usu]) => {
      if (admin) {
        setInventario(inv);
      } else {
        setInventario(inv.filter(e => e.usuario_nombre === usuario));
      }
      setUbicaciones(ubi);
      setCategorias(cat);
      setUsuarios(usu);
    }).catch(err => {
      setError('Error de red o CORS al cargar datos.');
    });
  }, [admin, usuario]);

    const agregarEquipo = () => {
    console.log('=== DEBUG AGREGAR EQUIPO ===');
    console.log('Estado actual de nuevoEquipo:', nuevoEquipo);
    console.log('API_URL:', API_URL);
    
    if (!nuevoEquipo.nombre || !nuevoEquipo.tipo || !nuevoEquipo.estado) {
      const errorMsg = 'Por favor completa todos los campos requeridos';
      console.log('❌ Validación fallida:', { 
        nombre: nuevoEquipo.nombre, 
        tipo: nuevoEquipo.tipo, 
        estado: nuevoEquipo.estado 
      });
      alert(errorMsg);
      return;
    }
    
    const datosEnviar = {
      equipo: nuevoEquipo.nombre,
      tipo: nuevoEquipo.tipo,
      estado: nuevoEquipo.estado,
      ubicacion_id: nuevoEquipo.ubicacion_id || null,
      usuario_id: nuevoEquipo.usuario_id || null
    };
    
    console.log('✅ Datos a enviar:', datosEnviar);
    console.log('URL de la petición:', `${API_URL}/inventario/`);
    
    fetchWithAuth(`${API_URL}/inventario/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datosEnviar)
    })
      .then(res => {
        console.log('📡 Respuesta del servidor - Status:', res.status);
        console.log('📡 Respuesta del servidor - Headers:', res.headers);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('📦 Datos recibidos:', data);
        if (data.id) {
          console.log('✅ Equipo agregado exitosamente con ID:', data.id);
          setInventario(prevInventario => {
            const nuevoInventario = [...prevInventario, data];
            console.log('📊 Inventario actualizado:', nuevoInventario.length, 'elementos');
            return nuevoInventario;
          });
          setNuevoEquipo({ nombre: '', tipo: '', estado: 'Disponible', ubicacion_id: '', usuario_id: '' });
          alert('Equipo agregado correctamente');
        } else {
          console.log('❌ Error en respuesta:', data);
          alert('Error al agregar equipo: ' + (data.error || 'Error desconocido'));
        }
      })
      .catch(err => {
        console.error('💥 Error en fetch:', err);
        alert('Error al agregar equipo: ' + err.message);
      });
  };

  // Columnas para DataGrid
  const columns = [
    { field: 'equipo', headerName: 'Equipo', flex: 1 },
    { field: 'tipo', headerName: 'Tipo', flex: 1 },
    { field: 'estado', headerName: 'Estado', flex: 1 },
    {
      field: 'usuario_nombre',
      headerName: 'Usuario',
      flex: 1,
      valueGetter: (params) => params.row.usuario_nombre_perfil || params.row.usuario_nombre || '',
      renderCell: (params) => (
        <span style={{ color: params.row.usuario_nombre_perfil ? '#1976d2' : '#333', fontWeight: params.row.usuario_nombre_perfil ? 'bold' : 'normal' }}>
          {params.row.usuario_nombre_perfil || params.row.usuario_nombre || ''}
        </span>
      )
    },
    { field: 'codigo_unico', headerName: 'Código Único', flex: 1 },
    admin && {
      field: 'acciones',
      headerName: 'Acciones',
      flex: 1,
      renderCell: (params) => (
        <>
          <Button size="small" color="primary" onClick={() => handleEditar(params.row)}><FaEdit /></Button>
          <Button size="small" color="error" onClick={() => handleEliminar(params.row.id)}><FaTrash /></Button>
        </>
      )
    }
  ].filter(Boolean);

  // Estado para edición
  const [editando, setEditando] = useState(null);
  const [editData, setEditData] = useState({});
  const [modalAbierto, setModalAbierto] = useState(false);

  const handleEditar = (row) => {
    setEditando(row.id);
    setEditData({
      equipo: row.equipo,
      tipo: row.tipo,
      estado: row.estado,
      ubicacion_id: row.ubicacion_id || '',
      usuario_id: row.usuario_id || ''
    });
    setModalAbierto(true);
  };

  const handleGuardarEdicion = () => {
    fetchWithAuth(`${API_URL}/inventario/${editando}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editData)
    })
      .then(res => res.json())
      .then(data => {
        // Recargar inventario completo para asegurar datos frescos
        fetchWithAuth(`${API_URL}/inventario/`)
          .then(res => res.json())
          .then(inv => setInventario(inv));
        setEditando(null);
        setModalAbierto(false);
      });
  };

  const handleEliminar = (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este equipo?')) return;
    fetchWithAuth(`${API_URL}/inventario/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => {
        if (data.success) setInventario(prev => prev.filter(e => e.id !== id));
      });
  };

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
    const url = `${API_URL}/inventario/exportar${params.length ? '?' + params.join('&') : ''}`;
    window.open(url, '_blank');
  };

  // Helper para obtener sucursal y responsable
  const getSucursal = (inv) => {
    if (!inv.ubicacion_nombre) return 'Sin sucursal';
    return inv.ubicacion_nombre;
  };
  const getResponsable = (inv) => {
    if (!inv.usuario_nombre) return 'Sin responsable';
    return inv.usuario_nombre;
  };

  // Generar datos dinámicos según campo seleccionado
 //asdasd
  // NUEVO: Importar desde Excel con resumen de resultados
  const [importResumen, setImportResumen] = useState([]);
  const [mostrarResumen, setMostrarResumen] = useState(false);
  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      let resultados = [];
      let procesados = 0;
      setMostrarResumen(true);
      json.forEach((row, idx) => {
        const datosEnviar = {
          equipo: row.equipo || row.Equipo || '',
          tipo: row.tipo || row.Tipo || '',
          estado: row.estado || row.Estado || 'Disponible',
          ubicacion_id: row.ubicacion_id || '',
          usuario_id: row.usuario_id || '',
          codigo_unico: row.codigo_unico || row['Código Único'] || undefined
        };
        const url = datosEnviar.codigo_unico
          ? `${API_URL}/inventario/${datosEnviar.codigo_unico}`
          : `${API_URL}/inventario/`;
        const method = datosEnviar.codigo_unico ? 'PUT' : 'POST';
        fetchWithAuth(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datosEnviar)
        })
          .then(res => res.json())
          .then(data => {
            procesados++;
            if (data.error) {
              resultados[idx] = { fila: idx + 2, estado: 'error', mensaje: data.error, datos: datosEnviar };
            } else {
              resultados[idx] = { fila: idx + 2, estado: 'ok', mensaje: 'Importado correctamente', datos: datosEnviar };
            }
            if (procesados === json.length) {
              setImportResumen([...resultados]);
              fetchWithAuth(`${API_URL}/inventario/`)
                .then(res => res.json())
                .then(inv => setInventario(inv));
            }
          })
          .catch(err => {
            procesados++;
            resultados[idx] = { fila: idx + 2, estado: 'error', mensaje: err.message, datos: datosEnviar };
            if (procesados === json.length) {
              setImportResumen([...resultados]);
              fetchWithAuth(`${API_URL}/inventario/`)
                .then(res => res.json())
                .then(inv => setInventario(inv));
            }
          });
      });
    };
    reader.readAsArrayBuffer(file);
  };

  const handleGraficaChange = (idx, key, value) => {
    setGraficas(g => g.map((graf, i) => i === idx ? { ...graf, [key]: value } : graf));
  };

  const getDatosGraficoCustom = (campo) => {
    let data = {};
    inventarioFiltrado.forEach(e => {
      let valor = '';
      if (campo === 'tipo') valor = e.tipo || 'Sin tipo';
      else if (campo === 'estado') valor = e.estado || 'Sin estado';
      else if (campo === 'sucursal') valor = getSucursal(e);
      else if (campo === 'responsable') valor = getResponsable(e);
      else valor = 'Otro';
      data[valor] = (data[valor] || 0) + 1;
    });
    return Object.entries(data).map(([k, v]) => ({ name: k, value: v }));
  };

  return (
    <Box sx={{ width: '100vw', maxWidth: '100vw', bgcolor: 'background.paper', borderRadius: 2, boxShadow: 2, p: 2, minHeight: '80vh', overflowX: 'auto' }}>
      {error && <div style={{ color: 'red', marginBottom: 12, fontWeight: 'bold' }}>{error}</div>}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} centered>
        <Tab label="Inventario" />
        <Tab label="Gráficos" />
      </Tabs>
      {tab === 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2, width: '100vw', maxWidth: '100vw' }}>
          {/* Filtros y formulario a la izquierda */}
          <Box sx={{ flex: '0 0 320px', minWidth: 220, maxWidth: 400 }}>
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
                <select
                  value={nuevoEquipo.tipo}
                  onChange={e => setNuevoEquipo({ ...nuevoEquipo, tipo: e.target.value })}
                  style={{ padding: '10px', borderRadius: '6px', border: '1px solid #a5d6a7', minWidth: 160, marginBottom: 8, width: '100%' }}
                >
                  <option value="">Tipo/Categoría</option>
                  {categorias.map(c => (
                    <option key={c.id} value={c.nombre}>{c.nombre}</option>
                  ))}
                </select>
                <select
                  value={nuevoEquipo.estado}
                  onChange={e => setNuevoEquipo({ ...nuevoEquipo, estado: e.target.value })}
                  style={{ padding: '10px', borderRadius: '6px', border: '1px solid #a5d6a7', minWidth: 140, marginBottom: 8, width: '100%' }}
                >
                  <option value="">Estado</option>
                  <option value="buen estado">Buen estado</option>
                  <option value="marcas de uso">Marcas de uso</option>
                  <option value="rayones">Rayones</option>
                  <option value="daño serio">Daño serio</option>
                  <option value="inservible">Inservible</option>
                </select>
                <select
                  value={nuevoEquipo.ubicacion_id || ''}
                  onChange={e => setNuevoEquipo({ ...nuevoEquipo, ubicacion_id: e.target.value })}
                  style={{ padding: '10px', borderRadius: '6px', border: '1px solid #a5d6a7', minWidth: 140, marginBottom: 8, width: '100%' }}
                >
                  <option value="">Seleccionar Ubicación</option>
                  {ubicaciones.map(u => (
                    <option key={u.id} value={u.id}>{u.nombre}</option>
                  ))}
                </select>
                <select
                  value={nuevoEquipo.usuario_id || ''}
                  onChange={e => setNuevoEquipo({ ...nuevoEquipo, usuario_id: e.target.value })}
                  style={{ padding: '10px', borderRadius: '6px', border: '1px solid #a5d6a7', minWidth: 140, marginBottom: 8, width: '100%' }}
                >
                  <option value="">Seleccionar Usuario</option>
                  {usuarios.map(u => (
                    <option key={u.id} value={u.id}>{u.nombre}</option>
                  ))}
                </select>
                <Button variant="contained" color="success" onClick={agregarEquipo} sx={{ minWidth: 120, fontWeight: 'bold', fontSize: '1em', width: '100%', marginBottom: 1 }}>
                  <FaPlus style={{ marginRight: 6 }} /> Agregar
                </Button>
                <Button variant="outlined" color="info" onClick={() => console.log('Estado actual:', nuevoEquipo)} sx={{ minWidth: 120, fontSize: '0.8em', width: '100%' }}>
                  Debug: Ver Estado
                </Button>
                {/* NUEVO: Botón para importar Excel */}
                <label style={{ display: 'block', marginTop: 12 }}>
                  <span style={{ color: '#1976d2', fontWeight: 'bold', marginRight: 8 }}>Importar desde Excel:</span>
                  <input type="file" accept=".xlsx,.xls" onChange={handleImportExcel} style={{ display: 'inline-block', marginTop: 6 }} />
                </label>
                {/* NUEVO: Botón para descargar plantilla */}
                <a
                  href={require('./PlantillaInventario.xlsx')}
                  download="PlantillaInventario.xlsx"
                  style={{ display: 'inline-block', marginTop: 8, color: '#388e3c', fontWeight: 'bold', textDecoration: 'underline', fontSize: '0.98em' }}
                >
                  Descargar plantilla Excel
                </a>
                {/* NUEVO: Resumen de importación */}
                {mostrarResumen && importResumen.length > 0 && (
                  <Paper sx={{ mt: 2, p: 2, background: '#fffde7', borderRadius: 2, boxShadow: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <b style={{ color: '#388e3c' }}>Resumen de importación</b>
                      <Button size="small" color="error" onClick={() => { setMostrarResumen(false); setImportResumen([]); }}>Cerrar</Button>
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginTop: 8 }}>
                      {importResumen.map((r, i) => (
                        <li key={i} style={{ color: r.estado === 'ok' ? '#388e3c' : '#e74c3c', fontWeight: r.estado === 'ok' ? 'bold' : 'bold', marginBottom: 4 }}>
                          Fila {r.fila}: {r.estado === 'ok' ? '✔' : '✗'} {r.mensaje}
                        </li>
                      ))}
                    </ul>
                  </Paper>
                )}
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
          </Box>
          {/* Tabla a la derecha */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
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
          </Box>
        </Box>
      )}
      {tab === 1 && (
        <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', justifyContent: 'center' }}>
          <Paper sx={{ p: 2, mb: 2, background: '#f8fff8', borderRadius: 2, boxShadow: 1, minWidth: 320, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontWeight: 'bold', color: '#388e3c', marginRight: 8 }}>Cantidad de gráficas:</span>
            <select value={numGraficas} onChange={e => setNumGraficas(Number(e.target.value))} style={{ padding: 8, borderRadius: 6, border: '1px solid #a5d6a7', marginRight: 12 }}>
              {[1,2,3].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </Paper>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center', width: '100%' }}>
            {[...Array(numGraficas)].map((_, idx) => (
              <Paper key={idx} sx={{ p: 2, background: '#fff', borderRadius: 2, boxShadow: 2, minWidth: 340, maxWidth: 520, flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 'bold', color: '#388e3c' }}>Analizar por:</span>
                  <select value={graficas[idx].campo} onChange={e => handleGraficaChange(idx, 'campo', e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #a5d6a7', marginRight: 8 }}>
                    <option value="tipo">Tipo de equipo</option>
                    <option value="estado">Estado</option>
                    <option value="sucursal">Sucursal</option>
                    <option value="responsable">Responsable</option>
                  </select>
                  <span style={{ fontWeight: 'bold', color: '#388e3c' }}>Gráfico:</span>
                  <select value={graficas[idx].tipo} onChange={e => handleGraficaChange(idx, 'tipo', e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #a5d6a7' }}>
                    <option value="barras">Barras</option>
                    <option value="pastel">Pastel</option>
                  </select>
                </div>
                <ResponsiveContainer width={400} height={300}>
                  {graficas[idx].tipo === 'barras' ? (
                    <BarChart data={getDatosGraficoCustom(graficas[idx].campo)} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 14 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#43a047">
                        {getDatosGraficoCustom(graficas[idx].campo).map((entry, i) => (
                          <Cell key={`cell-${i}`} fill={colores[i % colores.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  ) : (
                    <PieChart>
                      <Pie data={getDatosGraficoCustom(graficas[idx].campo)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                        {getDatosGraficoCustom(graficas[idx].campo).map((entry, i) => (
                          <Cell key={`cell-${i}`} fill={colores[i % colores.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  )}
                </ResponsiveContainer>
              </Paper>
            ))}
          </Box>
        </Box>
      )}
      {/* MODAL DE EDICIÓN */}
      {modalAbierto && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 12, minWidth: 320, maxWidth: 500 }}>
            <h3>Editar Mantenimiento</h3>
            <form onSubmit={e => { e.preventDefault(); handleGuardarEdicion(); }}>
              <select value={editData.inventario_id} onChange={e => setEditData({ ...editData, inventario_id: e.target.value })} style={{ width: '100%', marginBottom: 8 }} required>
                <option value="">Seleccionar Equipo</option>
                {inventario.map(eq => <option key={eq.id} value={eq.id}>{getSucursal(eq.id)} - {eq.equipo}</option>)}
              </select>
              <input type="text" value={editData.tipo_mantenimiento} onChange={e => setEditData({ ...editData, tipo_mantenimiento: e.target.value })} placeholder="Tipo de mantenimiento" style={{ width: '100%', marginBottom: 8 }} required />
              <input type="date" value={editData.fecha} onChange={e => setEditData({ ...editData, fecha: e.target.value })} style={{ width: '100%', marginBottom: 8 }} required />
              <select value={editData.usuario_id} onChange={e => setEditData({ ...editData, usuario_id: e.target.value })} style={{ width: '100%', marginBottom: 8 }} required>
                <option value="">Responsable</option>
                {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
              </select>
              <input type="date" value={editData.fecha_termino} onChange={e => setEditData({ ...editData, fecha_termino: e.target.value })} placeholder="Fecha de término" style={{ width: '100%', marginBottom: 8 }} />
              <input type="text" value={editData.firma} onChange={e => setEditData({ ...editData, firma: e.target.value })} placeholder="Firma" style={{ width: '100%', marginBottom: 8 }} />
              <input type="text" value={editData.descripcion} onChange={e => setEditData({ ...editData, descripcion: e.target.value })} placeholder="Descripción (opcional)" style={{ width: '100%', marginBottom: 8 }} />
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <Button variant="contained" color="success" type="submit">Guardar</Button>
                <Button variant="outlined" color="error" onClick={() => setModalAbierto(false)}>Cancelar</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Box>
  );
}

export function TicketsList({ admin, usuario }) {
  const [tickets, setTickets] = useState([]);
  const [descripcion, setDescripcion] = useState('');

  // Cambia todas las URLs absolutas de fetch a rutas relativas para aprovechar el proxy
  useEffect(() => {
    fetchWithAuth(`${API_URL}/tickets/`)
      .then(res => res.json())
      .then(data => setTickets(data));
  }, []);

  const crearTicket = () => {
    if (!descripcion) return;
    fetchWithAuth(`${API_URL}/tickets/`, {
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
    fetchWithAuth(`${API_URL}/tickets/${id}/cerrar`, {
      method: 'POST'
    })
      .then(res => res.json())
      .then(data => {
        setTickets(tickets.map(t => t.id === id ? data : t));
      });
  };

  // Agrega las funciones para pausar y descartar ticket
  const pausarTicket = (id) => {
    fetchWithAuth(`${API_URL}/tickets/${id}/pausar`, {
      method: 'POST'
    })
      .then(res => res.json())
      .then(data => {
        setTickets(tickets.map(t => t.id === id ? data : t));
      });
  };
  const descartarTicket = (id) => {
    fetchWithAuth(`${API_URL}/tickets/${id}/descartar`, {
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

  // Cambia todas las URLs absolutas de fetch a rutas relativas para aprovechar el proxy
  useEffect(() => {
    fetchWithAuth(`${API_URL}/avisos`)
      .then(res => res.json())
      .then(data => setAviso(data.mensaje));
  }, []);

  const fijarAviso = () => {
    if (!nuevoAviso) return;
    fetchWithAuth(`${API_URL}/avisos/`, {
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

export function AdminPanel() {
  // Usuarios
  const [usuarios, setUsuarios] = useState([]);
  const [nuevoUsuario, setNuevoUsuario] = useState({ usuario: '', contrasena: '', rol: 'usuario', nombre_perfil: '' });
  const [editandoUsuario, setEditandoUsuario] = useState(null);
  const [editUsuarioData, setEditUsuarioData] = useState({ usuario: '', contrasena: '', rol: 'usuario', nombre_perfil: '' });
  // Ubicaciones
  const [ubicaciones, setUbicaciones] = useState([]);
  const [nuevaUbicacion, setNuevaUbicacion] = useState({ nombre: '', descripcion: '' });
  // Categorías
  const [categorias, setCategorias] = useState([]);
  const [nuevaCategoria, setNuevaCategoria] = useState({ nombre: '' });

  useEffect(() => {
    fetchWithAuth(`${API_URL}/usuarios`).then(res => res.json()).then(setUsuarios);
    fetchWithAuth(`${API_URL}/ubicaciones/`).then(res => res.json()).then(setUbicaciones);
    fetchWithAuth(`${API_URL}/categorias/`).then(res => res.json()).then(setCategorias);
  }, []);

  // Usuarios
  const crearUsuario = () => {
    if (!nuevoUsuario.usuario || !nuevoUsuario.contrasena) return;
    fetchWithAuth(`${API_URL}/usuarios/crear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevoUsuario)
    })
      .then(res => res.json())
      .then(() => {
        setNuevoUsuario({ usuario: '', contrasena: '', rol: 'usuario', nombre_perfil: '' });
        fetchWithAuth(`${API_URL}/usuarios`).then(res => res.json()).then(setUsuarios);
      });
  };
  const borrarUsuario = (id) => {
    fetchWithAuth(`${API_URL}/usuarios/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(() => fetchWithAuth(`${API_URL}/usuarios`).then(res => res.json()).then(setUsuarios));
  };
  const handleEditarUsuario = (u) => {
    setEditandoUsuario(u.id);
    setEditUsuarioData({ usuario: u.nombre, contrasena: '', rol: u.rol, nombre_perfil: u.nombre_perfil || '' });
  };
  const handleGuardarUsuario = () => {
    fetchWithAuth(`${API_URL}/usuarios/${editandoUsuario}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editUsuarioData)
    })
      .then(res => res.json())
      .then(() => {
        setEditandoUsuario(null);
        setEditUsuarioData({ usuario: '', contrasena: '', rol: 'usuario', nombre_perfil: '' });
        fetchWithAuth(`${API_URL}/usuarios`).then(res => res.json()).then(setUsuarios);
      });
  };

  // Ubicaciones
  const crearUbicacion = () => {
    if (!nuevaUbicacion.nombre) return;
    fetchWithAuth(`${API_URL}/ubicaciones/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevaUbicacion)
    })
      .then(res => res.json())
      .then(data => {
        setUbicaciones([...ubicaciones, data]);
        setNuevaUbicacion({ nombre: '', descripcion: '' });
      });
  };
  const eliminarUbicacion = (id) => {
    fetchWithAuth(`${API_URL}/ubicaciones/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(() => setUbicaciones(ubicaciones.filter(u => u.id !== id)));
  };

  // Categorías
  const crearCategoria = () => {
    if (!nuevaCategoria.nombre) return;
    fetchWithAuth(`${API_URL}/categorias/`, {
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
  const eliminarCategoria = (id) => {
    fetchWithAuth(`${API_URL}/categorias/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(() => setCategorias(categorias.filter(c => c.id !== id)));
  };

  return (
    <Box sx={{ width: '100vw', maxWidth: '100vw', bgcolor: 'background.paper', borderRadius: 2, boxShadow: 2, p: 2, minHeight: '80vh', overflowX: 'auto' }}>
      <h2 style={{ color: '#388e3c', marginBottom: 16 }}>Panel de Administración</h2>
      <Grid container spacing={3}>
        {/* Usuarios */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, mb: 2, background: '#f8fff8', borderRadius: 2, boxShadow: 1 }}>
            <h3 style={{ color: '#388e3c', marginBottom: 8 }}>Usuarios</h3>
            <input type="text" placeholder="Usuario" value={nuevoUsuario.usuario} onChange={e => setNuevoUsuario({ ...nuevoUsuario, usuario: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #a5d6a7', width: '100%', marginBottom: 8 }} />
            <input type="password" placeholder="Contraseña" value={nuevoUsuario.contrasena} onChange={e => setNuevoUsuario({ ...nuevoUsuario, contrasena: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #a5d6a7', width: '100%', marginBottom: 8 }} />
            <input type="text" placeholder="Nombre de perfil" value={nuevoUsuario.nombre_perfil} onChange={e => setNuevoUsuario({ ...nuevoUsuario, nombre_perfil: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #a5d6a7', width: '100%', marginBottom: 8 }} />
            <select value={nuevoUsuario.rol} onChange={e => setNuevoUsuario({ ...nuevoUsuario, rol: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #a5d6a7', width: '100%', marginBottom: 8 }}>
              <option value="usuario">Usuario</option>
              <option value="admin">Admin</option>
            </select>
            <Button variant="contained" color="success" onClick={crearUsuario} sx={{ minWidth: 120, fontWeight: 'bold', fontSize: '1em', width: '100%' }}>Crear</Button>
            <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0 0' }}>
              {usuarios.map(u => (
                <li key={u.id} style={{ padding: '8px 0', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {editandoUsuario === u.id ? (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <input type="text" placeholder="Usuario" value={editUsuarioData.usuario} onChange={e => setEditUsuarioData({ ...editUsuarioData, usuario: e.target.value })} style={{ padding: '8px', borderRadius: 6, border: '1px solid #a5d6a7', marginBottom: 4 }} />
                      <input type="password" placeholder="Contraseña (dejar vacío para no cambiar)" value={editUsuarioData.contrasena} onChange={e => setEditUsuarioData({ ...editUsuarioData, contrasena: e.target.value })} style={{ padding: '8px', borderRadius: 6, border: '1px solid #a5d6a7', marginBottom: 4 }} />
                      <input type="text" placeholder="Nombre de perfil" value={editUsuarioData.nombre_perfil} onChange={e => setEditUsuarioData({ ...editUsuarioData, nombre_perfil: e.target.value })} style={{ padding: '8px', borderRadius: 6, border: '1px solid #a5d6a7', marginBottom: 4 }} />
                      <select value={editUsuarioData.rol} onChange={e => setEditUsuarioData({ ...editUsuarioData, rol: e.target.value })} style={{ padding: '8px', borderRadius: 6, border: '1px solid #a5d6a7', marginBottom: 4 }}>
                        <option value="usuario">Usuario</option>
                        <option value="admin">Admin</option>
                      </select>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button size="small" color="success" onClick={handleGuardarUsuario}>Guardar</Button>
                        <Button size="small" color="error" onClick={() => setEditandoUsuario(null)}>Cancelar</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span><b>{u.nombre}</b> <span style={{ color: '#888', fontSize: '0.9em' }}>({u.rol})</span> <span style={{ color: '#1976d2', fontSize: '0.95em', marginLeft: 8 }}>{u.nombre_perfil ? `[${u.nombre_perfil}]` : ''}</span></span>
                      <div>
                        <Button variant="contained" color="info" size="small" onClick={() => handleEditarUsuario(u)} sx={{ minWidth: 60, fontWeight: 'bold', fontSize: '0.9em', ml: 1 }}>Editar</Button>
                        <Button variant="contained" color="error" size="small" onClick={() => borrarUsuario(u.id)} sx={{ minWidth: 60, fontWeight: 'bold', fontSize: '0.9em', ml: 1 }}>Borrar</Button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </Paper>
        </Grid>
        {/* Ubicaciones */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, mb: 2, background: '#f8fff8', borderRadius: 2, boxShadow: 1 }}>
            <h3 style={{ color: '#388e3c', marginBottom: 8 }}>Ubicaciones</h3>
            <input type="text" placeholder="Nombre de ubicación" value={nuevaUbicacion.nombre} onChange={e => setNuevaUbicacion({ ...nuevaUbicacion, nombre: e.target.value })} style={{ padding: 8, borderRadius: 6, border: '1px solid #a5d6a7', minWidth: 180, width: '100%', marginBottom: 8 }} />
            <input type="text" placeholder="Descripción (opcional)" value={nuevaUbicacion.descripcion} onChange={e => setNuevaUbicacion({ ...nuevaUbicacion, descripcion: e.target.value })} style={{ padding: 8, borderRadius: 6, border: '1px solid #a5d6a7', minWidth: 180, width: '100%', marginBottom: 8 }} />
            <Button variant="contained" color="success" onClick={crearUbicacion} sx={{ fontWeight: 'bold', width: '100%' }}>Crear</Button>
            <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0 0' }}>
              {ubicaciones.map(u => (
                <li key={u.id} style={{ padding: '8px 0', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{u.nombre}{u.descripcion ? ` - ${u.descripcion}` : ''}</span>
                  <Button variant="contained" color="error" size="small" onClick={() => eliminarUbicacion(u.id)} sx={{ minWidth: 60, fontWeight: 'bold', fontSize: '0.9em', ml: 1 }}>Borrar</Button>
                </li>
              ))}
            </ul>
          </Paper>
        </Grid>
        {/* Categorías */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, mb: 2, background: '#f8fff8', borderRadius: 2, boxShadow: 1 }}>
            <h3 style={{ color: '#388e3c', marginBottom: 8 }}>Categorías</h3>
            <input type="text" placeholder="Nombre de categoría" value={nuevaCategoria.nombre} onChange={e => setNuevaCategoria({ ...nuevaCategoria, nombre: e.target.value })} style={{ padding: 8, borderRadius: 6, border: '1px solid #a5d6a7', minWidth: 180, width: '100%', marginBottom: 8 }} />
            <Button variant="contained" color="success" onClick={crearCategoria} sx={{ fontWeight: 'bold', width: '100%' }}>Crear</Button>
            <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0 0' }}>
              {categorias.map(c => (
                <li key={c.id} style={{ padding: '8px 0', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{c.nombre}</span>
                  <Button variant="contained" color="error" size="small" onClick={() => eliminarCategoria(c.id)} sx={{ minWidth: 60, fontWeight: 'bold', fontSize: '0.9em', ml: 1 }}>Borrar</Button>
                </li>
              ))}
            </ul>
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
  // NUEVO: Estado para vista previa PDF
  const [pdfPreview, setPdfPreview] = useState(null);

  // Cambia todas las URLs absolutas de fetch a rutas relativas para aprovechar el proxy
  useEffect(() => {
    fetchWithAuth(`${API_URL}/documentos/`)
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
    fetchWithAuth(`${API_URL}/documentos/subir`, {
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
    fetchWithAuth(`${API_URL}/documentos/${id}`, { method: 'DELETE' })
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
                        {doc.nombre_archivo.toLowerCase().endsWith('.pdf') && (
                          <Button
                            variant="outlined"
                            color="info"
                            size="small"
                            onClick={() => setPdfPreview(`${API_URL}/documentos/${doc.id}/descargar`)}
                            sx={{ minWidth: 80, fontWeight: 'bold', fontSize: '0.9em', ml: 1 }}
                          >
                            Vista previa
                          </Button>
                        )}
                        <a href={`${API_URL}/documentos/${doc.id}/descargar`} style={{ marginLeft: 16, color: '#43a047', fontWeight: 'bold' }} target="_blank" rel="noopener noreferrer">
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
      {/* MODAL VISTA PREVIA PDF */}
      {pdfPreview && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: 16, borderRadius: 12, minWidth: 320, maxWidth: 900, maxHeight: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ color: '#388e3c', marginBottom: 8 }}>Vista previa PDF</h3>
            <iframe src={pdfPreview} style={{ width: 700, height: 500, border: '1px solid #a5d6a7', borderRadius: 8 }} title="Vista previa PDF" />
            <Button variant="contained" color="error" onClick={() => setPdfPreview(null)} sx={{ mt: 2 }}>Cerrar</Button>
          </div>
        </div>
      )}
    </Box>
  );
}

export function BitacorasPanel() {
  const [bitacoras, setBitacoras] = useState([]);
  const [descripcion, setDescripcion] = useState('');
  const [usuarioId, setUsuarioId] = useState('');
  const [tickets, setTickets] = useState([]);
  const [ticketsSeleccionados, setTicketsSeleccionados] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [usuarios, setUsuarios] = useState([]);

  // Cargar datos necesarios
  useEffect(() => {
    fetchWithAuth(`${API_URL}/bitacoras/`)
      .then(res => res.json())
      .then(data => setBitacoras(data));
    fetchWithAuth(`${API_URL}/usuarios`)
      .then(res => res.json())
      .then(data => setUsuarios(data));
    fetchWithAuth(`${API_URL}/tickets/`)
      .then(res => res.json())
      .then(data => setTickets(data));
  }, []);

  const crearBitacora = (e) => {
    e.preventDefault();
    if (!descripcion || ticketsSeleccionados.length === 0) {
      setMensaje('Completa la descripción y selecciona al menos un ticket');
      return;
    }
    fetchWithAuth(`${API_URL}/bitacoras/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        descripcion,
        usuario_id: usuarioId || null,
        tickets_codigos: ticketsSeleccionados
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.id) {
          setBitacoras([...bitacoras, data]);
          setDescripcion('');
          setUsuarioId('');
          setTicketsSeleccionados([]);
          setMensaje('Bitácora registrada');
        } else {
          setMensaje(data.error || 'Error al registrar');
        }
      });
  };

  const eliminarBitacora = (id) => {
    fetchWithAuth(`${API_URL}/bitacoras/${id}`, { method: 'DELETE' })
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
                <b>Seleccionar tickets (requerido):</b>
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
          <Paper sx={{ p: 2, background: '#fff', borderRadius: 2, boxShadow: 2, width: '100%', minWidth: 0, minHeight: 300 }}>
            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {bitacoras.map(b => (
                  <li key={b.id} style={{ padding: '10px 0', borderBottom: '1px solid #e0e0e0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ color: '#388e3c' }}>{b.descripcion}</strong><br />
                        <span style={{ fontSize: '0.9em', color: '#888' }}>Tickets: {b.tickets_codigos?.length || 0} | Fecha: {b.fecha}</span>
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
                          onClick={() => window.open(`${API_URL}/bitacoras/${b.id}/pdf`, '_blank')}
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

  // Cambia todas las URLs absolutas de fetch a rutas relativas para aprovechar el proxy
  useEffect(() => {
    fetchWithAuth(`${API_URL}/avisos`)
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

  // Cambia todas las URLs absolutas de fetch a rutas relativas para aprovechar el proxy
  useEffect(() => {
    fetchWithAuth(`${API_URL}/tickets`)
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

  // Cambia todas las URLs absolutas de fetch a rutas relativas para aprovechar el proxy
  useEffect(() => {
    fetchWithAuth(`${API_URL}/trabajos/`)
      .then(res => res.json())
      .then(data => setTrabajos(data));
    fetchWithAuth(`${API_URL}/usuarios`)
      .then(res => res.json())
      .then(data => setUsuarios(data));
  }, []);

  const crearTrabajo = () => {
    if (!nuevo.titulo) return;
    fetchWithAuth(`${API_URL}/trabajos/`, {
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
    fetchWithAuth(`${API_URL}/trabajos/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => {
        if (data.success) setTrabajos(trabajos.filter(t => t.id !== id));
      });
  };

  const actualizarTrabajo = (id, campos) => {
    fetchWithAuth(`${API_URL}/trabajos/${id}`, {
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
    fetchWithAuth(`${API_URL}/trabajos/${id}/asociar`, {
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

export function MantenimientosPanel({ admin }) {
  const [mantenimientos, setMantenimientos] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nuevo, setNuevo] = useState({
    inventario_id: '',
    tipo_mantenimiento: '',
    fecha: '',
    usuario_id: '',
    fecha_termino: '',
    firma: '',
    descripcion: ''
  });
  const [mensaje, setMensaje] = useState('');
  // NUEVO: Estado para gráficos avanzados
  const [graficoTipo, setGraficoTipo] = useState('barras'); // Solo si el render lo usa
  const [campoAnalizar, setCampoAnalizar] = useState('tipo_mantenimiento'); // 'tipo_mantenimiento', 'sucursal', 'responsable', 'mes'
  // NUEVO: Estado para múltiples gráficas
  // const [numGraficas, setNumGraficas] = useState(1);
  // const [graficas, setGraficas] = useState([
  //   { campo: 'tipo', tipo: 'barras' },
  //   { campo: 'estado', tipo: 'pastel' },
  //   { campo: 'sucursal', tipo: 'barras' }
  // ]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchWithAuth(`${API_URL}/bitacoras/`).then(res => res.json()),
      fetchWithAuth(`${API_URL}/inventario/`).then(res => res.json()),
      fetchWithAuth(`${API_URL}/usuarios`).then(res => res.json()),
      fetchWithAuth(`${API_URL}/ubicaciones/`).then(res => res.json())
    ]).then(([bitacoras, inv, usu, ubi]) => {
      setMantenimientos(bitacoras);
      setInventario(inv);
      setUsuarios(usu);
      setUbicaciones(ubi);
      setLoading(false);
    });
  }, []);

  const getEquipo = (id) => {
    const eq = inventario.find(e => e.id === id);
    return eq ? eq.equipo : '';
  };
  const getSucursal = (id) => {
    const eq = inventario.find(e => e.id === id);
    if (!eq) return '';
    const ubi = ubicaciones.find(u => u.id === eq.ubicacion_id);
    return ubi ? ubi.nombre : '';
  };
  const getAsignadoA = (id) => {
    const eq = inventario.find(e => e.id === id);
    if (!eq) return '';
    const usu = usuarios.find(u => u.id === eq.usuario_id);
    return usu ? usu.nombre : '';
  };
  const getResponsable = (id) => {
    const usu = usuarios.find(u => u.id === id);
    return usu ? usu.nombre : '';
  };
  const getMes = (m) => {
    if (!m.fecha) return 'Sin fecha';
    const d = new Date(m.fecha);
    return d.toLocaleString('es-MX', { month: 'short', year: 'numeric' });
  };

  const handleCrear = (e) => {
    e.preventDefault();
    setMensaje('');
    if (!nuevo.inventario_id || !nuevo.tipo_mantenimiento || !nuevo.fecha || !nuevo.usuario_id) {
      setMensaje('Completa todos los campos obligatorios');
      return;
    }
    fetchWithAuth(`${API_URL}/bitacoras/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inventario_id: nuevo.inventario_id,
        tipo_mantenimiento: nuevo.tipo_mantenimiento,
        fecha: nuevo.fecha,
        usuario_id: nuevo.usuario_id,
        fecha_termino: nuevo.fecha_termino,
        firma: nuevo.firma,
        descripcion: nuevo.descripcion
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.id) {
          setMantenimientos(prev => [...prev, data]);
          setNuevo({ inventario_id: '', tipo_mantenimiento: '', fecha: '', usuario_id: '', fecha_termino: '', firma: '', descripcion: '' });
          setMensaje('Mantenimiento registrado correctamente');
        } else {
          setMensaje(data.error || 'Error al registrar');
        }
      });
  };

  const [editando, setEditando] = useState(null);
  const [editData, setEditData] = useState({});
  const [modalAbierto, setModalAbierto] = useState(false);

  const handleEditar = (m) => {
    setEditando(m.id);
    setEditData({
      inventario_id: m.inventario_id,
      tipo_mantenimiento: m.tipo_mantenimiento || '',
      fecha: m.fecha ? m.fecha.slice(0, 10) : '',
      usuario_id: m.usuario_id || '',
      fecha_termino: m.fecha_termino ? m.fecha_termino.slice(0, 10) : '',
      firma: m.firma || '',
      descripcion: m.descripcion || ''
    });
    setModalAbierto(true);
  };

  const handleGuardarEdicion = () => {
    fetchWithAuth(`${API_URL}/bitacoras/${editando}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editData)
    })
      .then(res => res.json())
      .then(data => {
        // Recargar inventario completo para asegurar datos frescos
        fetchWithAuth(`${API_URL}/inventario/`)
          .then(res => res.json())
          .then(inv => setInventario(inv));
        setEditando(null);
        setModalAbierto(false);
      });
  };

  // Generar datos dinámicos según campo seleccionado
  const getDatosGrafico = () => {
    let key = campoAnalizar;
    let data = {};
    mantenimientos.forEach(m => {
      let valor = '';
      if (key === 'tipo_mantenimiento') valor = m.tipo_mantenimiento || 'Sin tipo';
      else if (key === 'sucursal') valor = getSucursal(m.inventario_id);
      else if (key === 'responsable') valor = getResponsable(m.usuario_id);
      else if (key === 'mes') valor = getMes(m);
      else valor = 'Otro';
      data[valor] = (data[valor] || 0) + 1;
    });
    return Object.entries(data).map(([k, v]) => ({ name: k, value: v }));
  };
  // const datosGrafico = getDatosGrafico();

  return (
    <Box sx={{ width: '100vw', maxWidth: '100vw', bgcolor: 'background.paper', borderRadius: 2, boxShadow: 2, p: 2, minHeight: '80vh', overflowX: 'auto' }}>
      <h2 style={{ color: '#388e3c', marginBottom: 16 }}>Mantenimientos Programados</h2>
      {admin && (
        <Paper sx={{ mb: 3, p: 2, background: '#f8fff8', borderRadius: 2, boxShadow: 1, maxWidth: 700, margin: '0 auto' }}>
          <h3 style={{ color: '#388e3c', marginBottom: 8 }}>Registrar Mantenimiento</h3>
          <form onSubmit={handleCrear} style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <select value={nuevo.inventario_id} onChange={e => setNuevo({ ...nuevo, inventario_id: e.target.value })} style={{ flex: '1 1 180px', padding: 8, borderRadius: 6, border: '1px solid #a5d6a7' }} required>
              <option value="">Seleccionar Equipo</option>
              {inventario.map(eq => <option key={eq.id} value={eq.id}>{getSucursal(eq.id)} - {eq.equipo}</option>)}
            </select>
            <input type="text" value={nuevo.tipo_mantenimiento} onChange={e => setNuevo({ ...nuevo, tipo_mantenimiento: e.target.value })} placeholder="Tipo de mantenimiento" style={{ flex: '1 1 180px', padding: 8, borderRadius: 6, border: '1px solid #a5d6a7' }} required />
            <input type="date" value={nuevo.fecha} onChange={e => setNuevo({ ...nuevo, fecha: e.target.value })} style={{ flex: '1 1 140px', padding: 8, borderRadius: 6, border: '1px solid #a5d6a7' }} required />
            <select value={nuevo.usuario_id} onChange={e => setNuevo({ ...nuevo, usuario_id: e.target.value })} style={{ flex: '1 1 180px', padding: 8, borderRadius: 6, border: '1px solid #a5d6a7' }} required>
              <option value="">Responsable</option>
              {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
            </select>
            <input type="date" value={nuevo.fecha_termino} onChange={e => setNuevo({ ...nuevo, fecha_termino: e.target.value })} placeholder="Fecha de término" style={{ flex: '1 1 140px', padding: 8, borderRadius: 6, border: '1px solid #a5d6a7' }} />
            <input type="text" value={nuevo.firma} onChange={e => setNuevo({ ...nuevo, firma: e.target.value })} placeholder="Firma" style={{ flex: '1 1 140px', padding: 8, borderRadius: 6, border: '1px solid #a5d6a7' }} />
            <input type="text" value={nuevo.descripcion} onChange={e => setNuevo({ ...nuevo, descripcion: e.target.value })} placeholder="Descripción (opcional)" style={{ flex: '2 1 300px', padding: 8, borderRadius: 6, border: '1px solid #a5d6a7' }} />
            <Button type="submit" variant="contained" color="success" sx={{ minWidth: 120, fontWeight: 'bold', fontSize: '1em' }}>Registrar</Button>
          </form>
          {mensaje && <div style={{ color: '#388e3c', marginTop: 10 }}>{mensaje}</div>}
        </Paper>
      )}
      {loading ? <div>Cargando...</div> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #c8e6c9' }}>
            <thead>
              <tr style={{ background: '#e8f5e9', color: '#388e3c' }}>
                <th style={{ padding: 10, border: '1px solid #a5d6a7' }}>SUCURSAL</th>
                <th style={{ padding: 10, border: '1px solid #a5d6a7' }}>EQUIPO</th>
                <th style={{ padding: 10, border: '1px solid #a5d6a7' }}>ASIGNADO A</th>
                <th style={{ padding: 10, border: '1px solid #a5d6a7' }}>TIPO DE MANTENIMIENTO</th>
                <th style={{ padding: 10, border: '1px solid #a5d6a7' }}>FECHA</th>
                <th style={{ padding: 10, border: '1px solid #a5d6a7' }}>RESPONSABLE</th>
                <th style={{ padding: 10, border: '1px solid #a5d6a7' }}>FECHA DE TERMINO</th>
                <th style={{ padding: 10, border: '1px solid #a5d6a7' }}>FIRMA</th>
                {admin && <th style={{ padding: 10, border: '1px solid #a5d6a7' }}>ACCIONES</th>}
              </tr>
            </thead>
            <tbody>
              {mantenimientos.map(m => (
                <tr key={m.id}>
                  <td style={{ padding: 8, border: '1px solid #a5d6a7' }}>{getSucursal(m.inventario_id) || '—'}</td>
                  <td style={{ padding: 8, border: '1px solid #a5d6a7' }}>{getEquipo(m.inventario_id) || '—'}</td>
                  <td style={{ padding: 8, border: '1px solid #a5d6a7' }}>{getAsignadoA(m.inventario_id) || '—'}</td>
                  <td style={{ padding: 8, border: '1px solid #a5d6a7' }}>{m.tipo_mantenimiento || '—'}</td>
                  <td style={{ padding: 8, border: '1px solid #a5d6a7' }}>{m.fecha || '—'}</td>
                  <td style={{ padding: 8, border: '1px solid #a5d6a7' }}>{getResponsable(m.usuario_id) || '—'}</td>
                  <td style={{ padding: 8, border: '1px solid #a5d6a7' }}>{m.fecha_termino || '—'}</td>
                  <td style={{ padding: 8, border: '1px solid #a5d6a7' }}>{m.firma || '—'}</td>
                  {admin && (
                    <td style={{ padding: 8, border: '1px solid #a5d6a7' }}>
                      <Button size="small" color="primary" onClick={() => handleEditar(m)}>Editar</Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {mantenimientos.length === 0 && <div style={{ marginTop: 24, color: '#888' }}>No hay mantenimientos programados.</div>}
        </div>
      )}
      {/* MODAL DE EDICIÓN */}
      {modalAbierto && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 12, minWidth: 320, maxWidth: 500 }}>
            <h3>Editar Mantenimiento</h3>
            <form onSubmit={e => { e.preventDefault(); handleGuardarEdicion(); }}>
              <select value={editData.inventario_id} onChange={e => setEditData({ ...editData, inventario_id: e.target.value })} style={{ width: '100%', marginBottom: 8 }} required>
                <option value="">Seleccionar Equipo</option>
                {inventario.map(eq => <option key={eq.id} value={eq.id}>{getSucursal(eq.id)} - {eq.equipo}</option>)}
              </select>
              <input type="text" value={editData.tipo_mantenimiento} onChange={e => setEditData({ ...editData, tipo_mantenimiento: e.target.value })} placeholder="Tipo de mantenimiento" style={{ width: '100%', marginBottom: 8 }} required />
              <input type="date" value={editData.fecha} onChange={e => setEditData({ ...editData, fecha: e.target.value })} style={{ width: '100%', marginBottom: 8 }} required />
              <select value={editData.usuario_id} onChange={e => setEditData({ ...editData, usuario_id: e.target.value })} style={{ width: '100%', marginBottom: 8 }} required>
                <option value="">Responsable</option>
                {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
              </select>
              <input type="date" value={editData.fecha_termino} onChange={e => setEditData({ ...editData, fecha_termino: e.target.value })} placeholder="Fecha de término" style={{ width: '100%', marginBottom: 8 }} />
              <input type="text" value={editData.firma} onChange={e => setEditData({ ...editData, firma: e.target.value })} placeholder="Firma" style={{ width: '100%', marginBottom: 8 }} />
              <input type="text" value={editData.descripcion} onChange={e => setEditData({ ...editData, descripcion: e.target.value })} placeholder="Descripción (opcional)" style={{ width: '100%', marginBottom: 8 }} />
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <Button variant="contained" color="success" type="submit">Guardar</Button>
                <Button variant="outlined" color="error" onClick={() => setModalAbierto(false)}>Cancelar</Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Panel de control de gráficos */}
      <Paper sx={{ p: 2, mb: 2, background: '#f8fff8', borderRadius: 2, boxShadow: 1, minWidth: 320, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontWeight: 'bold', color: '#388e3c', marginRight: 8 }}>Analizar por:</span>
        <select value={campoAnalizar} onChange={e => setCampoAnalizar(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #a5d6a7', marginRight: 12 }}>
          <option value="tipo_mantenimiento">Tipo de mantenimiento</option>
          <option value="sucursal">Sucursal</option>
          <option value="responsable">Responsable</option>
          <option value="mes">Mes</option>
        </select>
        <span style={{ fontWeight: 'bold', color: '#388e3c', marginRight: 8 }}>Gráfico:</span>
        <select value={graficoTipo} onChange={e => setGraficoTipo(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #a5d6a7' }}>
          <option value="barras">Barras</option>
          <option value="pastel">Pastel</option>
        </select>
      </Paper>
      {/* Renderizado dinámico del gráfico */}
      <ResponsiveContainer width={500} height={350}>
        {graficoTipo === 'barras' ? (
          <BarChart data={getDatosGrafico()} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
            <XAxis dataKey="name" tick={{ fontSize: 14 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#43a047">
              {getDatosGrafico().map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colores[index % colores.length]} />
              ))}
            </Bar>
          </BarChart>
        ) : (
          <PieChart>
            <Pie data={getDatosGrafico()} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>
              {getDatosGrafico().map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colores[index % colores.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        )}
      </ResponsiveContainer>
    </Box>
  );
}