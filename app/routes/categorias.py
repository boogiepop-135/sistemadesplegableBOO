from flask import Blueprint, request, jsonify
from app.models.categoria import Categoria
from app import db
from flask_cors import CORS

categorias_bp = Blueprint('categorias', __name__)
CORS(categorias_bp, origins=["http://localhost:3000"], supports_credentials=True)

@categorias_bp.route('/', methods=['GET', 'OPTIONS'])
def listar_categorias():
    if request.method == 'OPTIONS':
        return '', 200
    categorias = Categoria.query.all()
    return jsonify([c.to_dict() for c in categorias])

@categorias_bp.route('/', methods=['POST'])
def crear_categoria():
    data = request.get_json()
    nombre = data.get('nombre')
    if not nombre:
        return jsonify({'error': 'Falta el nombre'}), 400
    if Categoria.query.filter_by(nombre=nombre).first():
        return jsonify({'error': 'Categoría ya existe'}), 400
    nueva = Categoria(nombre=nombre)
    db.session.add(nueva)
    db.session.commit()
    return jsonify(nueva.to_dict()), 201

@categorias_bp.route('/<int:categoria_id>', methods=['PUT'])
def editar_categoria(categoria_id):
    data = request.get_json()
    categoria = Categoria.query.get(categoria_id)
    if not categoria:
        return jsonify({'error': 'Categoría no encontrada'}), 404
    categoria.nombre = data.get('nombre', categoria.nombre)
    db.session.commit()
    return jsonify(categoria.to_dict())

@categorias_bp.route('/<int:categoria_id>', methods=['DELETE'])
def eliminar_categoria(categoria_id):
    categoria = Categoria.query.get(categoria_id)
    if not categoria:
        return jsonify({'error': 'Categoría no encontrada'}), 404
    db.session.delete(categoria)
    db.session.commit()
    return jsonify({'success': True})
