from flask import Blueprint, request, jsonify
from app import db
from app.models.soporte import TemaSoporte, ProcedimientoSoporte
from app.models.usuario import Usuario
from app.routes.usuarios import token_required
from datetime import datetime
import uuid

soporte_bp = Blueprint('soporte', __name__)

# ===== RUTAS PARA TEMAS =====

@soporte_bp.route('/temas/', methods=['GET'])
@token_required
def listar_temas():
    """Listar todos los temas de soporte activos"""
    try:
        temas = TemaSoporte.query.filter_by(activo=True).order_by(TemaSoporte.nombre).all()
        return jsonify([{
            'id': tema.id,
            'nombre': tema.nombre,
            'descripcion': tema.descripcion,
            'categoria': tema.categoria,
            'color': tema.color,
            'fecha_creacion': tema.fecha_creacion.strftime('%Y-%m-%d %H:%M:%S'),
            'codigo_unico': tema.codigo_unico,
            'procedimientos_count': len(tema.procedimientos)
        } for tema in temas])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@soporte_bp.route('/temas/', methods=['POST'])
@token_required
def crear_tema():
    """Crear un nuevo tema de soporte"""
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        if not data.get('nombre'):
            return jsonify({'error': 'El nombre del tema es requerido'}), 400
        
        # Verificar si ya existe un tema con ese nombre
        tema_existente = TemaSoporte.query.filter_by(nombre=data['nombre']).first()
        if tema_existente:
            return jsonify({'error': 'Ya existe un tema con ese nombre'}), 400
        
        # Crear nuevo tema
        nuevo_tema = TemaSoporte(
            nombre=data['nombre'],
            descripcion=data.get('descripcion', ''),
            categoria=data.get('categoria', 'General'),
            color=data.get('color', '#2196f3')
        )
        
        db.session.add(nuevo_tema)
        db.session.commit()
        
        return jsonify({
            'id': nuevo_tema.id,
            'nombre': nuevo_tema.nombre,
            'descripcion': nuevo_tema.descripcion,
            'categoria': nuevo_tema.categoria,
            'color': nuevo_tema.color,
            'fecha_creacion': nuevo_tema.fecha_creacion.strftime('%Y-%m-%d %H:%M:%S'),
            'codigo_unico': nuevo_tema.codigo_unico,
            'success': True
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@soporte_bp.route('/temas/<int:tema_id>', methods=['PUT'])
@token_required
def actualizar_tema(tema_id):
    """Actualizar un tema de soporte"""
    try:
        tema = TemaSoporte.query.get_or_404(tema_id)
        data = request.get_json()
        
        # Verificar si el nuevo nombre ya existe en otro tema
        if 'nombre' in data and data['nombre'] != tema.nombre:
            tema_existente = TemaSoporte.query.filter_by(nombre=data['nombre']).first()
            if tema_existente:
                return jsonify({'error': 'Ya existe un tema con ese nombre'}), 400
        
        # Actualizar campos
        if 'nombre' in data:
            tema.nombre = data['nombre']
        if 'descripcion' in data:
            tema.descripcion = data['descripcion']
        if 'categoria' in data:
            tema.categoria = data['categoria']
        if 'color' in data:
            tema.color = data['color']
        
        db.session.commit()
        
        return jsonify({
            'id': tema.id,
            'nombre': tema.nombre,
            'descripcion': tema.descripcion,
            'categoria': tema.categoria,
            'color': tema.color,
            'success': True
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@soporte_bp.route('/temas/<int:tema_id>', methods=['DELETE'])
@token_required
def eliminar_tema(tema_id):
    """Eliminar un tema de soporte (marcar como inactivo)"""
    try:
        tema = TemaSoporte.query.get_or_404(tema_id)
        tema.activo = False
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Tema eliminado correctamente'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ===== RUTAS PARA PROCEDIMIENTOS =====

@soporte_bp.route('/procedimientos/', methods=['GET'])
@token_required
def listar_procedimientos():
    """Listar todos los procedimientos de soporte"""
    try:
        tema_id = request.args.get('tema_id', type=int)
        
        query = ProcedimientoSoporte.query.filter_by(activo=True)
        if tema_id:
            query = query.filter_by(tema_id=tema_id)
        
        procedimientos = query.order_by(ProcedimientoSoporte.orden, ProcedimientoSoporte.titulo).all()
        
        return jsonify([{
            'id': proc.id,
            'titulo': proc.titulo,
            'descripcion': proc.descripcion,
            'pasos': proc.pasos,
            'comandos': proc.comandos,
            'notas': proc.notas,
            'dificultad': proc.dificultad,
            'tiempo_estimado': proc.tiempo_estimado,
            'fecha_creacion': proc.fecha_creacion.strftime('%Y-%m-%d %H:%M:%S'),
            'fecha_actualizacion': proc.fecha_actualizacion.strftime('%Y-%m-%d %H:%M:%S'),
            'orden': proc.orden,
            'codigo_unico': proc.codigo_unico,
            'tema_id': proc.tema_id,
            'tema_nombre': proc.tema.nombre,
            'usuario_creador': proc.usuario.nombre if proc.usuario else 'Sistema'
        } for proc in procedimientos])
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@soporte_bp.route('/procedimientos/', methods=['POST'])
@token_required
def crear_procedimiento():
    """Crear un nuevo procedimiento de soporte"""
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        if not data.get('titulo'):
            return jsonify({'error': 'El título del procedimiento es requerido'}), 400
        if not data.get('tema_id'):
            return jsonify({'error': 'El tema es requerido'}), 400
        
        # Verificar que el tema existe
        tema = TemaSoporte.query.get(data['tema_id'])
        if not tema:
            return jsonify({'error': 'El tema especificado no existe'}), 400
        
        # Obtener usuario actual desde el token
        usuario_actual = Usuario.query.get(request.usuario_jwt['usuario_id'])
        if not usuario_actual:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        
        # Crear nuevo procedimiento
        nuevo_procedimiento = ProcedimientoSoporte(
            titulo=data['titulo'],
            descripcion=data.get('descripcion', ''),
            pasos=data.get('pasos', ''),
            comandos=data.get('comandos', ''),
            notas=data.get('notas', ''),
            dificultad=data.get('dificultad', 'Intermedio'),
            tiempo_estimado=data.get('tiempo_estimado', ''),
            orden=data.get('orden', 0),
            tema_id=data['tema_id'],
            usuario_id=usuario_actual.id
        )
        
        db.session.add(nuevo_procedimiento)
        db.session.commit()
        
        return jsonify({
            'id': nuevo_procedimiento.id,
            'titulo': nuevo_procedimiento.titulo,
            'descripcion': nuevo_procedimiento.descripcion,
            'pasos': nuevo_procedimiento.pasos,
            'comandos': nuevo_procedimiento.comandos,
            'notas': nuevo_procedimiento.notas,
            'dificultad': nuevo_procedimiento.dificultad,
            'tiempo_estimado': nuevo_procedimiento.tiempo_estimado,
            'orden': nuevo_procedimiento.orden,
            'tema_id': nuevo_procedimiento.tema_id,
            'tema_nombre': tema.nombre,
            'usuario_creador': usuario_actual.nombre,
            'fecha_creacion': nuevo_procedimiento.fecha_creacion.strftime('%Y-%m-%d %H:%M:%S'),
            'codigo_unico': nuevo_procedimiento.codigo_unico,
            'success': True
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@soporte_bp.route('/procedimientos/<int:proc_id>', methods=['PUT'])
@token_required
def actualizar_procedimiento(proc_id):
    """Actualizar un procedimiento de soporte"""
    try:
        procedimiento = ProcedimientoSoporte.query.get_or_404(proc_id)
        data = request.get_json()
        
        # Actualizar campos
        if 'titulo' in data:
            procedimiento.titulo = data['titulo']
        if 'descripcion' in data:
            procedimiento.descripcion = data['descripcion']
        if 'pasos' in data:
            procedimiento.pasos = data['pasos']
        if 'comandos' in data:
            procedimiento.comandos = data['comandos']
        if 'notas' in data:
            procedimiento.notas = data['notas']
        if 'dificultad' in data:
            procedimiento.dificultad = data['dificultad']
        if 'tiempo_estimado' in data:
            procedimiento.tiempo_estimado = data['tiempo_estimado']
        if 'orden' in data:
            procedimiento.orden = data['orden']
        
        # Actualizar fecha de modificación
        procedimiento.fecha_actualizacion = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'id': procedimiento.id,
            'titulo': procedimiento.titulo,
            'descripcion': procedimiento.descripcion,
            'pasos': procedimiento.pasos,
            'comandos': procedimiento.comandos,
            'notas': procedimiento.notas,
            'dificultad': procedimiento.dificultad,
            'tiempo_estimado': procedimiento.tiempo_estimado,
            'orden': procedimiento.orden,
            'fecha_actualizacion': procedimiento.fecha_actualizacion.strftime('%Y-%m-%d %H:%M:%S'),
            'success': True
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@soporte_bp.route('/procedimientos/<int:proc_id>', methods=['DELETE'])
@token_required
def eliminar_procedimiento(proc_id):
    """Eliminar un procedimiento de soporte (marcar como inactivo)"""
    try:
        procedimiento = ProcedimientoSoporte.query.get_or_404(proc_id)
        procedimiento.activo = False
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Procedimiento eliminado correctamente'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ===== RUTAS ADICIONALES =====

@soporte_bp.route('/categorias/', methods=['GET'])
@token_required
def listar_categorias():
    """Listar todas las categorías de temas disponibles"""
    try:
        categorias = db.session.query(TemaSoporte.categoria).distinct().filter_by(activo=True).all()
        return jsonify([cat[0] for cat in categorias if cat[0]])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@soporte_bp.route('/buscar/', methods=['GET'])
@token_required
def buscar_soporte():
    """Buscar temas y procedimientos por texto"""
    try:
        query = request.args.get('q', '').strip()
        if not query:
            return jsonify([])
        
        # Buscar en temas
        temas = TemaSoporte.query.filter(
            TemaSoporte.activo == True,
            (TemaSoporte.nombre.ilike(f'%{query}%') | 
             TemaSoporte.descripcion.ilike(f'%{query}%'))
        ).all()
        
        # Buscar en procedimientos
        procedimientos = ProcedimientoSoporte.query.filter(
            ProcedimientoSoporte.activo == True,
            (ProcedimientoSoporte.titulo.ilike(f'%{query}%') | 
             ProcedimientoSoporte.descripcion.ilike(f'%{query}%') |
             ProcedimientoSoporte.pasos.ilike(f'%{query}%'))
        ).all()
        
        resultados = []
        
        # Agregar temas encontrados
        for tema in temas:
            resultados.append({
                'tipo': 'tema',
                'id': tema.id,
                'titulo': tema.nombre,
                'descripcion': tema.descripcion,
                'categoria': tema.categoria,
                'color': tema.color
            })
        
        # Agregar procedimientos encontrados
        for proc in procedimientos:
            resultados.append({
                'tipo': 'procedimiento',
                'id': proc.id,
                'titulo': proc.titulo,
                'descripcion': proc.descripcion,
                'tema_nombre': proc.tema.nombre,
                'dificultad': proc.dificultad,
                'tema_id': proc.tema_id
            })
        
        return jsonify(resultados)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500 