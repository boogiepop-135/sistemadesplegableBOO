// Configuración centralizada para las URLs de la API
export const API_URL = "https://api.soporteches.online";

// URLs específicas para diferentes entornos
export const CONFIG = {
  development: {
    API_URL: "http://localhost:5000",
  },
  production: {
    API_URL: "https://api.soporteches.online",
  }
};

// Función para obtener la URL correcta según el entorno
export const getApiUrl = () => {
  if (process.env.NODE_ENV === 'development') {
    return CONFIG.development.API_URL;
  }
  return CONFIG.production.API_URL;
}; 