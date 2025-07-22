from flask import Blueprint, request, jsonify, send_from_directory
from app.models.documento import Documento
from app import db
from werkzeug.utils import secure_filename
import os
from flask_cors import CORS

DOCUMENTOS_UPLOAD_FOLDER = os.path.join(os.getcwd(), 'instance', 'uploads')
ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg', 'txt'}

# Asegurar que el directorio de uploads existe
if not os.path.exists(DOCUMENTOS_UPLOAD_FOLDER):
    os.makedirs(DOCUMENTOS_UPLOAD_FOLDER)
    print(f"DEBUG - Directorio de uploads creado: {DOCUMENTOS_UPLOAD_FOLDER}")
else:
    print(f"DEBUG - Directorio de uploads existe: {DOCUMENTOS_UPLOAD_FOLDER}")
    # Listar archivos existentes
    archivos = os.listdir(DOCUMENTOS_UPLOAD_FOLDER)
    print(f"DEBUG - Archivos en uploads: {archivos}")

documentos_bp = Blueprint('documentos', __name__)
# CORS configurado globalmente en main.py

# Helper para validar extensiones
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Helper para generar nombre único de archivo
def generate_unique_filename(base_filename, upload_folder):
    name, ext = os.path.splitext(base_filename)
    counter = 1
    filename = base_filename
    
    # Verificar si ya existe un archivo con el mismo nombre
    while os.path.exists(os.path.join(upload_folder, filename)):
        filename = f"{name}_{counter}{ext}"
        counter += 1
    
    return filename

# Helper para verificar si ya existe un documento con la misma ruta en la BD
def check_document_exists(ruta_archivo):
    existing_doc = Documento.query.filter_by(ruta_archivo=ruta_archivo).first()
    return existing_doc is not None

# Endpoint para subir documento
@documentos_bp.route('/subir', methods=['POST'])
def subir_documento():
    print("DEBUG - Iniciando subida de documento")
    print(f"DEBUG - Archivos recibidos: {list(request.files.keys())}")
    print(f"DEBUG - Form data: {dict(request.form)}")
    
    if 'archivo' not in request.files:
        print("DEBUG - Error: No se envió archivo")
        return jsonify({'error': 'No se envió archivo'}), 400
    
    archivo = request.files['archivo']
    print(f"DEBUG - Archivo recibido: {archivo.filename}")
    
    if archivo.filename == '':
        print("DEBUG - Error: Nombre de archivo vacío")
        return jsonify({'error': 'Nombre de archivo vacío'}), 400
    
    if archivo and allowed_file(archivo.filename):
        # Generar nombre único para evitar conflictos
        base_filename = secure_filename(archivo.filename)
        filename = generate_unique_filename(base_filename, DOCUMENTOS_UPLOAD_FOLDER)
        ruta = os.path.join(DOCUMENTOS_UPLOAD_FOLDER, filename)
        
        print(f"DEBUG - Nombre original: {archivo.filename}")
        print(f"DEBUG - Nombre final: {filename}")
        print(f"DEBUG - Guardando archivo en: {ruta}")
        
        # Verificar si ya existe un documento con esta ruta en la BD
        if check_document_exists(ruta):
            print(f"DEBUG - ERROR: Ya existe un documento con la ruta: {ruta}")
            return jsonify({'error': 'Ya existe un documento con este nombre'}), 400
        
        archivo.save(ruta)
        
        # Verificar que el archivo se guardó
        if os.path.exists(ruta):
            print(f"DEBUG - Archivo guardado exitosamente: {ruta}")
        else:
            print(f"DEBUG - ERROR: Archivo no se guardó en: {ruta}")
        
        descripcion = request.form.get('descripcion', '')
        tipo_archivo = filename.rsplit('.', 1)[1].lower()
        ticket_id = request.form.get('ticket_id')
        inventario_id = request.form.get('inventario_id')
        
        print(f"DEBUG - Datos del documento: descripcion={descripcion}, tipo={tipo_archivo}, ticket_id={ticket_id}, inventario_id={inventario_id}")
        
        doc = Documento(
            nombre_archivo=filename,
            descripcion=descripcion,
            tipo_archivo=tipo_archivo,
            ruta_archivo=ruta,
            ticket_id=ticket_id if ticket_id else None,
            inventario_id=inventario_id if inventario_id else None
        )
        
        try:
            db.session.add(doc)
            db.session.commit()
            print(f"DEBUG - Documento subido exitosamente: {doc.nombre_archivo}, ID: {doc.id}")
            return jsonify({'success': True, 'documento': doc.to_dict()}), 201
        except Exception as e:
            print(f"DEBUG - Error al guardar en BD: {e}")
            db.session.rollback()
            # Si hay error en la BD, eliminar el archivo físico para evitar archivos huérfanos
            try:
                if os.path.exists(ruta):
                    os.remove(ruta)
                    print(f"DEBUG - Archivo físico eliminado debido a error en BD: {ruta}")
            except Exception as cleanup_error:
                print(f"DEBUG - Error al limpiar archivo físico: {cleanup_error}")
            return jsonify({'error': f'Error al guardar en base de datos: {str(e)}'}), 500
    else:
        print(f"DEBUG - Error: Tipo de archivo no permitido: {archivo.filename}")
        return jsonify({'error': 'Tipo de archivo no permitido'}), 400

