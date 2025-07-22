from flask import Blueprint, request, jsonify, send_from_directory
from app.models.propuesta_mejora import PropuestaMejora
from app import db
from werkzeug.utils import secure_filename
import os
from datetime import datetime

PROPUESTAS_UPLOAD_FOLDER = os.path.join(os.getcwd(), 'instance', 'propuestas')
ALLOWED_EXTENSIONS = {'pdf'}

propuestas_bp = Blueprint('propuestas', __name__)

# Asegurar que el directorio de propuestas existe
if not os.path.exists(PROPUESTAS_UPLOAD_FOLDER):
    os.makedirs(PROPUESTAS_UPLOAD_FOLDER)
    print(f"DEBUG - Directorio de propuestas creado: {PROPUESTAS_UPLOAD_FOLDER}")

# Helper para validar extensiones
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Helper para generar nombre único de archivo
def generate_unique_filename(base_filename, upload_folder):
    name, ext = os.path.splitext(base_filename)
    counter = 1
    filename = base_filename
    
    while os.path.exists(os.path.join(upload_folder, filename)):
        filename = f"{name}_{counter}{ext}"
        counter += 1
    
    return filename

# Endpoint para crear propuesta
@propuestas_bp.route('/', methods=['POST'])
def crear_propuesta():
    print("DEBUG - Creando nueva propuesta")
    print(f"DEBUG - Form data: {dict(request.form)}")
    print(f"DEBUG - Files: {list(request.files.keys())}")
    
    titulo = request.form.get('titulo')
    descripcion = request.form.get('descripcion', '')
    persona_responsable = request.form.get('persona_responsable')
    prioridad = request.form.get('prioridad', 'media')
    usuario_id = request.form.get('usuario_id')
    
    if not titulo or not persona_responsable or not usuario_id:
        return jsonify({'error': 'Faltan campos requeridos'}), 400
    
    # Manejar archivo PDF si se sube
    nombre_archivo = None
    ruta_archivo = None
    
    if 'archivo' in request.files:
        archivo = request.files['archivo']
        if archivo.filename != '' and allowed_file(archivo.filename):
            base_filename = secure_filename(archivo.filename)
            filename = generate_unique_filename(base_filename, PROPUESTAS_UPLOAD_FOLDER)
            ruta = os.path.join(PROPUESTAS_UPLOAD_FOLDER, filename)
            
            print(f"DEBUG - Guardando archivo: {ruta}")
            archivo.save(ruta)
            
            if os.path.exists(ruta):
                nombre_archivo = filename
                ruta_archivo = ruta
                print(f"DEBUG - Archivo guardado exitosamente")
            else:
                print(f"DEBUG - ERROR: Archivo no se guardó")
    
    try:
        propuesta = PropuestaMejora(
            titulo=titulo,
            descripcion=descripcion,
            nombre_archivo=nombre_archivo,
            ruta_archivo=ruta_archivo,
            persona_responsable=persona_responsable,
            prioridad=prioridad,
            usuario_id=usuario_id
        )
        
        db.session.add(propuesta)
        db.session.commit()
        
        print(f"DEBUG - Propuesta creada exitosamente: {propuesta.id}")
        return jsonify({'success': True, 'propuesta': propuesta.to_dict()}), 201
        
    except Exception as e:
        print(f"DEBUG - Error al crear propuesta: {e}")
        db.session.rollback()
        # Limpiar archivo si hay error
        if ruta_archivo and os.path.exists(ruta_archivo):
            try:
                os.remove(ruta_archivo)
                print(f"DEBUG - Archivo eliminado debido a error")
            except:
                pass
        return jsonify({'error': f'Error al crear propuesta: {str(e)}'}), 500

# Endpoint para listar propuestas
@propuestas_bp.route('/', methods=['GET'])
def listar_propuestas():
    propuestas = PropuestaMejora.query.order_by(PropuestaMejora.fecha_creacion.desc()).all()
    print(f"DEBUG - Total de propuestas: {len(propuestas)}")
    return jsonify([p.to_dict() for p in propuestas])

