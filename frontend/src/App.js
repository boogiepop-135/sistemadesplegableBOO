import React, { useState, useEffect } from 'react';
import { FaLeaf } from 'react-icons/fa';
import './App.css';
import { InventarioList, TicketsList, AvisosYDias, AdminPanel, DocumentosPanel, BitacorasPanel, DiaLabores, TrabajosAdminPanel, MantenimientosPanel, PropuestasMejoraPanel } from './components/Paneles';
import { API_URL } from './config';

function Navbar({ onLogout, onSelect, selected, isAdmin, rol }) {
  return (
    <nav>
      <span style={{ marginRight: '20px', fontWeight: 'bold', fontSize: '1.3em', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <FaLeaf style={{ color: '#43a047', fontSize: '1.3em' }} /> IT-SanCosme
      </span>
      <a href="#labores" onClick={() => onSelect('labores')} style={{ color: selected === 'labores' ? '#c8e6c9' : '#fff', marginRight: '15px' }}>Días</a>
      {isAdmin && <a href="#trabajos" onClick={() => onSelect('trabajos')} style={{ color: selected === 'trabajos' ? '#c8e6c9' : '#fff', marginRight: '15px' }}>Trabajos</a>}
      {!isAdmin && <a href="#trabajos" onClick={() => onSelect('trabajos')} style={{ color: selected === 'trabajos' ? '#c8e6c9' : '#fff', marginRight: '15px' }}>Trabajos (solo vista)</a>}
      <a href="#inventario" onClick={() => onSelect('inventario')} style={{ color: selected === 'inventario' ? '#c8e6c9' : '#fff', marginRight: '15px' }}>Inventario</a>
      <a href="#mantenimientos" onClick={() => onSelect('mantenimientos')} style={{ color: selected === 'mantenimientos' ? '#c8e6c9' : '#fff', marginRight: '15px' }}>Mantenimientos</a>
      <a href="#propuestas" onClick={() => onSelect('propuestas')} style={{ color: selected === 'propuestas' ? '#c8e6c9' : '#fff', marginRight: '15px' }}>Propuestas</a>
      <a href="#tickets" onClick={() => onSelect('tickets')} style={{ color: selected === 'tickets' ? '#c8e6c9' : '#fff', marginRight: '15px' }}>Tickets</a>
      {isAdmin && <a href="#usuarios" onClick={() => onSelect('usuarios')} style={{ color: selected === 'usuarios' ? '#c8e6c9' : '#fff', marginRight: '15px' }}>Usuarios</a>}
      {isAdmin && <a href="#avisos" onClick={() => onSelect('avisos')} style={{ color: selected === 'avisos' ? '#c8e6c9' : '#fff', marginRight: '15px' }}>Avisos & Días</a>}
      {isAdmin && <a href="#documentos" onClick={() => onSelect('documentos')} style={{ color: selected === 'documentos' ? '#c8e6c9' : '#fff', marginRight: '15px' }}>Documentos</a>}
      {isAdmin && <a href="#bitacoras" onClick={() => onSelect('bitacoras')} style={{ color: selected === 'bitacoras' ? '#c8e6c9' : '#fff', marginRight: '15px' }}>Bitácoras</a>}
      <span style={{marginLeft: 'auto', marginRight: 16, color: rol === 'admin' ? '#43a047' : '#1976d2', fontWeight: 'bold', fontSize: '1em', letterSpacing: 1}}>
        {rol === 'admin' ? 'ADMIN' : 'USUARIO'}
      </span>
      <button onClick={onLogout} style={{ float: 'right', background: '#e74c3c', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', marginLeft: 'auto' }}>Cerrar sesión</button>
    </nav>
  );
}

function Login({ onLogin }) {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!usuario || !contrasena) {
      setError('Ingresa usuario y contraseña');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/usuarios/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, contrasena })
      });
      const data = await res.json();
      if (data.success) {
        onLogin(data.usuario, data.rol);
        localStorage.setItem('token', data.token); // Guardar el token JWT
      } else {
        setError(data.error || 'Credenciales incorrectas');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    }
  };

  return (
    <div className="login-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
      <h2 style={{ textAlign: 'center' }}>Iniciar sesión</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '350px', margin: '0 auto' }}>
        <input
          type="text"
          placeholder="Usuario"
          value={usuario}
          onChange={e => setUsuario(e.target.value)}
          style={{ padding: '10px', borderRadius: '6px', border: '1px solid #a5d6a7' }}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={contrasena}
          onChange={e => setContrasena(e.target.value)}
          style={{ padding: '10px', borderRadius: '6px', border: '1px solid #a5d6a7' }}
        />
        <button type="submit" style={{ background: '#43a047', color: '#fff', border: 'none', borderRadius: '6px', padding: '10px 0', fontWeight: 'bold', cursor: 'pointer' }}>
          Entrar
        </button>
        {error && <span style={{ color: '#e74c3c', fontWeight: 'bold', textAlign: 'center' }}>{error}</span>}
      </form>
    </div>
  );
}

