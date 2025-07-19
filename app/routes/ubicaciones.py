from flask import Blueprint, request, jsonify
from app.models.ubicacion import Ubicacion
from app import db
from flask_cors import CORS

ubicaciones_bp = Blueprint('ubicaciones', __name__)
CORS(ubicaciones_bp, origins=["http://localhost:3000"], supports_credentials=True)

@ubicaciones_bp.route('/', methods=['GET', 'OPTIONS'])
def listar_ubicaciones():
    if request.method == 'OPTIONS':
        return '', 200
    ubicaciones = Ubicacion.query.all()
    return jsonify([u.to_dict() for u in ubicaciones])

@ubicaciones_bp.route('/', methods=['POST'])
def crear_ubicacion():
    data = request.get_json()
    nombre = data.get('nombre')
    descripcion = data.get('descripcion')
    if not nombre:
        return jsonify({'error': 'Falta el nombre'}), 400
    if Ubicacion.query.filter_by(nombre=nombre).first():
        return jsonify({'error': 'Ubicación ya existe'}), 400
    nueva = Ubicacion(nombre=nombre, descripcion=descripcion)
    db.session.add(nueva)
    db.session.commit()
    return jsonify(nueva.to_dict()), 201

@ubicaciones_bp.route('/<int:ubicacion_id>', methods=['PUT'])
def editar_ubicacion(ubicacion_id):
    data = request.get_json()
    ubicacion = Ubicacion.query.get(ubicacion_id)
    if not ubicacion:
        return jsonify({'error': 'Ubicación no encontrada'}), 404
    ubicacion.nombre = data.get('nombre', ubicacion.nombre)
    ubicacion.descripcion = data.get('descripcion', ubicacion.descripcion)
    db.session.commit()
    return jsonify(ubicacion.to_dict())

@ubicaciones_bp.route('/<int:ubicacion_id>', methods=['DELETE'])
def eliminar_ubicacion(ubicacion_id):
    ubicacion = Ubicacion.query.get(ubicacion_id)
    if not ubicacion:
        return jsonify({'error': 'Ubicación no encontrada'}), 404
    db.session.delete(ubicacion)
    db.session.commit()
    return jsonify({'success': True})