# Endpoint para obtener una propuesta específica
@propuestas_bp.route('/<int:propuesta_id>', methods=['GET'])
def obtener_propuesta(propuesta_id):
    propuesta = PropuestaMejora.query.get(propuesta_id)
    if not propuesta:
        return jsonify({'error': 'Propuesta no encontrada'}), 404
    return jsonify(propuesta.to_dict())

# Endpoint para actualizar propuesta
@propuestas_bp.route('/<int:propuesta_id>', methods=['PUT'])
def actualizar_propuesta(propuesta_id):
    propuesta = PropuestaMejora.query.get(propuesta_id)
    if not propuesta:
        return jsonify({'error': 'Propuesta no encontrada'}), 404
    
    data = request.get_json()
    
    # Actualizar campos permitidos
    if 'titulo' in data:
        propuesta.titulo = data['titulo']
    if 'descripcion' in data:
        propuesta.descripcion = data['descripcion']
    if 'persona_responsable' in data:
        propuesta.persona_responsable = data['persona_responsable']
    if 'estado' in data:
        propuesta.estado = data['estado']
        # Actualizar fechas según el estado
        if data['estado'] == 'aprobada' and not propuesta.fecha_aprobacion:
            propuesta.fecha_aprobacion = datetime.utcnow()
        elif data['estado'] == 'implementada' and not propuesta.fecha_implementacion:
            propuesta.fecha_implementacion = datetime.utcnow()
    if 'prioridad' in data:
        propuesta.prioridad = data['prioridad']
    
    try:
        db.session.commit()
        print(f"DEBUG - Propuesta actualizada: {propuesta_id}")
        return jsonify({'success': True, 'propuesta': propuesta.to_dict()})
    except Exception as e:
        print(f"DEBUG - Error al actualizar propuesta: {e}")
        db.session.rollback()
        return jsonify({'error': f'Error al actualizar propuesta: {str(e)}'}), 500

# Endpoint para eliminar propuesta
@propuestas_bp.route('/<int:propuesta_id>', methods=['DELETE'])
def eliminar_propuesta(propuesta_id):
    propuesta = PropuestaMejora.query.get(propuesta_id)
    if not propuesta:
        return jsonify({'error': 'Propuesta no encontrada'}), 404
    
    # Eliminar archivo físico si existe
    if propuesta.ruta_archivo and os.path.exists(propuesta.ruta_archivo):
        try:
            os.remove(propuesta.ruta_archivo)
            print(f"DEBUG - Archivo eliminado: {propuesta.ruta_archivo}")
        except Exception as e:
            print(f"DEBUG - Error al eliminar archivo: {e}")
    
    try:
        db.session.delete(propuesta)
        db.session.commit()
        print(f"DEBUG - Propuesta eliminada: {propuesta_id}")
        return jsonify({'success': True})
    except Exception as e:
        print(f"DEBUG - Error al eliminar propuesta: {e}")
        db.session.rollback()
        return jsonify({'error': f'Error al eliminar propuesta: {str(e)}'}), 500

# Endpoint para descargar archivo de propuesta
@propuestas_bp.route('/<int:propuesta_id>/descargar', methods=['GET'])
def descargar_archivo(propuesta_id):
    propuesta = PropuestaMejora.query.get(propuesta_id)
    if not propuesta:
        return jsonify({'error': 'Propuesta no encontrada'}), 404
    
    if not propuesta.nombre_archivo or not propuesta.ruta_archivo:
        return jsonify({'error': 'No hay archivo asociado'}), 404
    
    if not os.path.exists(propuesta.ruta_archivo):
        return jsonify({'error': 'Archivo no encontrado'}), 404
    
    return send_from_directory(PROPUESTAS_UPLOAD_FOLDER, propuesta.nombre_archivo, as_attachment=True) 