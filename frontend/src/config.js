// Configuración centralizada para las URLs de la API
const getApiUrl = () => {
  // Usar variable de entorno si está disponible, sino usar la URL por defecto
  return process.env.REACT_APP_API_URL || "https://sistemadesplegableboo-production.up.railway.app";
};

export const API_URL = getApiUrl();

// URLs específicas para diferentes entornos
export const CONFIG = {
  development: {
    API_URL: process.env.REACT_APP_API_URL || "https://sistemadesplegableboo-production.up.railway.app",
  },
  production: {
    API_URL: process.env.REACT_APP_API_URL || "https://sistemadesplegableboo-production.up.railway.app",
  }
}; 