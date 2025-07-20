from flask import Blueprint, request, jsonify
from app.models.trabajo import Trabajo, TrabajoRelacion
from app import db
from flask_cors import CORS

trabajos_bp = Blueprint('trabajos', __name__)
CORS(trabajos_bp, origins=[
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "https://web-production-21f2a.up.railway.app",
    "https://soporteches.online",
    "https://sistemadesplegableboo-production.up.railway.app"
], supports_credentials=True)

@trabajos_bp.route('/', methods=['GET', 'OPTIONS'])
def listar_trabajos():
    if request.method == 'OPTIONS':
        return '', 200
    trabajos = Trabajo.query.all()
    return jsonify([t.to_dict() for t in trabajos])

@trabajos_bp.route('/', methods=['POST'])
def crear_trabajo():
    data = request.get_json()
    titulo = data.get('titulo')
    descripcion = data.get('descripcion')
    estado = data.get('estado', 'pendiente')
    responsable_id = data.get('responsable_id')
    notas = data.get('notas')
    trabajo = Trabajo(
        titulo=titulo,
        descripcion=descripcion,
        estado=estado,
        responsable_id=responsable_id,
        notas=notas
    )
    db.session.add(trabajo)
    db.session.commit()
    return jsonify(trabajo.to_dict()), 201

@trabajos_bp.route('/<int:trabajo_id>', methods=['PUT'])
def actualizar_trabajo(trabajo_id):
    trabajo = Trabajo.query.get(trabajo_id)
    if not trabajo:
        return jsonify({'error': 'Trabajo no encontrado'}), 404
    data = request.get_json()
    trabajo.titulo = data.get('titulo', trabajo.titulo)
    trabajo.descripcion = data.get('descripcion', trabajo.descripcion)
    trabajo.estado = data.get('estado', trabajo.estado)
    trabajo.responsable_id = data.get('responsable_id', trabajo.responsable_id)
    trabajo.notas = data.get('notas', trabajo.notas)
    db.session.commit()
    return jsonify(trabajo.to_dict())

@trabajos_bp.route('/<int:trabajo_id>', methods=['DELETE'])
def eliminar_trabajo(trabajo_id):
    trabajo = Trabajo.query.get(trabajo_id)
    if not trabajo:
        return jsonify({'error': 'Trabajo no encontrado'}), 404
    db.session.delete(trabajo)
    db.session.commit()
    return jsonify({'success': True})

@trabajos_bp.route('/<int:trabajo_id>/asociar', methods=['POST'])
def asociar_entidades_trabajo(trabajo_id):
    trabajo = Trabajo.query.get(trabajo_id)
    if not trabajo:
        return jsonify({'error': 'Trabajo no encontrado'}), 404
    data = request.get_json()
    entidades = data.get('entidades', [])  # [{'tipo': 'ticket', 'codigo': '...'}, ...]
    for entidad in entidades:
        tipo = entidad.get('tipo')
        codigo = entidad.get('codigo')
        if tipo and codigo:
            # Evitar duplicados
            existe = any(r.entidad_tipo == tipo and r.entidad_codigo == codigo for r in trabajo.relaciones)
            if not existe:
                relacion = TrabajoRelacion(trabajo_id=trabajo.id, entidad_tipo=tipo, entidad_codigo=codigo)
                db.session.add(relacion)
    db.session.commit()
    return jsonify(trabajo.to_dict())
