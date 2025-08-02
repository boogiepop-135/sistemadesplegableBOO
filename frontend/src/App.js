import React, { useState, useEffect } from 'react';
import { FaLeaf, FaTasks, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';
import './App.css';
import { InventarioList, TicketsList, AdminPanel, DocumentosPanel, BitacorasPanel, TrabajosAdminPanel, MantenimientosPanel, PropuestasMejoraPanel, SoportePanel } from './components/Paneles';
import TodoList from './components/TodoList';
import KanbanBoard from './components/KanbanBoard';
import { API_URL } from './config';

// Componente de navegación optimizado con hamburger menu mejorado
function Navbar({ onLogout, onSelect, selected, isAdmin, rol, nombrePerfil }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { id: 'trabajos', label: isAdmin ? 'Trabajos' : 'Trabajos (solo vista)', show: true, mobile: true, icon: '💼' },
    { id: 'inventario', label: 'Inventario', show: true, mobile: true, icon: '📦' },
    { id: 'mantenimientos', label: 'Mantenimientos', show: true, mobile: true, icon: '🔧' },
    { id: 'propuestas', label: 'Propuestas', show: true, mobile: true, icon: '💡' },
    { id: 'soporte', label: 'Soporte', show: true, mobile: true, icon: '🆘' },
    { id: 'tickets', label: 'Tickets', show: true, mobile: true, icon: '🎫' },
    { id: 'todos', label: 'Tareas', show: true, icon: <FaTasks />, mobile: true },
    { id: 'kanban', label: 'Kanban', show: true, mobile: true, icon: '📋' },
    { id: 'usuarios', label: 'Usuarios', show: isAdmin, mobile: false, icon: '👥' },
    { id: 'documentos', label: 'Documentos', show: isAdmin, mobile: false, icon: '📄' },
    { id: 'bitacoras', label: 'Bitácoras', show: isAdmin, mobile: false, icon: '📝' }
  ];

  const desktopItems = navItems.filter(item => item.show);
  const mobileItems = navItems.filter(item => item.show && item.mobile);

  const handleNavClick = (itemId) => {
    onSelect(itemId);
    setIsMenuOpen(false);
  };

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest('.mobile-menu-container')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  // Cerrar menú con ESC
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isMenuOpen]);

  return (
    <header className="navbar">
      {/* Brand Section */}
      <div className="navbar-brand">
        <FaLeaf className="brand-icon" />
        <span className="brand-text">IT-SanCosme</span>
      </div>

      {/* Desktop Navigation - Centered */}
      <nav className="navbar-nav desktop-nav">
        <div className="nav-links-container">
          {desktopItems.map(item => (
            <a 
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                onSelect(item.id);
              }}
              className={`nav-link ${selected === item.id ? 'active' : ''}`}
              title={item.label}
            >
              {item.icon && <span className="nav-icon">{item.icon}</span>}
              <span className="nav-label">{item.label}</span>
            </a>
          ))}
        </div>
      </nav>

      {/* User Section */}
      <div className="navbar-user">
        <div className="user-info">
          <span className="user-role" title={`Rol: ${rol === 'admin' ? 'Administrador' : 'Usuario'}`}>
            {rol === 'admin' ? 'ADMIN' : 'USUARIO'}
          </span>
          <span className="user-name" title={nombrePerfil || 'Usuario'}>
            {nombrePerfil || 'Usuario'}
          </span>
        </div>
        <button 
          onClick={onLogout} 
          title="Cerrar sesión" 
          className="logout-button"
          aria-label="Cerrar sesión"
        >
          <FaSignOutAlt />
        </button>
      </div>

      {/* Mobile Hamburger Menu */}
      <div className="mobile-menu-container">
        <button 
          className="hamburger-button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        {isMenuOpen && (
          <nav className="mobile-nav" role="navigation" aria-label="Menú de navegación móvil">
            <div className="mobile-nav-header">
              <span className="mobile-nav-title">Menú</span>
              <span className="mobile-nav-subtitle">IT-SanCosme</span>
            </div>
            {mobileItems.map(item => (
              <a 
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.id);
                }}
                className={`mobile-nav-link ${selected === item.id ? 'active' : ''}`}
                title={item.label}
              >
                {item.icon && <span className="nav-icon">{item.icon}</span>}
                <span className="nav-label">{item.label}</span>
              </a>
            ))}
            <div className="mobile-nav-footer">
              <span className="mobile-user-info">
                {nombrePerfil || 'Usuario'} • {rol === 'admin' ? 'ADMIN' : 'USUARIO'}
              </span>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}

// Componente de login optimizado
function Login({ onLogin }) {
  const [formData, setFormData] = useState({ usuario: '', contrasena: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { usuario, contrasena } = formData;
    
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
        const userData = {
          id: data.usuario_id || data.id,
          nombre: data.usuario,
          rol: data.rol,
          nombre_perfil: data.nombre_perfil
        };
        onLogin(userData);
        localStorage.setItem('token', data.token);
      } else {
        setError(data.error || 'Credenciales incorrectas');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    }
  };

  return (
    <main className="login-container animate-fade-in">
      <h2>Iniciar sesión</h2>
      <form onSubmit={handleSubmit} className="login-form">
        <input
          type="text"
          name="usuario"
          placeholder="Usuario"
          value={formData.usuario}
          onChange={handleChange}
        />
        <input
          type="password"
          name="contrasena"
          placeholder="Contraseña"
          value={formData.contrasena}
          onChange={handleChange}
        />
        <button type="submit">Entrar</button>
        {error && <span className="error">{error}</span>}
      </form>
    </main>
  );
}

