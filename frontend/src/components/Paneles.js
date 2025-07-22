import React, { useEffect, useState } from 'react';
import { Box, Button, Paper, Grid, IconButton, Tooltip, Tabs, Tab } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { FaTrash, FaEdit, FaPlus, FaDownload, FaEye, FaWrench, FaCheck, FaTimes, FaPause, FaSearch, FaBook, FaTools } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { getToken } from '../App';
import { API_URL } from '../config';

// Función helper para obtener el nombre de visualización de un usuario
const getDisplayName = (usuario) => {
  if (!usuario) return '';
  return usuario.nombre_perfil || usuario.nombre || usuario;
};

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
        // Filtrar por nombre de usuario (para login) o nombre de perfil
        setInventario(inv.filter(e => e.usuario_nombre === usuario || e.usuario_nombre_perfil === usuario));
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
  // Estado para modal de mantenimiento
  const [modalMantenimiento, setModalMantenimiento] = useState(false);
  const [mantenimientoData, setMantenimientoData] = useState({
    inventario_id: '',
    tipo_mantenimiento: '',
    fecha: '',
    usuario_id: '',
    fecha_termino: '',
    firma: '',
    descripcion: ''
  });

  const handleAbrirMantenimiento = (row) => {
    setMantenimientoData({
      inventario_id: row.id,
      tipo_mantenimiento: '',
      fecha: '',
      usuario_id: '',
      fecha_termino: '',
      firma: '',
      descripcion: ''
    });
    setModalMantenimiento(true);
  };

  const handleGuardarMantenimiento = (e) => {
    e.preventDefault();
    fetchWithAuth(`${API_URL}/bitacoras/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mantenimientoData)
    })
      .then(res => res.json())
      .then(() => {
        setModalMantenimiento(false);
      });
  };

  const columns = [
    { field: 'equipo', headerName: 'Equipo', flex: 1 },
    { field: 'tipo', headerName: 'Tipo', flex: 1 },
    { field: 'estado', headerName: 'Estado', flex: 1 },
    {
      field: 'ubicacion_nombre',
      headerName: 'Ubicación',
      flex: 1,
      valueGetter: (params) => {
        if (!params || !params.row) return '';
        const ubicacion = ubicaciones.find(u => u.id === params.row.ubicacion_id);
        return ubicacion ? ubicacion.nombre : '';
      }
    },
    {
      field: 'usuario_nombre',
      headerName: 'Usuario',
      flex: 1,
      valueGetter: (params) => (!params || !params.row ? '' : (params.row.usuario_nombre_perfil || params.row.usuario_nombre || '')),
      renderCell: (params) => (
        <span style={{ color: params && params.row && params.row.usuario_nombre_perfil ? '#1976d2' : '#333', fontWeight: params && params.row && params.row.usuario_nombre_perfil ? 'bold' : 'normal' }}>
          {params && params.row ? (params.row.usuario_nombre_perfil || params.row.usuario_nombre || '') : ''}
        </span>
      )
    },
    { field: 'codigo_unico', headerName: 'Código Único', flex: 1 },
    admin && {
      field: 'acciones',
      headerName: 'Acciones',
      flex: 1,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Editar equipo">
            <IconButton 
              size="small" 
              color="primary" 
              onClick={() => handleEditar(params.row)}
              sx={{ 
                backgroundColor: '#e3f2fd', 
                '&:hover': { backgroundColor: '#bbdefb' },
                border: '1px solid #2196f3'
              }}
            >
              <FaEdit />
            </IconButton>
          </Tooltip>
          <Tooltip title="Registrar mantenimiento">
            <IconButton 
              size="small" 
              color="warning" 
              onClick={() => handleAbrirMantenimiento(params.row)}
              sx={{ 
                backgroundColor: '#fff3e0', 
                '&:hover': { backgroundColor: '#ffe0b2' },
                border: '1px solid #ff9800'
              }}
            >
              <FaWrench />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar equipo">
            <IconButton 
              size="small" 
              color="error" 
              onClick={() => handleEliminar(params.row.id)}
              sx={{ 
                backgroundColor: '#ffebee', 
                '&:hover': { backgroundColor: '#ffcdd2' },
                border: '1px solid #f44336'
              }}
            >
              <FaTrash />
            </IconButton>
          </Tooltip>
        </Box>
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
    // Buscar el usuario en la lista de usuarios para obtener el nombre de perfil
    const usuario = usuarios.find(u => u.nombre === inv.usuario_nombre);
    return getDisplayName(usuario) || inv.usuario_nombre;
  };

  // Generar datos dinámicos según campo seleccionado
  //asdasd
  // NUEVO: Importar desde Excel con resumen de resultados

  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      let procesados = 0;
      json.forEach((row, idx) => {
        // Validación de campos mínimos requeridos
        if (!row.equipo && !row.Equipo) {
          procesados++;
          if (procesados === json.length) {
            fetchWithAuth(`${API_URL}/inventario/`)
              .then(res => res.json())
              .then(inv => setInventario(inv));
          }
          return;
        }
        if (!row.tipo && !row.Tipo) {
          procesados++;
          if (procesados === json.length) {
            fetchWithAuth(`${API_URL}/inventario/`)
              .then(res => res.json())
              .then(inv => setInventario(inv));
          }
          return;
        }
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
            if (procesados === json.length) {
              fetchWithAuth(`${API_URL}/inventario/`)
                .then(res => res.json())
                .then(inv => setInventario(inv));
            }
          })
          .catch(err => {
            procesados++;
            if (procesados === json.length) {
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
    <Box sx={{ 
      width: '100%', 
      maxWidth: '100%', 
      bgcolor: 'background.paper', 
      borderRadius: 3, 
      boxShadow: 3, 
      p: 3, 
      minHeight: '85vh', 
      overflowX: 'auto',
      background: 'linear-gradient(135deg, #f8fff8 0%, #e8f5e9 100%)'
    }}>
      {error && (
        <div style={{ 
          color: '#d32f2f', 
          marginBottom: 16, 
          fontWeight: 'bold',
          padding: '12px 16px',
          backgroundColor: '#ffebee',
          borderRadius: '8px',
          border: '1px solid #ffcdd2'
        }}>
          ⚠️ {error}
        </div>
      )}
      <Tabs 
        value={tab} 
        onChange={(_, v) => setTab(v)} 
        centered
        sx={{
          '& .MuiTab-root': {
            fontSize: '1.1em',
            fontWeight: 'bold',
            color: '#2e7d32',
            '&.Mui-selected': {
              color: '#1b5e20'
            }
          },
          '& .MuiTabs-indicator': {
            backgroundColor: '#4caf50',
            height: 3
          }
        }}
      >
        <Tab label="📦 Inventario" />
        <Tab label="📊 Gráficos" />
      </Tabs>
      {tab === 0 && (
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Panel izquierdo - Formularios */}
          <Grid item xs={12} lg={4} xl={3}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Formulario Agregar Equipo */}
              {admin && (
                <Paper sx={{ 
                  p: 3, 
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fff8 100%)', 
                  borderRadius: 3, 
                  boxShadow: 2,
                  border: '1px solid #e8f5e9'
                }}>
                  <h3 style={{ 
                    color: '#2e7d32', 
                    marginBottom: 16, 
                    fontSize: '1.2em', 
                    textAlign: 'center', 
                    fontWeight: 'bold',
                    textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }}>
                    ➕ Agregar Equipo
                  </h3>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <input
                        type="text"
                        value={nuevoEquipo.nombre}
                        onChange={e => setNuevoEquipo({ ...nuevoEquipo, nombre: e.target.value })}
                        placeholder="Nombre del equipo"
                        style={{ 
                          padding: '12px 16px', 
                          borderRadius: '8px', 
                          border: '2px solid #c8e6c9', 
                          width: '100%', 
                          fontSize: '1em', 
                          boxSizing: 'border-box',
                          transition: 'all 0.3s ease',
                          backgroundColor: '#fafafa'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#4caf50'}
                        onBlur={(e) => e.target.style.borderColor = '#c8e6c9'}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <select
                        value={nuevoEquipo.tipo}
                        onChange={e => setNuevoEquipo({ ...nuevoEquipo, tipo: e.target.value })}
                        style={{ 
                          padding: '12px 16px', 
                          borderRadius: '8px', 
                          border: '2px solid #c8e6c9', 
                          width: '100%', 
                          fontSize: '1em', 
                          backgroundColor: '#fafafa',
                          transition: 'all 0.3s ease'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#4caf50'}
                        onBlur={(e) => e.target.style.borderColor = '#c8e6c9'}
                      >
                        <option value="">Tipo/Categoría</option>
                        {categorias.map(c => (
                          <option key={c.id} value={c.nombre}>{c.nombre}</option>
                        ))}
                      </select>
                    </Grid>
                    <Grid item xs={12}>
                      <select
                        value={nuevoEquipo.estado}
                        onChange={e => setNuevoEquipo({ ...nuevoEquipo, estado: e.target.value })}
                        style={{ 
                          padding: '12px 16px', 
                          borderRadius: '8px', 
                          border: '2px solid #c8e6c9', 
                          width: '100%', 
                          fontSize: '1em', 
                          backgroundColor: '#fafafa',
                          transition: 'all 0.3s ease'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#4caf50'}
                        onBlur={(e) => e.target.style.borderColor = '#c8e6c9'}
                      >
                        <option value="">Estado</option>
                        <option value="buen estado">Buen estado</option>
                        <option value="marcas de uso">Marcas de uso</option>
                        <option value="rayones">Rayones</option>
                        <option value="daño serio">Daño serio</option>
                        <option value="inservible">Inservible</option>
                      </select>
                    </Grid>
                    <Grid item xs={12}>
                      <select
                        value={nuevoEquipo.ubicacion_id || ''}
                        onChange={e => setNuevoEquipo({ ...nuevoEquipo, ubicacion_id: e.target.value })}
                        style={{ 
                          padding: '12px 16px', 
                          borderRadius: '8px', 
                          border: '2px solid #c8e6c9', 
                          width: '100%', 
                          fontSize: '1em', 
                          backgroundColor: '#fafafa',
                          transition: 'all 0.3s ease'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#4caf50'}
                        onBlur={(e) => e.target.style.borderColor = '#c8e6c9'}
                      >
                        <option value="">Ubicación</option>
                        {ubicaciones.map(u => (
                          <option key={u.id} value={u.id}>{u.nombre}</option>
                        ))}
                      </select>
                    </Grid>
                    <Grid item xs={12}>
                      <select
                        value={nuevoEquipo.usuario_id || ''}
                        onChange={e => setNuevoEquipo({ ...nuevoEquipo, usuario_id: e.target.value })}
                        style={{ 
                          padding: '12px 16px', 
                          borderRadius: '8px', 
                          border: '2px solid #c8e6c9', 
                          width: '100%', 
                          fontSize: '1em', 
                          backgroundColor: '#fafafa',
                          transition: 'all 0.3s ease'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#4caf50'}
                        onBlur={(e) => e.target.style.borderColor = '#c8e6c9'}
                      >
                        <option value="">Usuario</option>
                        {usuarios.map(u => (
                          <option key={u.id} value={u.id}>{u.nombre}</option>
                        ))}
                      </select>
                    </Grid>
                    <Grid item xs={12}>
                      <Button 
                        variant="contained" 
                        color="success" 
                        onClick={agregarEquipo} 
                        sx={{ 
                          width: '100%', 
                          fontWeight: 'bold', 
                          fontSize: '1em', 
                          padding: '12px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
                          boxShadow: '0 4px 8px rgba(76, 175, 80, 0.3)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)',
                            boxShadow: '0 6px 12px rgba(76, 175, 80, 0.4)'
                          }
                        }}
                      >
                        <FaPlus style={{ marginRight: 8 }} /> Agregar Equipo
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              )}



              {/* Filtros */}
              <Paper sx={{ 
                p: 3, 
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fff8 100%)', 
                borderRadius: 3, 
                boxShadow: 2,
                border: '1px solid #e8f5e9'
              }}>
                <h3 style={{ 
                  color: '#2e7d32', 
                  marginBottom: 16, 
                  fontSize: '1.2em', 
                  textAlign: 'center', 
                  fontWeight: 'bold',
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}>
                  🔍 Filtros
                </h3>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <select
                      value={filtro.tipo}
                      onChange={e => setFiltro({ ...filtro, tipo: e.target.value })}
                      style={{ 
                        padding: '12px 16px', 
                        borderRadius: '8px', 
                        border: '2px solid #c8e6c9', 
                        width: '100%', 
                        fontSize: '1em', 
                        backgroundColor: '#fafafa',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#4caf50'}
                      onBlur={(e) => e.target.style.borderColor = '#c8e6c9'}
                    >
                      <option value="">Todos los tipos</option>
                      {categorias.map(c => (
                        <option key={c.id} value={c.nombre}>{c.nombre}</option>
                      ))}
                    </select>
                  </Grid>
                  <Grid item xs={12}>
                    <select
                      value={filtro.estado}
                      onChange={e => setFiltro({ ...filtro, estado: e.target.value })}
                      style={{ 
                        padding: '12px 16px', 
                        borderRadius: '8px', 
                        border: '2px solid #c8e6c9', 
                        width: '100%', 
                        fontSize: '1em', 
                        backgroundColor: '#fafafa',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#4caf50'}
                      onBlur={(e) => e.target.style.borderColor = '#c8e6c9'}
                    >
                      <option value="">Todos los estados</option>
                      <option value="buen estado">Buen estado</option>
                      <option value="marcas de uso">Marcas de uso</option>
                      <option value="rayones">Rayones</option>
                      <option value="daño serio">Daño serio</option>
                      <option value="inservible">Inservible</option>
                    </select>
                  </Grid>
                  <Grid item xs={12}>
                    <Button 
                      variant="outlined" 
                      color="primary" 
                      onClick={() => setFiltro({ tipo: '', estado: '' })} 
                      sx={{ 
                        width: '100%', 
                        fontSize: '1em', 
                        padding: '12px',
                        borderRadius: '8px',
                        border: '2px solid #2196f3',
                        color: '#2196f3',
                        '&:hover': {
                          border: '2px solid #1976d2',
                          backgroundColor: '#e3f2fd'
                        }
                      }}
                    >
                      🔄 Limpiar Filtros
                    </Button>
                  </Grid>
                </Grid>
              </Paper>

              {/* Botones de Excel */}
              <Paper sx={{ 
                p: 3, 
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fff8 100%)', 
                borderRadius: 3, 
                boxShadow: 2,
                border: '1px solid #e8f5e9'
              }}>
                <h3 style={{ 
                  color: '#2e7d32', 
                  marginBottom: 16, 
                  fontSize: '1.2em', 
                  textAlign: 'center', 
                  fontWeight: 'bold',
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}>
                  📊 Excel
                </h3>
                <div style={{ display: 'flex', gap: 12 }}>
                  <Button 
                    variant="contained" 
                    color="info" 
                    onClick={exportarExcel} 
                    sx={{ 
                      flex: 1, 
                      fontSize: '0.9em', 
                      padding: '10px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
                      boxShadow: '0 4px 8px rgba(33, 150, 243, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                        boxShadow: '0 6px 12px rgba(33, 150, 243, 0.4)'
                      }
                    }}
                  >
                    📥 Exportar
                  </Button>
                  <Button 
                    variant="outlined" 
                    color="info" 
                    component="label" 
                    sx={{ 
                      flex: 1, 
                      fontSize: '0.9em', 
                      padding: '10px',
                      borderRadius: '8px',
                      border: '2px solid #2196f3',
                      '&:hover': {
                        border: '2px solid #1976d2',
                        backgroundColor: '#e3f2fd'
                      }
                    }}
                  >
                    📤 Importar
                    <input type="file" accept=".xlsx,.xls" onChange={handleImportExcel} style={{ display: 'none' }} />
                  </Button>
                </div>
                <Button 
                  variant="outlined" 
                  color="secondary" 
                  onClick={() => {
                    const ws = XLSX.utils.json_to_sheet([
                      { equipo: 'Ejemplo', tipo: 'Computadora', estado: 'Disponible', ubicacion_id: '', usuario_id: '' }
                    ]);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
                    XLSX.writeFile(wb, 'plantilla_inventario.xlsx');
                  }}
                  sx={{ 
                    width: '100%', 
                    marginTop: 12, 
                    fontSize: '0.9em', 
                    padding: '10px',
                    borderRadius: '8px',
                    border: '2px solid #9c27b0',
                    color: '#9c27b0',
                    '&:hover': {
                      border: '2px solid #7b1fa2',
                      backgroundColor: '#f3e5f5'
                    }
                  }}
                >
                  📋 Plantilla
                </Button>
              </Paper>
            </Box>
          </Grid>

          {/* Panel derecho - DataGrid */}
          <Grid item xs={12} lg={8} xl={9}>
            <Paper sx={{ 
              p: 2, 
              background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)', 
              borderRadius: 3, 
              boxShadow: 3, 
              width: '100%', 
              minWidth: 0,
              border: '1px solid #e0e0e0'
            }}>
              <div style={{ 
                padding: '16px 20px', 
                background: 'linear-gradient(135deg, #f8fff8 0%, #e8f5e9 100%)', 
                borderBottom: '2px solid #c8e6c9', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                borderRadius: '8px 8px 0 0'
              }}>
                <strong style={{ 
                  color: '#2e7d32', 
                  fontSize: '1.1em',
                  fontWeight: 'bold',
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}>
                  📦 Inventario: {inventarioFiltrado.length} elementos
                </strong>
                <span style={{ 
                  fontSize: '0.9em', 
                  color: '#666',
                  background: '#ffffff',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: '1px solid #e0e0e0'
                }}>
                  {filtro.tipo && `Filtro tipo: ${filtro.tipo}`} {filtro.estado && `| Estado: ${filtro.estado}`}
                </span>
              </div>
              <div style={{ height: 600, width: '100%' }}>
                <DataGrid
                  rows={inventarioFiltrado.map(e => ({ ...e, id: e.id }))}
                  columns={columns}
                  pageSize={15}
                  rowsPerPageOptions={[15, 25, 50, 100]}
                  disableSelectionOnClick
                  autoHeight={false}
                  sx={{
                    fontFamily: 'Segoe UI, Arial',
                    fontSize: '0.95em',
                    border: 0,
                    '& .MuiDataGrid-cell': {
                      padding: '12px 8px',
                      fontSize: '0.9em',
                      borderBottom: '1px solid #f0f0f0'
                    },
                    '& .MuiDataGrid-columnHeader': {
                      backgroundColor: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
                      fontWeight: 'bold',
                      fontSize: '1em',
                      borderBottom: '2px solid #c8e6c9',
                      color: '#2e7d32'
                    },
                    '& .MuiDataGrid-row:hover': {
                      backgroundColor: '#f8fff8'
                    }
                  }}
                />
              </div>
            </Paper>
          </Grid>
        </Grid>
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
                      <RechartsTooltip />
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
                      <RechartsTooltip />
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
      {/* MODAL DE MANTENIMIENTO */}
      {modalMantenimiento && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 12, minWidth: 320, maxWidth: 500 }}>
            <h3>Registrar Mantenimiento</h3>
            <form onSubmit={handleGuardarMantenimiento}>
              <select value={mantenimientoData.inventario_id} disabled style={{ width: '100%', marginBottom: 8 }} required>
                <option value="">Seleccionar Equipo</option>
                {inventario.map(eq => <option key={eq.id} value={eq.id}>{eq.equipo}</option>)}
              </select>
              <input type="text" value={mantenimientoData.tipo_mantenimiento} onChange={e => setMantenimientoData({ ...mantenimientoData, tipo_mantenimiento: e.target.value })} placeholder="Tipo de mantenimiento" style={{ width: '100%', marginBottom: 8 }} required />
              <input type="date" value={mantenimientoData.fecha} onChange={e => setMantenimientoData({ ...mantenimientoData, fecha: e.target.value })} style={{ width: '100%', marginBottom: 8 }} required />
              <select value={mantenimientoData.usuario_id} onChange={e => setMantenimientoData({ ...mantenimientoData, usuario_id: e.target.value })} style={{ width: '100%', marginBottom: 8 }} required>
                <option value="">Responsable</option>
                {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
              </select>
              <input type="date" value={mantenimientoData.fecha_termino} onChange={e => setMantenimientoData({ ...mantenimientoData, fecha_termino: e.target.value })} placeholder="Fecha de término" style={{ width: '100%', marginBottom: 8 }} />
              <input type="text" value={mantenimientoData.firma} onChange={e => setMantenimientoData({ ...mantenimientoData, firma: e.target.value })} placeholder="Firma" style={{ width: '100%', marginBottom: 8 }} />
              <input type="text" value={mantenimientoData.descripcion} onChange={e => setMantenimientoData({ ...mantenimientoData, descripcion: e.target.value })} placeholder="Descripción (opcional)" style={{ width: '100%', marginBottom: 8 }} />
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <Button variant="contained" color="success" type="submit">Guardar</Button>
                <Button variant="outlined" color="error" onClick={() => setModalMantenimiento(false)}>Cancelar</Button>
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
    
    // Obtener hora de México Central
    const horaMexico = new Date().toLocaleString('es-MX', { 
      timeZone: 'America/Mexico_City',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    fetchWithAuth(`${API_URL}/tickets/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ descripcion, usuario_id: usuario.id || 1 }) // Usa el id real si está disponible
    })
      .then(res => res.json())
      .then(data => {
        setTickets([...tickets, data]);
        setDescripcion('');
        
        // Notificación para admin cuando se crea un ticket
        if (admin) {
          // Crear notificación de audio
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
          audio.volume = 0.7;
          audio.play().catch(e => console.log('Audio notification failed:', e));
          
          // Notificación del navegador
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('🚨 Nuevo Ticket Creado', {
              body: `Usuario: ${usuario}\nDescripción: ${descripcion}\nHora: ${horaMexico}`,
              icon: '/favicon.ico',
              tag: 'ticket-notification',
              requireInteraction: true,
              silent: false
            });
          }
          
          // Mostrar alerta visual
          const alertDiv = document.createElement('div');
          alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #ff4444, #cc0000);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(255, 68, 68, 0.3);
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-weight: bold;
            max-width: 300px;
            animation: slideIn 0.5s ease-out;
          `;
          alertDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 24px;">🚨</span>
              <div>
                <div style="font-size: 16px; margin-bottom: 5px;">NUEVO TICKET</div>
                <div style="font-size: 12px; opacity: 0.9;">Usuario: ${usuario}</div>
                <div style="font-size: 12px; opacity: 0.9;">Hora: ${horaMexico}</div>
              </div>
            </div>
          `;
          
          // Agregar estilos de animación
          const style = document.createElement('style');
          style.textContent = `
            @keyframes slideIn {
              from { transform: translateX(100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
              from { transform: translateX(0); opacity: 1; }
              to { transform: translateX(100%); opacity: 0; }
            }
          `;
          document.head.appendChild(style);
          
          document.body.appendChild(alertDiv);
          
          // Remover la alerta después de 8 segundos
          setTimeout(() => {
            alertDiv.style.animation = 'slideOut 0.5s ease-in';
            setTimeout(() => {
              if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
              }
            }, 500);
          }, 8000);
        }
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
      const ticketsFiltrados = admin ? tickets : tickets.filter(t => t.usuario_nombre === usuario || t.usuario_nombre_perfil === usuario);

  return (
    <Box sx={{ 
      width: '100%', 
      maxWidth: '100%', 
      bgcolor: 'background.paper', 
      borderRadius: 3, 
      boxShadow: 3, 
      p: 3, 
      minHeight: '85vh', 
      overflowX: 'auto',
      background: 'linear-gradient(135deg, #f8fff8 0%, #e8f5e9 100%)'
    }}>
      <Grid container spacing={3}>
        {/* Panel izquierdo - Formulario */}
        <Grid item xs={12} lg={4} xl={3}>
          <Paper sx={{ 
            p: 3, 
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fff8 100%)', 
            borderRadius: 3, 
            boxShadow: 2,
            border: '1px solid #e8f5e9',
            height: 'fit-content'
          }}>
            <h3 style={{ 
              color: '#2e7d32', 
              marginBottom: 16, 
              fontSize: '1.2em', 
              textAlign: 'center', 
              fontWeight: 'bold',
              textShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}>
              🎫 Crear Ticket
            </h3>
            <textarea
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Describe el problema o solicitud..."
              style={{ 
                width: '100%', 
                minHeight: 120, 
                padding: '16px', 
                borderRadius: '8px', 
                border: '2px solid #c8e6c9', 
                marginBottom: 16, 
                fontSize: '1em', 
                resize: 'vertical', 
                boxSizing: 'border-box',
                transition: 'all 0.3s ease',
                backgroundColor: '#fafafa'
              }}
              onFocus={(e) => e.target.style.borderColor = '#4caf50'}
              onBlur={(e) => e.target.style.borderColor = '#c8e6c9'}
            />
            <Button 
              variant="contained" 
              color="success" 
              onClick={crearTicket} 
              sx={{ 
                width: '100%', 
                fontWeight: 'bold', 
                fontSize: '1.1em', 
                padding: '14px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
                boxShadow: '0 4px 8px rgba(76, 175, 80, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)',
                  boxShadow: '0 6px 12px rgba(76, 175, 80, 0.4)'
                }
              }}
            >
              <FaPlus style={{ marginRight: 8 }} /> CREAR TICKET
            </Button>
          </Paper>
        </Grid>

        {/* Panel derecho - Lista de Tickets */}
        <Grid item xs={12} lg={8} xl={9}>
          <Paper sx={{ 
            p: 3, 
            background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)', 
            borderRadius: 3, 
            boxShadow: 3, 
            width: '100%', 
            minWidth: 0,
            border: '1px solid #e0e0e0'
          }}>
            <div style={{ 
              padding: '16px 20px', 
              background: 'linear-gradient(135deg, #f8fff8 0%, #e8f5e9 100%)', 
              borderBottom: '2px solid #c8e6c9', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              borderRadius: '8px 8px 0 0',
              marginBottom: 16
            }}>
              <strong style={{ 
                color: '#2e7d32', 
                fontSize: '1.1em',
                fontWeight: 'bold',
                textShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}>
                🎫 Tickets: {ticketsFiltrados.length} total
              </strong>
              <span style={{ 
                fontSize: '0.9em', 
                color: '#666',
                background: '#ffffff',
                padding: '6px 12px',
                borderRadius: '20px',
                border: '1px solid #e0e0e0'
              }}>
                {admin ? 'Vista de Administrador' : 'Mis Tickets'}
              </span>
            </div>
            <div style={{ 
              maxHeight: 600, 
              overflowY: 'auto', 
              width: '100%', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 16 
            }}>
              {ticketsFiltrados.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  color: '#666', 
                  padding: 40,
                  fontSize: '1.1em'
                }}>
                  📭 No hay tickets registrados
                </div>
              ) : (
                ticketsFiltrados.map(t => (
                  <div key={t.id} style={{ 
                    background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)', 
                    borderRadius: 12, 
                    boxShadow: '0 4px 12px rgba(76, 175, 80, 0.2)', 
                    padding: '16px 20px', 
                    margin: 0, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    minHeight: 80,
                    border: '1px solid #a5d6a7',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontWeight: 'bold', 
                        color: '#2e7d32', 
                        fontSize: '1.1em', 
                        wordBreak: 'break-word',
                        marginBottom: 8
                      }}>
                        {t.descripcion}
                      </div>
                      <div style={{ 
                        fontSize: '0.9em', 
                        color: '#666',
                        marginBottom: 4
                      }}>
                        📅 Apertura: {t.fecha_apertura} | 👤 Usuario: {t.usuario_nombre_perfil || t.usuario_nombre}
                      </div>
                      <div style={{ 
                        fontSize: '1em', 
                        color: '#555',
                        fontWeight: 'bold'
                      }}>
                        Estado: <span style={{ 
                          color: t.estado === 'abierto' ? '#ff9800' : 
                                 t.estado === 'cerrado' ? '#4caf50' : 
                                 t.estado === 'en pausa' ? '#2196f3' : '#f44336'
                        }}>
                          {t.estado}
                        </span>
                      </div>
                    </div>
                    {admin && t.estado !== 'cerrado' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginLeft: 16 }}>
                        <Tooltip title="Finalizar ticket">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => finalizarTicket(t.id)}
                            sx={{ 
                              backgroundColor: '#e8f5e9', 
                              '&:hover': { backgroundColor: '#c8e6c9' },
                              border: '2px solid #4caf50',
                              minWidth: 44,
                              minHeight: 44,
                              boxShadow: '0 2px 4px rgba(76, 175, 80, 0.2)'
                            }}
                          >
                            <FaCheck />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Pausar ticket">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => pausarTicket(t.id)}
                            sx={{ 
                              backgroundColor: '#e3f2fd', 
                              '&:hover': { backgroundColor: '#bbdefb' },
                              border: '2px solid #2196f3',
                              minWidth: 44,
                              minHeight: 44,
                              boxShadow: '0 2px 4px rgba(33, 150, 243, 0.2)'
                            }}
                          >
                            <FaPause />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Descartar ticket">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => descartarTicket(t.id)}
                            sx={{ 
                              backgroundColor: '#ffebee', 
                              '&:hover': { backgroundColor: '#ffcdd2' },
                              border: '2px solid #f44336',
                              minWidth: 44,
                              minHeight: 44,
                              boxShadow: '0 2px 4px rgba(244, 67, 54, 0.2)'
                            }}
                          >
                            <FaTimes />
                          </IconButton>
                        </Tooltip>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Paper>
        </Grid>
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
                      <span>
                        <b>{u.nombre_perfil || u.nombre}</b> 
                        <span style={{ color: '#888', fontSize: '0.9em' }}>({u.rol})</span>
                        {u.nombre_perfil && <span style={{ color: '#1976d2', fontSize: '0.8em', marginLeft: 8 }}>[{u.nombre}]</span>}
                      </span>
                      <div style={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Editar usuario">
                          <IconButton 
                            size="small" 
                            color="info" 
                            onClick={() => handleEditarUsuario(u)}
                            sx={{ 
                              backgroundColor: '#e3f2fd', 
                              '&:hover': { backgroundColor: '#bbdefb' },
                              border: '1px solid #2196f3'
                            }}
                          >
                            <FaEdit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar usuario">
                          <IconButton 
                            size="small" 
                            color="error" 
                            onClick={() => borrarUsuario(u.id)}
                            sx={{ 
                              backgroundColor: '#ffebee', 
                              '&:hover': { backgroundColor: '#ffcdd2' },
                              border: '1px solid #f44336'
                            }}
                          >
                            <FaTrash />
                          </IconButton>
                        </Tooltip>
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
                  <Tooltip title="Eliminar ubicación">
                    <IconButton 
                      size="small" 
                      color="error" 
                      onClick={() => eliminarUbicacion(u.id)}
                      sx={{ 
                        backgroundColor: '#ffebee', 
                        '&:hover': { backgroundColor: '#ffcdd2' },
                        border: '1px solid #f44336'
                      }}
                    >
                      <FaTrash />
                    </IconButton>
                  </Tooltip>
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
                  <Tooltip title="Eliminar categoría">
                    <IconButton 
                      size="small" 
                      color="error" 
                      onClick={() => eliminarCategoria(c.id)}
                      sx={{ 
                        backgroundColor: '#ffebee', 
                        '&:hover': { backgroundColor: '#ffcdd2' },
                        border: '1px solid #f44336'
                      }}
                    >
                      <FaTrash />
                    </IconButton>
                  </Tooltip>
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
  const [archivos, setArchivos] = useState([]);
  const [descripcion, setDescripcion] = useState('');
  const [ticketId, setTicketId] = useState('');
  const [inventarioId, setInventarioId] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [subiendo, setSubiendo] = useState(false);

  // Cambia todas las URLs absolutas de fetch a rutas relativas para aprovechar el proxy
  useEffect(() => {
    console.log('Cargando documentos...');
    fetchWithAuth(`${API_URL}/documentos/`)
      .then(res => {
        console.log('Respuesta de documentos:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('Documentos cargados:', data);
        console.log('Número de documentos:', data.length);
        setDocumentos(data);
      })
      .catch(err => {
        console.error('Error cargando documentos:', err);
      });
  }, []);

  const subirDocumentos = async (e) => {
    e.preventDefault();
    if (archivos.length === 0) return setMensaje('Selecciona al menos un archivo');
    
    setSubiendo(true);
    let exitosos = 0;
    let errores = 0;
    
    for (let i = 0; i < archivos.length; i++) {
      const archivo = archivos[i];
      const formData = new FormData();
      formData.append('archivo', archivo);
      formData.append('descripcion', descripcion || archivo.name);
      if (ticketId) formData.append('ticket_id', ticketId);
      if (inventarioId) formData.append('inventario_id', inventarioId);
      
      try {
        const res = await fetchWithAuth(`${API_URL}/documentos/subir`, {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        
        if (data.success) {
          exitosos++;
        } else {
          errores++;
          console.error(`Error subiendo ${archivo.name}:`, data.error);
        }
      } catch (err) {
        errores++;
        console.error(`Error subiendo ${archivo.name}:`, err);
      }
    }
    
    // Recargar documentos
    try {
      const res = await fetchWithAuth(`${API_URL}/documentos/`);
      const nuevosDocs = await res.json();
      setDocumentos(nuevosDocs);
    } catch (err) {
      console.error('Error recargando documentos:', err);
    }
    
    setArchivos([]);
    setDescripcion('');
    setTicketId('');
    setInventarioId('');
    setSubiendo(false);
    
    if (exitosos > 0 && errores === 0) {
      setMensaje(`${exitosos} documento(s) subido(s) correctamente`);
    } else if (exitosos > 0 && errores > 0) {
      setMensaje(`${exitosos} subido(s) correctamente, ${errores} con error`);
    } else {
      setMensaje('Error al subir documentos');
    }
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
            <form onSubmit={subirDocumentos}>
              <input 
                type="file" 
                multiple 
                onChange={e => setArchivos(Array.from(e.target.files))} 
                style={{ marginBottom: 8, width: '100%' }} 
              />
              {archivos.length > 0 && (
                <div style={{ marginBottom: 8, fontSize: '0.9em', color: '#666' }}>
                  📁 {archivos.length} archivo(s) seleccionado(s)
                </div>
              )}
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
              <Button 
                type="submit" 
                variant="contained" 
                color="success" 
                disabled={subiendo}
                sx={{ 
                  minWidth: 120, 
                  fontWeight: 'bold', 
                  fontSize: '1em', 
                  width: '100%',
                  opacity: subiendo ? 0.7 : 1
                }}
              >
                {subiendo ? (
                  <>
                    <span style={{ marginRight: 6 }}>⏳</span> Subiendo...
                  </>
                ) : (
                  <>
                    <FaPlus style={{ marginRight: 6 }} /> 
                    Subir {archivos.length > 0 ? `(${archivos.length})` : ''}
                  </>
                )}
              </Button>
            </form>
            {mensaje && <div style={{ color: '#388e3c', marginTop: 10 }}>{mensaje}</div>}
          </Paper>
        </Grid>
        <Grid item xs={12} md={8} lg={9} xl={10}>
          <Paper sx={{ p: 2, background: '#fff', borderRadius: 2, boxShadow: 2, width: '100%', minWidth: 0 }}>
            <div style={{ marginBottom: 16, padding: '8px 12px', background: '#e8f5e9', borderRadius: 6, border: '1px solid #a5d6a7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ color: '#388e3c' }}>Total de documentos: {documentos.length}</strong>
                {documentos.length === 0 && <span style={{ color: '#666', marginLeft: 8 }}>No hay documentos subidos</span>}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={() => {
                    console.log('Refrescando documentos...');
                    fetchWithAuth(`${API_URL}/documentos/`)
                      .then(res => res.json())
                      .then(data => {
                        console.log('Documentos refrescados:', data);
                        setDocumentos(data);
                      })
                      .catch(err => console.error('Error refrescando:', err));
                  }}
                  sx={{ fontSize: '0.8em' }}
                >
                  🔄 Refrescar
                </Button>
                <Button 
                  variant="outlined" 
                  color="warning"
                  size="small" 
                  onClick={() => {
                    if (window.confirm('¿Estás seguro de que quieres limpiar archivos huérfanos? Esta acción no se puede deshacer.')) {
                      console.log('Limpiando archivos huérfanos...');
                      fetchWithAuth(`${API_URL}/documentos/limpiar-huérfanos`, {
                        method: 'POST'
                      })
                        .then(res => res.json())
                        .then(data => {
                          console.log('Limpieza completada:', data);
                          alert(data.mensaje || 'Limpieza completada');
                          // Refrescar la lista después de limpiar
                          fetchWithAuth(`${API_URL}/documentos/`)
                            .then(res => res.json())
                            .then(nuevosDocs => setDocumentos(nuevosDocs));
                        })
                        .catch(err => {
                          console.error('Error limpiando archivos:', err);
                          alert('Error al limpiar archivos');
                        });
                    }
                  }}
                  sx={{ fontSize: '0.8em' }}
                >
                  🧹 Limpiar
                </Button>
              </div>
            </div>
            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {documentos.map((doc, index) => (
                  <li key={doc.id} style={{ padding: '10px 0', borderBottom: '1px solid #e0e0e0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ 
                            background: '#e3f2fd', 
                            color: '#1976d2', 
                            padding: '2px 6px', 
                            borderRadius: 4, 
                            fontSize: '0.8em', 
                            fontWeight: 'bold' 
                          }}>
                            #{index + 1}
                          </span>
                          <strong style={{ color: '#388e3c' }}>{doc.nombre_archivo}</strong>
                          <span style={{ 
                            background: '#fff3e0', 
                            color: '#f57c00', 
                            padding: '2px 6px', 
                            borderRadius: 4, 
                            fontSize: '0.8em', 
                            textTransform: 'uppercase' 
                          }}>
                            {doc.tipo_archivo || 'N/A'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.9em', color: '#666', lineHeight: 1.4 }}>
                          <span>📅 Subido: {doc.fecha_subida}</span>
                          {doc.descripcion && <span> | 📝 {doc.descripcion}</span>}
                          {doc.ticket_id && <span> | 🎫 Ticket: {doc.ticket_id}</span>}
                          {doc.inventario_id && <span> | 📦 Inventario: {doc.inventario_id}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        {doc.nombre_archivo.toLowerCase().endsWith('.pdf') && (
                          <Tooltip title="Vista previa PDF">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => {
                                const url = `${API_URL}/documentos/${doc.id}/descargar`;
                                window.open(url, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
                              }}
                              sx={{ 
                                backgroundColor: '#e3f2fd', 
                                '&:hover': { backgroundColor: '#bbdefb' },
                                border: '1px solid #2196f3'
                              }}
                            >
                              <FaEye />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Descargar documento">
                          <IconButton
                            size="small"
                            color="success"
                            component="a"
                            href={`${API_URL}/documentos/${doc.id}/descargar`}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ 
                              backgroundColor: '#e8f5e9', 
                              '&:hover': { backgroundColor: '#c8e6c9' },
                              border: '1px solid #4caf50'
                            }}
                          >
                            <FaDownload />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar documento">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => eliminarDocumento(doc.id)}
                            sx={{ 
                              backgroundColor: '#ffebee', 
                              '&:hover': { backgroundColor: '#ffcdd2' },
                              border: '1px solid #f44336'
                            }}
                          >
                            <FaTrash />
                          </IconButton>
                        </Tooltip>
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

export function PropuestasMejoraPanel({ admin, usuario }) {
  const [propuestas, setPropuestas] = useState([]);
  const [nuevaPropuesta, setNuevaPropuesta] = useState({
    titulo: '',
    descripcion: '',
    persona_responsable: '',
    prioridad: 'media'
  });
  const [archivo, setArchivo] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [editando, setEditando] = useState(null);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    cargarPropuestas();
  }, []);

  const cargarPropuestas = () => {
    console.log('Cargando propuestas...');
    fetchWithAuth(`${API_URL}/propuestas/`)
      .then(res => {
        console.log('Respuesta de propuestas:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('Propuestas cargadas:', data);
        setPropuestas(data);
      })
      .catch(err => {
        console.error('Error cargando propuestas:', err);
        setMensaje('Error al cargar propuestas');
      });
  };

  const crearPropuesta = (e) => {
    e.preventDefault();
    if (!nuevaPropuesta.titulo || !nuevaPropuesta.persona_responsable) {
      setMensaje('Por favor completa el título y la persona responsable');
      return;
    }

    const formData = new FormData();
    formData.append('titulo', nuevaPropuesta.titulo);
    formData.append('descripcion', nuevaPropuesta.descripcion);
    formData.append('persona_responsable', nuevaPropuesta.persona_responsable);
    formData.append('prioridad', nuevaPropuesta.prioridad);
    formData.append('usuario_id', usuario.id || 1); // ID del usuario actual
    
    if (archivo) {
      formData.append('archivo', archivo);
    }

    console.log('Creando propuesta...', nuevaPropuesta);

    fetchWithAuth(`${API_URL}/propuestas/`, {
      method: 'POST',
      body: formData
    })
      .then(res => {
        console.log('Respuesta de creación:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('Respuesta de creación:', data);
        if (data.success) {
          setNuevaPropuesta({ titulo: '', descripcion: '', persona_responsable: '', prioridad: 'media' });
          setArchivo(null);
          setMensaje('Propuesta creada exitosamente');
          cargarPropuestas();
        } else {
          setMensaje(data.error || 'Error al crear propuesta');
        }
      })
      .catch(err => {
        console.error('Error creando propuesta:', err);
        setMensaje('Error de conexión al crear propuesta');
      });
  };

  const actualizarPropuesta = (id) => {
    fetchWithAuth(`${API_URL}/propuestas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editData)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setEditando(null);
          setEditData({});
          setMensaje('Propuesta actualizada exitosamente');
          cargarPropuestas();
        } else {
          setMensaje(data.error || 'Error al actualizar');
        }
      })
      .catch(err => {
        console.error('Error actualizando propuesta:', err);
        setMensaje('Error de conexión');
      });
  };

  const eliminarPropuesta = (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta propuesta?')) {
      fetchWithAuth(`${API_URL}/propuestas/${id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setMensaje('Propuesta eliminada exitosamente');
            cargarPropuestas();
          } else {
            setMensaje(data.error || 'Error al eliminar');
          }
        })
        .catch(err => {
          console.error('Error eliminando propuesta:', err);
          setMensaje('Error de conexión');
        });
    }
  };

  const getPrioridadColor = (prioridad) => {
    switch (prioridad) {
      case 'baja': return '#4caf50';
      case 'media': return '#ff9800';
      case 'alta': return '#f44336';
      case 'critica': return '#9c27b0';
      default: return '#666';
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'pendiente': return '#ff9800';
      case 'en_revision': return '#2196f3';
      case 'aprobada': return '#4caf50';
      case 'rechazada': return '#f44336';
      case 'implementada': return '#9c27b0';
      default: return '#666';
    }
  };

  return (
    <Box sx={{ width: '100vw', maxWidth: '100vw', bgcolor: 'background.paper', borderRadius: 2, boxShadow: 2, p: 2, minHeight: '80vh', overflowX: 'auto' }}>
      <Grid container spacing={2}>
        {/* Formulario de creación */}
        <Grid item xs={12} md={4} lg={3}>
          <Paper sx={{ p: 1.5, background: '#f8fff8', borderRadius: 2, boxShadow: 1, mb: 2 }}>
            <h4 style={{ color: '#388e3c', marginBottom: 6, fontSize: '1em', textAlign: 'center' }}>💡 Nueva Propuesta</h4>
            <form onSubmit={crearPropuesta}>
              <input
                type="text"
                placeholder="Título de la propuesta"
                value={nuevaPropuesta.titulo}
                onChange={e => setNuevaPropuesta({ ...nuevaPropuesta, titulo: e.target.value })}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #a5d6a7', marginBottom: 6, width: '100%', fontSize: '0.9em' }}
                required
              />
              <textarea
                placeholder="Descripción (opcional)"
                value={nuevaPropuesta.descripcion}
                onChange={e => setNuevaPropuesta({ ...nuevaPropuesta, descripcion: e.target.value })}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #a5d6a7', marginBottom: 6, width: '100%', fontSize: '0.9em', minHeight: '60px', resize: 'vertical' }}
              />
              <input
                type="text"
                placeholder="Persona responsable"
                value={nuevaPropuesta.persona_responsable}
                onChange={e => setNuevaPropuesta({ ...nuevaPropuesta, persona_responsable: e.target.value })}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #a5d6a7', marginBottom: 6, width: '100%', fontSize: '0.9em' }}
                required
              />
              <select
                value={nuevaPropuesta.prioridad}
                onChange={e => setNuevaPropuesta({ ...nuevaPropuesta, prioridad: e.target.value })}
                style={{ padding: '6px', borderRadius: '4px', border: '1px solid #a5d6a7', marginBottom: 6, width: '100%', fontSize: '0.9em' }}
              >
                <option value="baja">Prioridad Baja</option>
                <option value="media">Prioridad Media</option>
                <option value="alta">Prioridad Alta</option>
                <option value="critica">Prioridad Crítica</option>
              </select>
              <input
                type="file"
                accept=".pdf"
                onChange={e => setArchivo(e.target.files[0])}
                style={{ marginBottom: 6, width: '100%', fontSize: '0.8em' }}
              />
              <Button type="submit" variant="contained" color="success" sx={{ minWidth: 100, fontWeight: 'bold', fontSize: '0.9em', width: '100%', padding: '6px' }}>
                <FaPlus style={{ marginRight: 4 }} /> Crear
              </Button>
            </form>
            {mensaje && <div style={{ color: '#388e3c', marginTop: 8, fontSize: '0.9em' }}>{mensaje}</div>}
          </Paper>
        </Grid>

        {/* Lista de propuestas */}
        <Grid item xs={12} md={8} lg={9}>
          <Paper sx={{ p: 1, background: '#fff', borderRadius: 2, boxShadow: 2, width: '100%', minWidth: 0 }}>
            <div style={{ padding: '8px 12px', background: '#f8fff8', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ color: '#388e3c', fontSize: '0.9em' }}>
                📋 Propuestas: {propuestas.length} total
              </strong>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={cargarPropuestas}
                sx={{ fontSize: '0.8em' }}
              >
                🔄 Refrescar
              </Button>
            </div>
            <div style={{ maxHeight: 600, overflowY: 'auto' }}>
              {propuestas.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>
                  No hay propuestas de mejora registradas
                </div>
              ) : (
                propuestas.map((propuesta, index) => (
                  <div key={propuesta.id} style={{ padding: '12px', borderBottom: '1px solid #e0e0e0', background: index % 2 === 0 ? '#fafafa' : '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ 
                            background: '#e3f2fd', 
                            color: '#1976d2', 
                            padding: '2px 6px', 
                            borderRadius: 4, 
                            fontSize: '0.8em', 
                            fontWeight: 'bold' 
                          }}>
                            #{index + 1}
                          </span>
                          <strong style={{ color: '#388e3c', fontSize: '1em' }}>{propuesta.titulo}</strong>
                          <span style={{ 
                            background: getPrioridadColor(propuesta.prioridad) + '20', 
                            color: getPrioridadColor(propuesta.prioridad), 
                            padding: '2px 6px', 
                            borderRadius: 4, 
                            fontSize: '0.8em', 
                            textTransform: 'uppercase',
                            fontWeight: 'bold'
                          }}>
                            {propuesta.prioridad}
                          </span>
                          <span style={{ 
                            background: getEstadoColor(propuesta.estado) + '20', 
                            color: getEstadoColor(propuesta.estado), 
                            padding: '2px 6px', 
                            borderRadius: 4, 
                            fontSize: '0.8em', 
                            textTransform: 'uppercase',
                            fontWeight: 'bold'
                          }}>
                            {propuesta.estado.replace('_', ' ')}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.9em', color: '#666', lineHeight: 1.4, marginBottom: 4 }}>
                          {propuesta.descripcion && <div style={{ marginBottom: 4 }}>📝 {propuesta.descripcion}</div>}
                          <div>
                            👤 <strong>Responsable:</strong> {propuesta.persona_responsable}
                            {propuesta.usuario_nombre && <span> | 👨‍💻 <strong>Creado por:</strong> {propuesta.usuario_nombre_perfil || propuesta.usuario_nombre}</span>}
                          </div>
                          <div style={{ marginTop: 4 }}>
                            📅 <strong>Creado:</strong> {propuesta.fecha_creacion}
                            {propuesta.fecha_aprobacion && <span> | ✅ <strong>Aprobado:</strong> {propuesta.fecha_aprobacion}</span>}
                            {propuesta.fecha_implementacion && <span> | 🚀 <strong>Implementado:</strong> {propuesta.fecha_implementacion}</span>}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        {propuesta.nombre_archivo && (
                          <Tooltip title="Descargar PDF">
                            <IconButton
                              size="small"
                              color="info"
                              component="a"
                              href={`${API_URL}/propuestas/${propuesta.id}/descargar`}
                              target="_blank"
                              sx={{ 
                                backgroundColor: '#e3f2fd', 
                                '&:hover': { backgroundColor: '#bbdefb' },
                                border: '1px solid #2196f3'
                              }}
                            >
                              <FaDownload />
                            </IconButton>
                          </Tooltip>
                        )}
                        {admin && (
                          <>
                            <Tooltip title="Editar propuesta">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => {
                                  setEditando(propuesta.id);
                                  setEditData({
                                    titulo: propuesta.titulo,
                                    descripcion: propuesta.descripcion,
                                    persona_responsable: propuesta.persona_responsable,
                                    estado: propuesta.estado,
                                    prioridad: propuesta.prioridad
                                  });
                                }}
                                sx={{ 
                                  backgroundColor: '#e8f5e9', 
                                  '&:hover': { backgroundColor: '#c8e6c9' },
                                  border: '1px solid #4caf50'
                                }}
                              >
                                <FaEdit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Eliminar propuesta">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => eliminarPropuesta(propuesta.id)}
                                sx={{ 
                                  backgroundColor: '#ffebee', 
                                  '&:hover': { backgroundColor: '#ffcdd2' },
                                  border: '1px solid #f44336'
                                }}
                              >
                                <FaTrash />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Paper>
        </Grid>
      </Grid>

      {/* Modal de edición */}
      {editando && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: 20, borderRadius: 8, minWidth: 400, maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ color: '#388e3c', marginBottom: 16 }}>Editar Propuesta</h3>
            <form onSubmit={(e) => { e.preventDefault(); actualizarPropuesta(editando); }}>
              <input
                type="text"
                placeholder="Título"
                value={editData.titulo || ''}
                onChange={e => setEditData({ ...editData, titulo: e.target.value })}
                style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ddd', marginBottom: 12, width: '100%' }}
                required
              />
              <textarea
                placeholder="Descripción"
                value={editData.descripcion || ''}
                onChange={e => setEditData({ ...editData, descripcion: e.target.value })}
                style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ddd', marginBottom: 12, width: '100%', minHeight: '80px', resize: 'vertical' }}
              />
              <input
                type="text"
                placeholder="Persona responsable"
                value={editData.persona_responsable || ''}
                onChange={e => setEditData({ ...editData, persona_responsable: e.target.value })}
                style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ddd', marginBottom: 12, width: '100%' }}
                required
              />
              <select
                value={editData.prioridad || 'media'}
                onChange={e => setEditData({ ...editData, prioridad: e.target.value })}
                style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ddd', marginBottom: 12, width: '100%' }}
              >
                <option value="baja">Prioridad Baja</option>
                <option value="media">Prioridad Media</option>
                <option value="alta">Prioridad Alta</option>
                <option value="critica">Prioridad Crítica</option>
              </select>
              <select
                value={editData.estado || 'pendiente'}
                onChange={e => setEditData({ ...editData, estado: e.target.value })}
                style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ddd', marginBottom: 16, width: '100%' }}
              >
                <option value="pendiente">Pendiente</option>
                <option value="en_revision">En Revisión</option>
                <option value="aprobada">Aprobada</option>
                <option value="rechazada">Rechazada</option>
                <option value="implementada">Implementada</option>
              </select>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="contained" color="success" type="submit" sx={{ flex: 1 }}>
                  Guardar
                </Button>
                <Button variant="outlined" color="error" onClick={() => { setEditando(null); setEditData({}); }} sx={{ flex: 1 }}>
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Box>
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
    return usu ? getDisplayName(usu) : '';
  };
  const getResponsable = (id) => {
    const usu = usuarios.find(u => u.id === id);
    return usu ? getDisplayName(usu) : '';
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
              {usuarios.map(u => <option key={u.id} value={u.id}>{getDisplayName(u)}</option>)}
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
                      <Tooltip title="Editar mantenimiento">
                        <IconButton 
                          size="small" 
                          color="primary" 
                          onClick={() => handleEditar(m)}
                          sx={{ 
                            backgroundColor: '#e3f2fd', 
                            '&:hover': { backgroundColor: '#bbdefb' },
                            border: '1px solid #2196f3'
                          }}
                        >
                          <FaEdit />
                        </IconButton>
                      </Tooltip>
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


    </Box>
  );
}

export function SoportePanel({ admin, usuario }) {
  const [temas, setTemas] = useState([]);
  const [procedimientos, setProcedimientos] = useState([]);
  const [temaSeleccionado, setTemaSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [modalTema, setModalTema] = useState(false);
  const [modalProcedimiento, setModalProcedimiento] = useState(false);
  const [editandoTema, setEditandoTema] = useState(null);
  const [editandoProcedimiento, setEditandoProcedimiento] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [archivosSoporte, setArchivosSoporte] = useState([]);
  const [subiendoArchivos, setSubiendoArchivos] = useState(false);
  const [procedimientoSeleccionado, setProcedimientoSeleccionado] = useState(null);

  // Estados para formularios
  const [nuevoTema, setNuevoTema] = useState({
    nombre: '',
    descripcion: '',
    categoria: 'General',
    color: '#2196f3'
  });

  const [nuevoProcedimiento, setNuevoProcedimiento] = useState({
    titulo: '',
    descripcion: '',
    pasos: '',
    comandos: '',
    notas: '',
    dificultad: 'Intermedio',
    tiempo_estimado: '',
    tema_id: ''
  });
  const [archivosProcedimiento, setArchivosProcedimiento] = useState([]);

  useEffect(() => {
    cargarTemas();
  }, []);

  useEffect(() => {
    if (temaSeleccionado) {
      cargarProcedimientos(temaSeleccionado.id);
    } else {
      setProcedimientos([]);
    }
  }, [temaSeleccionado]);

  const cargarTemas = () => {
    fetchWithAuth(`${API_URL}/soporte/temas/`)
      .then(res => res.json())
      .then(data => setTemas(data))
      .catch(err => {
        console.error('Error cargando temas:', err);
        setMensaje('Error al cargar temas');
      });
  };

  const cargarProcedimientos = (temaId) => {
    fetchWithAuth(`${API_URL}/soporte/procedimientos/?tema_id=${temaId}`)
      .then(res => res.json())
      .then(data => setProcedimientos(data))
      .catch(err => {
        console.error('Error cargando procedimientos:', err);
        setMensaje('Error al cargar procedimientos');
      });
  };



  const buscarSoporte = () => {
    if (!busqueda.trim()) {
      setResultadosBusqueda([]);
      return;
    }

    fetchWithAuth(`${API_URL}/soporte/buscar/?q=${encodeURIComponent(busqueda)}`)
      .then(res => res.json())
      .then(data => setResultadosBusqueda(data))
      .catch(err => {
        console.error('Error en búsqueda:', err);
        setMensaje('Error en la búsqueda');
      });
  };

  const crearTema = () => {
    if (!nuevoTema.nombre.trim()) {
      setMensaje('El nombre del tema es requerido');
      return;
    }

    fetchWithAuth(`${API_URL}/soporte/temas/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevoTema)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTemas(prev => [...prev, data]);
          setNuevoTema({ nombre: '', descripcion: '', categoria: 'General', color: '#2196f3' });
          setModalTema(false);
          setMensaje('Tema creado exitosamente');
        } else {
          setMensaje(data.error || 'Error al crear tema');
        }
      })
      .catch(err => {
        console.error('Error creando tema:', err);
        setMensaje('Error de conexión');
      });
  };

  const actualizarTema = () => {
    if (!editandoTema.nombre.trim()) {
      setMensaje('El nombre del tema es requerido');
      return;
    }

    fetchWithAuth(`${API_URL}/soporte/temas/${editandoTema.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editandoTema)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTemas(prev => prev.map(t => t.id === editandoTema.id ? { ...t, ...data } : t));
          setEditandoTema(null);
          setModalTema(false);
          setMensaje('Tema actualizado exitosamente');
        } else {
          setMensaje(data.error || 'Error al actualizar tema');
        }
      })
      .catch(err => {
        console.error('Error actualizando tema:', err);
        setMensaje('Error de conexión');
      });
  };

  const eliminarTema = (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este tema?')) return;

    fetchWithAuth(`${API_URL}/soporte/temas/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTemas(prev => prev.filter(t => t.id !== id));
          if (temaSeleccionado && temaSeleccionado.id === id) {
            setTemaSeleccionado(null);
          }
          setMensaje('Tema eliminado exitosamente');
        } else {
          setMensaje(data.error || 'Error al eliminar tema');
        }
      })
      .catch(err => {
        console.error('Error eliminando tema:', err);
        setMensaje('Error de conexión');
      });
  };

  const crearProcedimiento = async () => {
    if (!nuevoProcedimiento.titulo.trim() || !nuevoProcedimiento.tema_id) {
      setMensaje('El título y tema son requeridos');
      return;
    }

    try {
      // Primero crear el procedimiento
      const res = await fetchWithAuth(`${API_URL}/soporte/procedimientos/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoProcedimiento)
      });
      const data = await res.json();
      
      if (data.success) {
        const procedimientoCreado = data;
        setProcedimientos(prev => [...prev, procedimientoCreado]);
        
        // Si hay archivos, subirlos
        if (archivosProcedimiento.length > 0) {
          let archivosSubidos = 0;
          for (let i = 0; i < archivosProcedimiento.length; i++) {
            const archivo = archivosProcedimiento[i];
            const formData = new FormData();
            formData.append('archivo', archivo);
            formData.append('procedimiento_id', procedimientoCreado.id);
            formData.append('descripcion', `Archivo de soporte para: ${procedimientoCreado.titulo}`);
            
            try {
              const resArchivo = await fetchWithAuth(`${API_URL}/documentos/subir`, {
                method: 'POST',
                body: formData
              });
              const dataArchivo = await resArchivo.json();
              if (dataArchivo.success) {
                archivosSubidos++;
              }
            } catch (err) {
              console.error(`Error subiendo archivo ${archivo.name}:`, err);
            }
          }
          
          if (archivosSubidos > 0) {
            setMensaje(`Procedimiento creado exitosamente con ${archivosSubidos} archivo(s) PDF`);
          } else {
            setMensaje('Procedimiento creado exitosamente (error al subir archivos)');
          }
        } else {
          setMensaje('Procedimiento creado exitosamente');
        }
        
        setNuevoProcedimiento({
          titulo: '', descripcion: '', pasos: '', comandos: '', notas: '',
          dificultad: 'Intermedio', tiempo_estimado: '', tema_id: ''
        });
        setArchivosProcedimiento([]);
        setModalProcedimiento(false);
      } else {
        setMensaje(data.error || 'Error al crear procedimiento');
      }
    } catch (err) {
      console.error('Error creando procedimiento:', err);
      setMensaje('Error de conexión');
    }
  };

  const actualizarProcedimiento = () => {
    if (!editandoProcedimiento.titulo.trim()) {
      setMensaje('El título del procedimiento es requerido');
      return;
    }

    fetchWithAuth(`${API_URL}/soporte/procedimientos/${editandoProcedimiento.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editandoProcedimiento)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProcedimientos(prev => prev.map(p => p.id === editandoProcedimiento.id ? { ...p, ...data } : p));
          setEditandoProcedimiento(null);
          setModalProcedimiento(false);
          setMensaje('Procedimiento actualizado exitosamente');
        } else {
          setMensaje(data.error || 'Error al actualizar procedimiento');
        }
      })
      .catch(err => {
        console.error('Error actualizando procedimiento:', err);
        setMensaje('Error de conexión');
      });
  };

  const eliminarProcedimiento = (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este procedimiento?')) return;

    fetchWithAuth(`${API_URL}/soporte/procedimientos/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProcedimientos(prev => prev.filter(p => p.id !== id));
          setMensaje('Procedimiento eliminado exitosamente');
        } else {
          setMensaje(data.error || 'Error al eliminar procedimiento');
        }
      })
      .catch(err => {
        console.error('Error eliminando procedimiento:', err);
        setMensaje('Error de conexión');
      });
  };

  const getDificultadColor = (dificultad) => {
    switch (dificultad) {
      case 'Fácil': return '#4caf50';
      case 'Intermedio': return '#ff9800';
      case 'Avanzado': return '#f44336';
      default: return '#2196f3';
    }
  };

  const subirArchivosSoporte = async (e) => {
    e.preventDefault();
    if (archivosSoporte.length === 0) return setMensaje('Selecciona al menos un archivo PDF');
    if (!procedimientoSeleccionado) return setMensaje('Selecciona un procedimiento para asociar los archivos');
    
    setSubiendoArchivos(true);
    let exitosos = 0;
    let errores = 0;
    
    for (let i = 0; i < archivosSoporte.length; i++) {
      const archivo = archivosSoporte[i];
      const formData = new FormData();
      formData.append('archivo', archivo);
      formData.append('procedimiento_id', procedimientoSeleccionado.id);
      formData.append('descripcion', `Archivo de soporte para: ${procedimientoSeleccionado.titulo}`);
      
      try {
        const res = await fetchWithAuth(`${API_URL}/documentos/subir`, {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        
        if (data.success) {
          exitosos++;
        } else {
          errores++;
          console.error(`Error subiendo ${archivo.name}:`, data.error);
        }
      } catch (err) {
        errores++;
        console.error(`Error subiendo ${archivo.name}:`, err);
      }
    }
    
    setArchivosSoporte([]);
    setProcedimientoSeleccionado(null);
    setSubiendoArchivos(false);
    
    if (exitosos > 0 && errores === 0) {
      setMensaje(`${exitosos} archivo(s) PDF subido(s) correctamente al procedimiento`);
    } else if (exitosos > 0 && errores > 0) {
      setMensaje(`${exitosos} subido(s) correctamente, ${errores} con error`);
    } else {
      setMensaje('Error al subir archivos PDF');
    }
  };

  return (
    <Box sx={{ 
      width: '100%', 
      maxWidth: '100vw', 
      bgcolor: 'background.paper', 
      borderRadius: 2, 
      boxShadow: 2, 
      p: 3, 
      minHeight: '80vh', 
      overflowX: 'auto' 
    }}>
      <Grid container spacing={3}>
        {/* Barra de búsqueda */}
        <Grid item xs={12}>
          <Paper sx={{ 
            p: 2, 
            background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', 
            borderRadius: 2, 
            boxShadow: 1 
          }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <FaSearch style={{ color: '#1976d2', fontSize: '1.2em' }} />
              <input
                type="text"
                placeholder="🔍 Buscar temas y procedimientos..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && buscarSoporte()}
                style={{ 
                  flex: 1, 
                  padding: '12px 16px', 
                  borderRadius: '8px', 
                  border: '2px solid #90caf9', 
                  fontSize: '1em',
                  backgroundColor: '#fff'
                }}
              />
              <Button 
                variant="contained" 
                color="primary" 
                onClick={buscarSoporte}
                sx={{ 
                  background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                  '&:hover': { background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)' }
                }}
              >
                Buscar
              </Button>
            </div>
            
            {/* Resultados de búsqueda */}
            {resultadosBusqueda.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h4 style={{ color: '#1976d2', marginBottom: 12 }}>Resultados de búsqueda:</h4>
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {resultadosBusqueda.map((resultado, idx) => (
                    <Paper key={idx} sx={{ 
                      p: 2, 
                      mb: 1, 
                      background: resultado.tipo === 'tema' ? '#fff3e0' : '#f3e5f5',
                      border: '1px solid #ffcc02',
                      cursor: 'pointer'
                    }} onClick={() => {
                      if (resultado.tipo === 'tema') {
                        setTemaSeleccionado(resultado);
                      }
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {resultado.tipo === 'tema' ? <FaBook style={{ color: '#ff9800' }} /> : <FaTools style={{ color: '#9c27b0' }} />}
                        <div style={{ flex: 1 }}>
                          <strong>{resultado.titulo}</strong>
                          <div style={{ fontSize: '0.9em', color: '#666' }}>
                            {resultado.tipo === 'tema' ? resultado.categoria : `Tema: ${resultado.tema_nombre}`}
                          </div>
                          <div style={{ fontSize: '0.8em', color: '#888' }}>
                            {resultado.descripcion?.substring(0, 100)}...
                          </div>
                        </div>
                      </div>
                    </Paper>
                  ))}
                </div>
              </div>
            )}
          </Paper>
        </Grid>

        {/* Panel izquierdo - Temas */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ 
            p: 3, 
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fff8 100%)', 
            borderRadius: 3, 
            boxShadow: 2,
            border: '1px solid #e8f5e9',
            height: 'fit-content'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ 
                color: '#2e7d32', 
                fontSize: '1.3em', 
                fontWeight: 'bold',
                textShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}>
                📚 Temas de Soporte
              </h3>
              {admin && (
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={() => {
                    setEditandoTema(null);
                    setNuevoTema({ nombre: '', descripcion: '', categoria: 'General', color: '#2196f3' });
                    setModalTema(true);
                  }}
                  sx={{ 
                    background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                    '&:hover': { background: 'linear-gradient(135deg, #45a049 0%, #3d8b40 100%)' }
                  }}
                >
                  ➕ Nuevo Tema
                </Button>
              )}
            </div>

            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
              {temas.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#666', padding: 20 }}>
                  No hay temas de soporte
                </div>
              ) : (
                temas.map(tema => (
                  <Paper key={tema.id} sx={{ 
                    p: 2, 
                    mb: 2, 
                    background: temaSeleccionado?.id === tema.id ? '#e8f5e9' : '#fff',
                    border: `2px solid ${temaSeleccionado?.id === tema.id ? '#4caf50' : '#e0e0e0'}`,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': { 
                      background: temaSeleccionado?.id === tema.id ? '#e8f5e9' : '#f5f5f5',
                      borderColor: '#4caf50'
                    }
                  }} onClick={() => setTemaSeleccionado(tema)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <div style={{ 
                            width: 12, 
                            height: 12, 
                            borderRadius: '50%', 
                            backgroundColor: tema.color,
                            border: '2px solid #fff',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }} />
                          <h4 style={{ 
                            margin: 0, 
                            color: '#2e7d32', 
                            fontWeight: 'bold',
                            fontSize: '1.1em'
                          }}>
                            {tema.nombre}
                          </h4>
                        </div>
                        <div style={{ fontSize: '0.9em', color: '#666', marginBottom: 4 }}>
                          📂 {tema.categoria}
                        </div>
                        <div style={{ fontSize: '0.8em', color: '#888' }}>
                          {tema.descripcion?.substring(0, 80)}...
                        </div>
                        <div style={{ fontSize: '0.8em', color: '#4caf50', marginTop: 4 }}>
                          📋 {tema.procedimientos_count} procedimientos
                        </div>
                      </div>
                      {admin && (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <IconButton 
                            size="small" 
                            color="primary" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditandoTema(tema);
                              setNuevoTema({ ...tema });
                              setModalTema(true);
                            }}
                          >
                            <FaEdit />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="error" 
                            onClick={(e) => {
                              e.stopPropagation();
                              eliminarTema(tema.id);
                            }}
                          >
                            <FaTrash />
                          </IconButton>
                        </div>
                      )}
                    </div>
                  </Paper>
                ))
              )}
            </div>
          </Paper>
        </Grid>

        {/* Panel derecho - Procedimientos */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ 
            p: 3, 
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fff8 100%)', 
            borderRadius: 3, 
            boxShadow: 2,
            border: '1px solid #e8f5e9',
            minHeight: 600
          }}>
            
            {/* Panel de subida de archivos PDF */}
            <Paper sx={{ 
              p: 2, 
              mb: 3, 
              background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)', 
              borderRadius: 2, 
              boxShadow: 1,
              border: '1px solid #ffcc02'
            }}>
              <h4 style={{ color: '#f57c00', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                📎 Subir Archivos PDF de Soporte
              </h4>
              <form onSubmit={subirArchivosSoporte}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <select
                      value={procedimientoSeleccionado?.id || ''}
                      onChange={e => {
                        const proc = procedimientos.find(p => p.id === parseInt(e.target.value));
                        setProcedimientoSeleccionado(proc || null);
                      }}
                      style={{ 
                        width: '100%', 
                        padding: 8, 
                        borderRadius: 4, 
                        border: '1px solid #ffcc02',
                        backgroundColor: '#fff'
                      }}
                      required
                    >
                      <option value="">Selecciona un procedimiento</option>
                      {procedimientos.map(proc => (
                        <option key={proc.id} value={proc.id}>
                          {proc.titulo}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <input 
                      type="file" 
                      multiple 
                      accept=".pdf"
                      onChange={e => setArchivosSoporte(Array.from(e.target.files))} 
                      style={{ 
                        width: '100%', 
                        padding: 8, 
                        borderRadius: 4, 
                        border: '1px solid #ffcc02',
                        backgroundColor: '#fff'
                      }} 
                    />
                  </div>
                </div>
                {archivosSoporte.length > 0 && (
                  <div style={{ marginBottom: 12, fontSize: '0.9em', color: '#f57c00' }}>
                    📁 {archivosSoporte.length} archivo(s) PDF seleccionado(s)
                  </div>
                )}
                <Button 
                  type="submit" 
                  variant="contained" 
                  disabled={subiendoArchivos || archivosSoporte.length === 0 || !procedimientoSeleccionado}
                  sx={{ 
                    background: 'linear-gradient(135deg, #f57c00 0%, #ef6c00 100%)',
                    '&:hover': { background: 'linear-gradient(135deg, #ef6c00 0%, #e65100 100%)' },
                    '&:disabled': { background: '#ccc' }
                  }}
                >
                  {subiendoArchivos ? '⏳ Subiendo...' : '📎 Subir PDF(s)'}
                </Button>
              </form>
            </Paper>
            {temaSeleccionado ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div>
                    <h3 style={{ 
                      color: '#2e7d32', 
                      fontSize: '1.4em', 
                      fontWeight: 'bold',
                      marginBottom: 4
                    }}>
                      {temaSeleccionado.nombre}
                    </h3>
                    <div style={{ fontSize: '0.9em', color: '#666' }}>
                      {temaSeleccionado.descripcion}
                    </div>
                  </div>
                  {admin && (
                    <Button 
                      variant="contained" 
                      color="primary" 
                      onClick={() => {
                        setEditandoProcedimiento(null);
                        setNuevoProcedimiento({
                          titulo: '', descripcion: '', pasos: '', comandos: '', notas: '',
                          dificultad: 'Intermedio', tiempo_estimado: '', tema_id: temaSeleccionado.id
                        });
                        setArchivosProcedimiento([]);
                        setModalProcedimiento(true);
                      }}
                      sx={{ 
                        background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
                        '&:hover': { background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)' }
                      }}
                    >
                      ➕ Nuevo Procedimiento
                    </Button>
                  )}
                </div>

                <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                  {procedimientos.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#666', padding: 40 }}>
                      <FaTools style={{ fontSize: '3em', color: '#ccc', marginBottom: 16 }} />
                      <div>No hay procedimientos para este tema</div>
                      <div style={{ fontSize: '0.9em', color: '#999' }}>
                        {admin ? 'Crea el primer procedimiento usando el botón de arriba' : 'Contacta al administrador para agregar procedimientos'}
                      </div>
                    </div>
                  ) : (
                    procedimientos.map(proc => (
                      <Paper key={proc.id} sx={{ 
                        p: 3, 
                        mb: 3, 
                        background: '#fff',
                        border: '1px solid #e0e0e0',
                        borderRadius: 2,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ 
                              margin: 0, 
                              color: '#2e7d32', 
                              fontWeight: 'bold',
                              fontSize: '1.2em',
                              marginBottom: 8
                            }}>
                              {proc.titulo}
                            </h4>
                            <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                              <span style={{ 
                                padding: '4px 8px', 
                                borderRadius: '12px', 
                                backgroundColor: getDificultadColor(proc.dificultad),
                                color: '#fff',
                                fontSize: '0.8em',
                                fontWeight: 'bold'
                              }}>
                                {proc.dificultad}
                              </span>
                              {proc.tiempo_estimado && (
                                <span style={{ 
                                  padding: '4px 8px', 
                                  borderRadius: '12px', 
                                  backgroundColor: '#e3f2fd',
                                  color: '#1976d2',
                                  fontSize: '0.8em'
                                }}>
                                  ⏱️ {proc.tiempo_estimado}
                                </span>
                              )}
                            </div>
                            {proc.descripcion && (
                              <div style={{ 
                                fontSize: '0.9em', 
                                color: '#666', 
                                marginBottom: 12,
                                lineHeight: '1.4'
                              }}>
                                {proc.descripcion}
                              </div>
                            )}
                            {proc.pasos && (
                              <div style={{ marginBottom: 12 }}>
                                <h5 style={{ color: '#2e7d32', marginBottom: 8 }}>📋 Pasos:</h5>
                                <div style={{ 
                                  fontSize: '0.9em', 
                                  color: '#555',
                                  whiteSpace: 'pre-line',
                                  lineHeight: '1.5'
                                }}>
                                  {proc.pasos}
                                </div>
                              </div>
                            )}
                            {proc.comandos && (
                              <div style={{ marginBottom: 12 }}>
                                <h5 style={{ color: '#2e7d32', marginBottom: 8 }}>💻 Comandos:</h5>
                                <div style={{ 
                                  fontSize: '0.9em', 
                                  color: '#555',
                                  backgroundColor: '#f5f5f5',
                                  padding: 12,
                                  borderRadius: 4,
                                  fontFamily: 'monospace',
                                  whiteSpace: 'pre-line'
                                }}>
                                  {proc.comandos}
                                </div>
                              </div>
                            )}
                            {proc.notas && (
                              <div style={{ marginBottom: 12 }}>
                                <h5 style={{ color: '#2e7d32', marginBottom: 8 }}>📝 Notas:</h5>
                                <div style={{ 
                                  fontSize: '0.9em', 
                                  color: '#555',
                                  fontStyle: 'italic',
                                  lineHeight: '1.4'
                                }}>
                                  {proc.notas}
                                </div>
                              </div>
                            )}
                            <div style={{ 
                              fontSize: '0.8em', 
                              color: '#888',
                              borderTop: '1px solid #eee',
                              paddingTop: 8
                            }}>
                              👤 Creado por: {proc.usuario_creador} | 
                              📅 {new Date(proc.fecha_creacion).toLocaleDateString()}
                            </div>
                          </div>
                          {admin && (
                            <div style={{ display: 'flex', gap: 4 }}>
                              <IconButton 
                                size="small" 
                                color="primary" 
                                onClick={() => {
                                  setEditandoProcedimiento(proc);
                                  setNuevoProcedimiento({ ...proc });
                                  setArchivosProcedimiento([]);
                                  setModalProcedimiento(true);
                                }}
                              >
                                <FaEdit />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                color="error" 
                                onClick={() => eliminarProcedimiento(proc.id)}
                              >
                                <FaTrash />
                              </IconButton>
                            </div>
                          )}
                        </div>
                      </Paper>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', color: '#666', padding: 40 }}>
                <FaBook style={{ fontSize: '3em', color: '#ccc', marginBottom: 16 }} />
                <div>Selecciona un tema para ver sus procedimientos</div>
              </div>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Modal para crear/editar tema */}
      {modalTema && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          zIndex: 1000 
        }}>
          <div style={{ 
            background: '#fff', 
            padding: 24, 
            borderRadius: 8, 
            width: '90%', 
            maxWidth: 500,
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ color: '#2e7d32', marginBottom: 16 }}>
              {editandoTema ? '✏️ Editar Tema' : '➕ Nuevo Tema'}
            </h3>
            <form onSubmit={(e) => { e.preventDefault(); editandoTema ? actualizarTema() : crearTema(); }}>
              <input
                type="text"
                placeholder="Nombre del tema"
                value={nuevoTema.nombre}
                onChange={e => setNuevoTema({ ...nuevoTema, nombre: e.target.value })}
                style={{ width: '100%', marginBottom: 12, padding: 12, borderRadius: 4, border: '1px solid #ccc' }}
                required
              />
              <textarea
                placeholder="Descripción del tema"
                value={nuevoTema.descripcion}
                onChange={e => setNuevoTema({ ...nuevoTema, descripcion: e.target.value })}
                style={{ width: '100%', marginBottom: 12, padding: 12, borderRadius: 4, border: '1px solid #ccc', minHeight: 80 }}
              />
              <input
                type="text"
                placeholder="Categoría (ej: Base de Datos, Herramientas)"
                value={nuevoTema.categoria}
                onChange={e => setNuevoTema({ ...nuevoTema, categoria: e.target.value })}
                style={{ width: '100%', marginBottom: 12, padding: 12, borderRadius: 4, border: '1px solid #ccc' }}
              />
              <input
                type="color"
                value={nuevoTema.color}
                onChange={e => setNuevoTema({ ...nuevoTema, color: e.target.value })}
                style={{ width: '100%', marginBottom: 16, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <Button type="submit" variant="contained" color="primary">
                  {editandoTema ? 'Actualizar' : 'Crear'}
                </Button>
                <Button variant="outlined" color="error" onClick={() => setModalTema(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para crear/editar procedimiento */}
      {modalProcedimiento && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          zIndex: 1000 
        }}>
          <div style={{ 
            background: '#fff', 
            padding: 24, 
            borderRadius: 8, 
            width: '90%', 
            maxWidth: 600,
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ color: '#2e7d32', marginBottom: 16 }}>
              {editandoProcedimiento ? '✏️ Editar Procedimiento' : '➕ Nuevo Procedimiento'}
            </h3>
            <form onSubmit={(e) => { e.preventDefault(); editandoProcedimiento ? actualizarProcedimiento() : crearProcedimiento(); }}>
              <input
                type="text"
                placeholder="Título del procedimiento"
                value={nuevoProcedimiento.titulo}
                onChange={e => setNuevoProcedimiento({ ...nuevoProcedimiento, titulo: e.target.value })}
                style={{ width: '100%', marginBottom: 12, padding: 12, borderRadius: 4, border: '1px solid #ccc' }}
                required
              />
              <textarea
                placeholder="Descripción del procedimiento"
                value={nuevoProcedimiento.descripcion}
                onChange={e => setNuevoProcedimiento({ ...nuevoProcedimiento, descripcion: e.target.value })}
                style={{ width: '100%', marginBottom: 12, padding: 12, borderRadius: 4, border: '1px solid #ccc', minHeight: 80 }}
              />
              <textarea
                placeholder="Pasos detallados del procedimiento"
                value={nuevoProcedimiento.pasos}
                onChange={e => setNuevoProcedimiento({ ...nuevoProcedimiento, pasos: e.target.value })}
                style={{ width: '100%', marginBottom: 12, padding: 12, borderRadius: 4, border: '1px solid #ccc', minHeight: 120 }}
              />
              <textarea
                placeholder="Comandos específicos (si aplica)"
                value={nuevoProcedimiento.comandos}
                onChange={e => setNuevoProcedimiento({ ...nuevoProcedimiento, comandos: e.target.value })}
                style={{ width: '100%', marginBottom: 12, padding: 12, borderRadius: 4, border: '1px solid #ccc', minHeight: 80 }}
              />
              <textarea
                placeholder="Notas adicionales"
                value={nuevoProcedimiento.notas}
                onChange={e => setNuevoProcedimiento({ ...nuevoProcedimiento, notas: e.target.value })}
                style={{ width: '100%', marginBottom: 12, padding: 12, borderRadius: 4, border: '1px solid #ccc', minHeight: 80 }}
              />
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <select
                  value={nuevoProcedimiento.dificultad}
                  onChange={e => setNuevoProcedimiento({ ...nuevoProcedimiento, dificultad: e.target.value })}
                  style={{ flex: 1, padding: 12, borderRadius: 4, border: '1px solid #ccc' }}
                >
                  <option value="Fácil">Fácil</option>
                  <option value="Intermedio">Intermedio</option>
                  <option value="Avanzado">Avanzado</option>
                </select>
                <input
                  type="text"
                  placeholder="Tiempo estimado (ej: 5-10 min)"
                  value={nuevoProcedimiento.tiempo_estimado}
                  onChange={e => setNuevoProcedimiento({ ...nuevoProcedimiento, tiempo_estimado: e.target.value })}
                  style={{ flex: 1, padding: 12, borderRadius: 4, border: '1px solid #ccc' }}
                />
              </div>
              
              {/* Campo para archivos PDF */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 8, color: '#2e7d32', fontWeight: 'bold' }}>
                  📎 Archivos PDF de soporte (opcional)
                </label>
                <input 
                  type="file" 
                  multiple 
                  accept=".pdf"
                  onChange={e => setArchivosProcedimiento(Array.from(e.target.files))} 
                  style={{ 
                    width: '100%', 
                    padding: 8, 
                    borderRadius: 4, 
                    border: '1px solid #ccc',
                    backgroundColor: '#f9f9f9'
                  }} 
                />
                {archivosProcedimiento.length > 0 && (
                  <div style={{ marginTop: 8, fontSize: '0.9em', color: '#2e7d32' }}>
                    📁 {archivosProcedimiento.length} archivo(s) PDF seleccionado(s)
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button type="submit" variant="contained" color="primary">
                  {editandoProcedimiento ? 'Actualizar' : 'Crear'}
                </Button>
                <Button variant="outlined" color="error" onClick={() => {
                  setModalProcedimiento(false);
                  setArchivosProcedimiento([]);
                }}>
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mensaje de estado */}
      {mensaje && (
        <div style={{ 
          position: 'fixed', 
          top: 20, 
          right: 20, 
          padding: '12px 20px', 
          backgroundColor: '#4caf50', 
          color: '#fff', 
          borderRadius: 4, 
          zIndex: 1001,
          animation: 'slideIn 0.3s ease'
        }}>
          {mensaje}
        </div>
      )}
    </Box>
  );
}