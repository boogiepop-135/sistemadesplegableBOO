from flask import Blueprint, request, jsonify
from app.models.usuario import Usuario
from app import db
import jwt
import datetime
from flask import current_app
from functools import wraps
import sys
import logging
import traceback
from flask_cors import CORS

usuarios_bp = Blueprint('usuarios', __name__)

# CORS configurado globalmente en main.py

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
            # logging.debug(f'TOKEN TYPE: {type(token)}')
            if hasattr(token, 'decode'):
                token = token.decode('utf-8')
            return jsonify({'success': True, 'usuario': usuario.nombre, 'rol': usuario.rol, 'token': token})
        return jsonify({'success': False, 'error': 'Credenciales incorrectas'}), 401
    except Exception as e:
        logging.error(traceback.format_exc())
        return jsonify({'success': False, 'error': f'Error interno: {str(e)}', 'traceback': traceback.format_exc()}), 500

@usuarios_bp.route('/crear', methods=['POST'])
def crear_usuario():
    data = request.get_json()
    usuario = data.get('usuario')
    contrasena = data.get('contrasena')
    rol = data.get('rol', 'usuario')
    nombre_perfil = data.get('nombre_perfil')
    if not usuario or not contrasena:
        return jsonify({'error': 'Faltan datos'}), 400
    from app.models.usuario import Usuario
    nuevo = Usuario(nombre=usuario, rol=rol, nombre_perfil=nombre_perfil)
    nuevo.set_password(contrasena)
    db.session.add(nuevo)
    db.session.commit()
    return jsonify(nuevo.to_dict()), 201

@usuarios_bp.route('/<int:usuario_id>', methods=['PUT'])
def editar_usuario(usuario_id):
    from app.models.usuario import Usuario
    usuario = Usuario.query.get(usuario_id)
    if not usuario:
        return jsonify({'error': 'Usuario no encontrado'}), 404
    data = request.get_json()
    usuario.nombre = data.get('usuario', usuario.nombre)
    usuario.rol = data.get('rol', usuario.rol)
    usuario.nombre_perfil = data.get('nombre_perfil', usuario.nombre_perfil)
    if data.get('contrasena'):
        usuario.set_password(data['contrasena'])
    db.session.commit()
    return jsonify(usuario.to_dict())

@usuarios_bp.route('/<int:usuario_id>', methods=['DELETE'])
def eliminar_usuario(usuario_id):
    usuario = Usuario.query.get(usuario_id)
    if not usuario:
        return jsonify({'error': 'Usuario no encontrado'}), 404
    db.session.delete(usuario)
    db.session.commit()
    return jsonify({'success': True})

# Permitir acceso tanto a /usuarios como a /usuarios/ para evitar redirecciones y problemas de CORS
@usuarios_bp.route('', methods=['GET'])
@usuarios_bp.route('/', methods=['GET'])
def listar_usuarios():
    usuarios = Usuario.query.all()
    return jsonify([u.to_dict() for u in usuarios])

# Ejemplo de uso en una ruta protegida:
@usuarios_bp.route('/protegido', methods=['GET'])
@token_required
def ruta_protegida():
    return jsonify({'success': True, 'msg': f"Hola {request.usuario_jwt['nombre']}!"})