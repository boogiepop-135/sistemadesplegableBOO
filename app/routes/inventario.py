from flask import Blueprint, request, jsonify, send_file
from app.models.inventario import Inventario
from app import db
from flask_cors import CORS
import io
import pandas as pd

inventario_bp = Blueprint('inventario', __name__)
CORS(inventario_bp, origins=["http://localhost:3000"], supports_credentials=True)

@inventario_bp.route('/', methods=['GET'])
def listar_inventario():
    inventario = Inventario.query.all()
    return jsonify([e.to_dict() for e in inventario])

@inventario_bp.route('/', methods=['POST'])
def agregar_equipo():
    data = request.get_json()
    equipo = data.get('equipo')
    tipo = data.get('tipo')
    estado = data.get('estado', 'Disponible')
    ubicacion_id = data.get('ubicacion_id')
    usuario_id = data.get('usuario_id')
    # Validación estricta de campos obligatorios
    if not equipo:
        return jsonify({'error': 'Falta el nombre del equipo'}), 400
    if not tipo:
        return jsonify({'error': 'Falta el tipo/categoría del equipo'}), 400
    nuevo = Inventario(equipo=equipo, tipo=tipo, estado=estado)
    if ubicacion_id:
        nuevo.ubicacion_id = ubicacion_id
    if usuario_id:
        nuevo.usuario_id = usuario_id
    db.session.add(nuevo)
    db.session.commit()
    return jsonify(nuevo.to_dict()), 201

@inventario_bp.route('/<int:equipo_id>', methods=['PUT'])
def editar_equipo(equipo_id):
    data = request.get_json()
    equipo = Inventario.query.get(equipo_id)
    if not equipo:
        return jsonify({'error': 'Equipo no encontrado'}), 404
    equipo.equipo = data.get('equipo', equipo.equipo)
    equipo.estado = data.get('estado', equipo.estado)
    ubicacion_id = data.get('ubicacion_id')
    usuario_id = data.get('usuario_id')
    if ubicacion_id is not None:
        equipo.ubicacion_id = ubicacion_id
    if usuario_id is not None:
        equipo.usuario_id = usuario_id
    db.session.commit()
    return jsonify(equipo.to_dict())

@inventario_bp.route('/<int:equipo_id>', methods=['DELETE'])
def eliminar_equipo(equipo_id):
    equipo = Inventario.query.get(equipo_id)
    if not equipo:
        return jsonify({'error': 'Equipo no encontrado'}), 404
    db.session.delete(equipo)
    db.session.commit()
    return jsonify({'success': True})

@inventario_bp.route('/<int:equipo_id>/asignar', methods=['POST'])
def asignar_equipo(equipo_id):
    data = request.get_json()
    usuario_id = data.get('usuario_id')
    ubicacion_id = data.get('ubicacion_id')
    equipo = Inventario.query.get(equipo_id)
    if not equipo:
        return jsonify({'error': 'Equipo no encontrado'}), 404
    if usuario_id:
        equipo.usuario_id = usuario_id
        equipo.estado = 'Asignado'
    else:
        equipo.usuario_id = None
        equipo.estado = 'Disponible'
    if ubicacion_id is not None:
        equipo.ubicacion_id = ubicacion_id
    db.session.commit()
    return jsonify(equipo.to_dict())

@inventario_bp.route('/exportar', methods=['GET'])
def exportar_inventario():
    # Filtros opcionales por query params
    tipo = request.args.get('tipo')
    estado = request.args.get('estado')
    ubicacion_id = request.args.get('ubicacion_id')
    usuario_id = request.args.get('usuario_id')
    query = Inventario.query
    if tipo:
        query = query.filter_by(tipo=tipo)
    if estado:
        query = query.filter_by(estado=estado)
    if ubicacion_id:
        query = query.filter_by(ubicacion_id=ubicacion_id)
    if usuario_id:
        query = query.filter_by(usuario_id=usuario_id)
    inventario = query.all()
    data = [e.to_dict() for e in inventario]
    df = pd.DataFrame(data)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        df.to_excel(writer, index=False, sheet_name='Inventario')
    output.seek(0)
    return send_file(output, download_name=f'inventario_{pd.Timestamp.now().strftime("%Y%m%d_%H%M%S")}.xlsx', as_attachment=True)