from app import db
from flask import Flask
from app.routes.usuarios import usuarios_bp
from app.routes.inventario import inventario_bp
from app.routes.avisos import avisos_bp
from app.routes.tickets import tickets_bp
from app.routes.documentos import documentos_bp
from app.routes.bitacoras import bitacoras_bp
from app.routes.trabajos import trabajos_bp
from app.routes.ubicaciones import ubicaciones_bp
from app.routes.categorias import categorias_bp
from flask_cors import CORS

app = Flask(__name__)
app.config['SECRET_KEY'] = 'supersecreto'  # Usa una clave fuerte en producción

# Configuración CORS actualizada para incluir Netlify y el dominio temporal
CORS(app, resources={r"/*": {"origins": [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "https://web-production-21f2a.up.railway.app",
    "https://soporteches.online",
    "https://api.soporteches.online",
    "https://sistemadesplegableboo-production.up.railway.app",
    # Agregar dominios de Netlify
    "https://*.netlify.app",
    "https://*.netlify.com",
    # Si tienes un dominio personalizado en Netlify, agrégalo aquí
]}}, supports_credentials=True)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///inventario.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

# Registrar blueprints
app.register_blueprint(usuarios_bp, url_prefix='/usuarios')
app.register_blueprint(inventario_bp, url_prefix='/inventario')
app.register_blueprint(avisos_bp, url_prefix='/avisos')
app.register_blueprint(tickets_bp, url_prefix='/tickets')
app.register_blueprint(documentos_bp, url_prefix='/documentos')
app.register_blueprint(bitacoras_bp, url_prefix='/bitacoras')
app.register_blueprint(trabajos_bp, url_prefix='/trabajos')
app.register_blueprint(ubicaciones_bp, url_prefix='/ubicaciones')
app.register_blueprint(categorias_bp, url_prefix='/categorias')

# Importar modelos aquí para evitar ciclos de importación
from app.models import usuario, ticket, inventario, documento, bitacora_mantenimiento, trabajo, ubicacion

@app.route('/')
def home():
    return 'Sistema de Inventario IT - Backend Flask funcionando'

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0')