function Footer() {
  return (
    <footer className="Footer" style={{ position: 'fixed', left: 0, bottom: 0, width: '100vw', background: 'rgba(56,142,60,0.95)', color: '#fff', fontSize: '0.85em', textAlign: 'center', padding: '6px 0', zIndex: 1000, boxShadow: '0 -2px 8px #c8e6c9' }}>
      <span>
        Hecho con <span style={{color: '#e74c3c', fontWeight: 'bold'}}>♥</span> por Boogiepop135 | <a href="mailto:sistemas@sancosmeorg.com" style={{color: '#c8e6c9'}}>Contacto</a>
      </span>
    </footer>
  );
}

function App() {
  const [usuarioLogueado, setUsuarioLogueado] = useState(() => localStorage.getItem('usuarioLogueado'));
  const [rol, setRol] = useState(() => localStorage.getItem('rol'));
  const [panel, setPanel] = useState('inventario');
  const [showWelcome, setShowWelcome] = useState(() => {
    const flag = localStorage.getItem('showWelcome');
    return flag !== 'false';
  });

  // Guardar sesión en localStorage
  const handleLogin = (usuario, rolUsuario) => {
    setUsuarioLogueado(usuario);
    setRol(rolUsuario);
    localStorage.setItem('usuarioLogueado', usuario);
    localStorage.setItem('rol', rolUsuario);
  };

  // Limpiar sesión
  const handleLogout = () => {
    setUsuarioLogueado(null);
    setRol(null);
    setPanel('inventario');
    localStorage.removeItem('usuarioLogueado');
    localStorage.removeItem('rol');
    localStorage.removeItem('lastActivity');
  };

  // Actualizar actividad
  useEffect(() => {
    const updateActivity = () => {
      localStorage.setItem('lastActivity', Date.now());
    };
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
    };
  }, []);

  // Solicitar permisos de notificación al cargar la app
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Cerrar sesión tras 2 horas de inactividad
  useEffect(() => {
    const interval = setInterval(() => {
      const last = parseInt(localStorage.getItem('lastActivity') || Date.now(), 10);
      if (usuarioLogueado && Date.now() - last > 2 * 60 * 60 * 1000) {
        handleLogout();
        alert('Sesión cerrada por inactividad.');
      }
    }, 60000); // revisa cada minuto
    return () => clearInterval(interval);
  }, [usuarioLogueado]);

  useEffect(() => {
    if (usuarioLogueado && showWelcome) {
      const timer = setTimeout(() => {
        setShowWelcome(false);
        localStorage.setItem('showWelcome', 'false');
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [usuarioLogueado, showWelcome]);

  return (
    <>
      {/* Solo muestra el h1 la primera vez */}
      {showWelcome && <h1>IT-SanCosme</h1>}
      <Navbar onLogout={handleLogout} onSelect={setPanel} selected={panel} isAdmin={rol === 'admin'} rol={rol} />
      {!usuarioLogueado ? (
        <Login onLogin={(usuario, rolUsuario) => {
          handleLogin(usuario, rolUsuario);
          localStorage.setItem('showWelcome', 'true');
        }} />
      ) : (
        <div className="animate-fade-in" style={{ textAlign: 'center', margin: '40px 0' }}>
          {showWelcome && (
            <div style={{ marginBottom: 18, background: '#e8f5e9', borderRadius: 8, color: '#388e3c', fontWeight: 'bold', fontSize: '1.1em', boxShadow: '0 2px 8px #c8e6c9', padding: 16 }}>
              ¡Bienvenido, {usuarioLogueado}! <span style={{fontSize: '0.9em', color: rol === 'admin' ? '#43a047' : '#1976d2', marginLeft: 10}}>[{rol === 'admin' ? 'ADMIN' : 'USUARIO'}]</span><br/>
              Has iniciado sesión correctamente.
            </div>
          )}
          {panel === 'labores' && <DiaLabores />}
          {panel === 'trabajos' && <TrabajosAdminPanel admin={rol === 'admin'} />}
          {panel === 'inventario' && <InventarioList admin={rol === 'admin'} usuario={usuarioLogueado} />}
          {panel === 'tickets' && <TicketsList admin={rol === 'admin'} usuario={usuarioLogueado} />}
          {panel === 'usuarios' && <AdminPanel admin={rol === 'admin'} />}
          {panel === 'avisos' && <AvisosYDias admin={rol === 'admin'} />}
          {panel === 'documentos' && <DocumentosPanel admin={rol === 'admin'} />}
          {panel === 'bitacoras' && <BitacorasPanel admin={rol === 'admin'} />}
          {panel === 'mantenimientos' && <MantenimientosPanel admin={rol === 'admin'} />}
          {panel === 'propuestas' && <PropuestasMejoraPanel admin={rol === 'admin'} usuario={usuarioLogueado} />}
        </div>
      )}
      <Footer />
    </>
  );
}

// Añadir helper para obtener el token
export function getToken() {
  return localStorage.getItem('token');
}

export default App;