// Componente de contenido principal optimizado
function MainContent({ panel, rol, usuarioLogueado, showWelcome, nombrePerfil }) {
  const panelComponents = {
    trabajos: <TrabajosAdminPanel admin={rol === 'admin'} />,
    inventario: <InventarioList admin={rol === 'admin'} usuario={usuarioLogueado} />,
    tickets: <TicketsList admin={rol === 'admin'} usuario={usuarioLogueado} />,
    todos: <TodoList />,
    kanban: <KanbanBoard />,
    usuarios: <AdminPanel admin={rol === 'admin'} />,
    documentos: <DocumentosPanel admin={rol === 'admin'} />,
    bitacoras: <BitacorasPanel admin={rol === 'admin'} />,
    mantenimientos: <MantenimientosPanel admin={rol === 'admin'} />,
    propuestas: <PropuestasMejoraPanel admin={rol === 'admin'} usuario={usuarioLogueado} />,
    soporte: <SoportePanel admin={rol === 'admin'} usuario={usuarioLogueado} />
  };

  return (
    <main className="App animate-fade-in">
      {showWelcome && (
        <section className="welcome-message">
          ¡Bienvenido, {nombrePerfil || usuarioLogueado.nombre}! 
          <span className="role-indicator">
            [{rol === 'admin' ? 'ADMIN' : 'USUARIO'}]
          </span>
          <br/>
          Has iniciado sesión correctamente.
        </section>
      )}
      
      <section className="content-panel">
        {panelComponents[panel]}
      </section>
    </main>
  );
}

// Footer optimizado
function Footer() {
  return (
    <footer className="Footer">
      <span>
        Hecho con <span className="heart">♥</span> por Boogiepop135 | 
        <a href="mailto:sistemas@sancosmeorg.com">Contacto</a>
      </span>
    </footer>
  );
}

// Componente principal optimizado
function App() {
  const [usuarioLogueado, setUsuarioLogueado] = useState(() => {
    const stored = localStorage.getItem('usuarioLogueado');
    return stored ? JSON.parse(stored) : null;
  });
  const [rol, setRol] = useState(() => localStorage.getItem('rol'));
  const [nombrePerfil, setNombrePerfil] = useState(() => localStorage.getItem('nombrePerfil'));
  const [panel, setPanel] = useState('inventario');
  const [showWelcome, setShowWelcome] = useState(() => {
    const flag = localStorage.getItem('showWelcome');
    return flag !== 'false';
  });

  const handleLogin = (userData) => {
    setUsuarioLogueado(userData);
    setRol(userData.rol);
    setNombrePerfil(userData.nombre_perfil);
    localStorage.setItem('usuarioLogueado', JSON.stringify(userData));
    localStorage.setItem('rol', userData.rol);
    localStorage.setItem('nombrePerfil', userData.nombre_perfil);
  };

  const handleLogout = () => {
    setUsuarioLogueado(null);
    setRol(null);
    setNombrePerfil(null);
    setPanel('inventario');
    localStorage.removeItem('usuarioLogueado');
    localStorage.removeItem('rol');
    localStorage.removeItem('nombrePerfil');
    localStorage.removeItem('lastActivity');
  };

  // Efectos optimizados
  useEffect(() => {
    const updateActivity = () => {
      localStorage.setItem('lastActivity', Date.now());
    };
    
    const events = ['mousemove', 'keydown'];
    events.forEach(event => window.addEventListener(event, updateActivity));
    
    return () => {
      events.forEach(event => window.removeEventListener(event, updateActivity));
    };
  }, []);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const last = parseInt(localStorage.getItem('lastActivity') || Date.now(), 10);
      if (usuarioLogueado && Date.now() - last > 2 * 60 * 60 * 1000) {
        handleLogout();
        alert('Sesión cerrada por inactividad.');
      }
    }, 60000);
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
      {showWelcome && <h1>IT-SanCosme</h1>}
      
      <Navbar 
        onLogout={handleLogout} 
        onSelect={setPanel} 
        selected={panel} 
        isAdmin={rol === 'admin'} 
        rol={rol}
        nombrePerfil={nombrePerfil}
      />
      
      {!usuarioLogueado ? (
        <Login onLogin={(userData) => {
          handleLogin(userData);
          localStorage.setItem('showWelcome', 'true');
        }} />
      ) : (
        <MainContent 
          panel={panel}
          rol={rol}
          usuarioLogueado={usuarioLogueado}
          showWelcome={showWelcome}
          nombrePerfil={nombrePerfil}
        />
      )}
      
      <Footer />
    </>
  );
}

export function getToken() {
  return localStorage.getItem('token');
}

export default App;
