from flask import Blueprint, request, jsonify
from app.models.usuario import Usuario
from app import db
from flask_cors import CORS
import jwt
import datetime
from flask import current_app
from functools import wraps

usuarios_bp = Blueprint('usuarios', __name__)
CORS(usuarios_bp, origins=["http://localhost:3000"], supports_credentials=True)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        if not token:
            return jsonify({'success': False, 'error': 'Token requerido'}), 401
        try:
            secret = current_app.config.get('SECRET_KEY', 'supersecreto')
            data = jwt.decode(token, secret, algorithms=['HS256'])
            request.usuario_jwt = data
        except Exception as e:
            return jsonify({'success': False, 'error': 'Token inválido: ' + str(e)}), 401
        return f(*args, **kwargs)
    return decorated

@usuarios_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No se recibió JSON'}), 400
        nombre = data.get('usuario')
        contrasena = data.get('contrasena')
        if not nombre or not contrasena:
            return jsonify({'success': False, 'error': 'Faltan usuario o contraseña'}), 400
        usuario = Usuario.query.filter_by(nombre=nombre).first()
        if usuario and usuario.check_password(contrasena):
            # Generar JWT
            payload = {
                'usuario_id': usuario.id,
                'nombre': usuario.nombre,
                'rol': usuario.rol,
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=8)
            }
            secret = current_app.config.get('SECRET_KEY', 'supersecreto')
            token = jwt.encode(payload, secret, algorithm='HS256')
            if isinstance(token, bytes):
                token = token.decode('utf-8')
            return jsonify({'success': True, 'usuario': usuario.nombre, 'rol': usuario.rol, 'token': token})
        return jsonify({'success': False, 'error': 'Credenciales incorrectas'}), 401
    except Exception as e:
        return jsonify({'success': False, 'error': 'Error interno: ' + str(e)}), 500

@usuarios_bp.route('/crear', methods=['POST'])
def crear_usuario():
    data = request.get_json()
    nombre = data.get('usuario')
    contrasena = data.get('contrasena')
    rol = data.get('rol', 'usuario')
    if not nombre or not contrasena:
        return jsonify({'error': 'Faltan datos'}), 400
    if Usuario.query.filter_by(nombre=nombre).first():
        return jsonify({'error': 'Usuario ya existe'}), 400
    nuevo = Usuario(nombre=nombre, rol=rol)
    nuevo.set_password(contrasena)
    db.session.add(nuevo)
    db.session.commit()
    return jsonify({'success': True, 'usuario': nuevo.nombre})

@usuarios_bp.route('/<int:usuario_id>', methods=['PUT'])
def editar_usuario(usuario_id):
    data = request.get_json()
    usuario = Usuario.query.get(usuario_id)
    if not usuario:
        return jsonify({'error': 'Usuario no encontrado'}), 404
    usuario.nombre = data.get('usuario', usuario.nombre)
    usuario.contrasena = data.get('contrasena', usuario.contrasena)
    usuario.rol = data.get('rol', usuario.rol)
    db.session.commit()
    return jsonify({'success': True, 'usuario': usuario.to_dict()})

@usuarios_bp.route('/<int:usuario_id>', methods=['DELETE'])
def eliminar_usuario(usuario_id):
    usuario = Usuario.query.get(usuario_id)
    if not usuario:
        return jsonify({'error': 'Usuario no encontrado'}), 404
    db.session.delete(usuario)
    db.session.commit()
    return jsonify({'success': True})

@usuarios_bp.route('/', methods=['GET'])
def listar_usuarios():
    usuarios = Usuario.query.all()
    return jsonify([u.to_dict() for u in usuarios])

# Ejemplo de uso en una ruta protegida:
@usuarios_bp.route('/protegido', methods=['GET'])
@token_required
def ruta_protegida():
    return jsonify({'success': True, 'msg': f"Hola {request.usuario_jwt['nombre']}!"})