# Endpoint para listar documentos
@documentos_bp.route('/', methods=['GET'])
def listar_documentos():
    docs = Documento.query.order_by(Documento.fecha_subida.desc()).all()
    print(f"DEBUG - Total de documentos encontrados: {len(docs)}")
    for doc in docs:
        print(f"DEBUG - Documento: {doc.nombre_archivo}, ID: {doc.id}, Fecha: {doc.fecha_subida}")
    return jsonify([d.to_dict() for d in docs])

# Endpoint para descargar documento
@documentos_bp.route('/<int:doc_id>/descargar', methods=['GET'])
def descargar_documento(doc_id):
    doc = Documento.query.get(doc_id)
    if not doc:
        return jsonify({'error': 'Documento no encontrado'}), 404
    return send_from_directory(DOCUMENTOS_UPLOAD_FOLDER, doc.nombre_archivo, as_attachment=True)

# Endpoint para eliminar documento
@documentos_bp.route('/<int:doc_id>', methods=['DELETE'])
def eliminar_documento(doc_id):
    doc = Documento.query.get(doc_id)
    if not doc:
        return jsonify({'error': 'Documento no encontrado'}), 404
    # Eliminar archivo físico
    try:
        if os.path.exists(doc.ruta_archivo):
            os.remove(doc.ruta_archivo)
            print(f"DEBUG - Archivo físico eliminado: {doc.ruta_archivo}")
    except Exception as e:
        print(f"DEBUG - Error al eliminar archivo físico: {e}")
    db.session.delete(doc)
    db.session.commit()
    return jsonify({'success': True})

# Endpoint para limpiar archivos huérfanos (solo para administradores)
@documentos_bp.route('/limpiar-huérfanos', methods=['POST'])
def limpiar_archivos_huérfanos():
    try:
        # Obtener todas las rutas de archivos en la BD
        docs_en_bd = Documento.query.all()
        rutas_en_bd = {doc.ruta_archivo for doc in docs_en_bd}
        
        # Obtener todos los archivos físicos
        archivos_fisicos = []
        if os.path.exists(DOCUMENTOS_UPLOAD_FOLDER):
            archivos_fisicos = [os.path.join(DOCUMENTOS_UPLOAD_FOLDER, f) for f in os.listdir(DOCUMENTOS_UPLOAD_FOLDER)]
        
        # Encontrar archivos huérfanos
        archivos_huérfanos = [f for f in archivos_fisicos if f not in rutas_en_bd]
        
        # Eliminar archivos huérfanos
        eliminados = 0
        for archivo in archivos_huérfanos:
            try:
                os.remove(archivo)
                eliminados += 1
                print(f"DEBUG - Archivo huérfano eliminado: {archivo}")
            except Exception as e:
                print(f"DEBUG - Error al eliminar archivo huérfano {archivo}: {e}")
        
        return jsonify({
            'success': True, 
            'mensaje': f'Se eliminaron {eliminados} archivos huérfanos',
            'archivos_eliminados': eliminados
        })
    except Exception as e:
        print(f"DEBUG - Error en limpieza de archivos huérfanos: {e}")
        return jsonify({'error': f'Error al limpiar archivos: {str(e)}'}), 500
