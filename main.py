import os
from app import db
from flask import Flask, request, jsonify
from app.routes.usuarios import usuarios_bp
from app.routes.inventario import inventario_bp
from app.routes.avisos import avisos_bp
from app.routes.tickets import tickets_bp
from app.routes.documentos import documentos_bp
from app.routes.bitacoras import bitacoras_bp
from app.routes.trabajos import trabajos_bp
from app.routes.ubicaciones import ubicaciones_bp
from app.routes.categorias import categorias_bp
from app.routes.propuestas import propuestas_bp
from app.routes.soporte import soporte_bp
from flask_cors import CORS
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

app = Flask(__name__)

# Configuración de seguridad mejorada
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'cambiar_esta_clave_en_produccion')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', app.config['SECRET_KEY'])

# Configuración CORS simplificada para desarrollo y testing
CORS(app, 
     origins=["*"],  # Permitir todos los orígenes
     supports_credentials=False,  # Cambiar a False para evitar problemas
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "X-Requested-With"])

# Middleware para manejar peticiones OPTIONS globalmente
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'false')
    return response

# Configuración de base de datos
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///inventario.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Configuración de archivos
app.config['MAX_CONTENT_LENGTH'] = int(os.getenv('MAX_CONTENT_LENGTH', 16777216))  # 16MB
app.config['UPLOAD_FOLDER'] = os.getenv('UPLOAD_FOLDER', 'instance/uploads')

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
app.register_blueprint(propuestas_bp, url_prefix='/propuestas')
app.register_blueprint(soporte_bp, url_prefix='/soporte')

# Importar modelos aquí para evitar ciclos de importación
from app.models import usuario, ticket, inventario, documento, bitacora_mantenimiento, trabajo, ubicacion, propuesta_mejora, soporte

@app.route('/')
def home():
    return 'Sistema de Inventario IT - Backend Flask funcionando'

# Esto asegura que las tablas se creen siempre, incluso con gunicorn
def ensure_tables():
    with app.app_context():
        db.create_all()
ensure_tables()

if __name__ == '__main__':
    debug_mode = os.getenv('FLASK_ENV') == 'development'
    app.run(debug=debug_mode, host='0.0.0.0')