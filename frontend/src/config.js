// Configuración centralizada para las URLs de la API
export const API_URL = "https://sistemadesplegableboo-production.up.railway.app";

// URLs específicas para diferentes entornos
export const CONFIG = {
  development: {
    API_URL: "https://sistemadesplegableboo-production.up.railway.app", // Usar HTTPS incluso en desarrollo
  },
  production: {
    API_URL: "https://sistemadesplegableboo-production.up.railway.app",
  }
};

// Función para obtener la URL correcta según el entorno
export const getApiUrl = () => {
  // Siempre usar HTTPS para evitar problemas de Mixed Content
  return "https://sistemadesplegableboo-production.up.railway.app";
}; 