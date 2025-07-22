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
        filename = secure_filename(archivo.filename)
        ruta = os.path.join(DOCUMENTOS_UPLOAD_FOLDER, filename)
        print(f"DEBUG - Guardando archivo en: {ruta}")
        
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
        os.remove(doc.ruta_archivo)
    except Exception:
        pass
    db.session.delete(doc)
    db.session.commit()
    return jsonify({'success': True})
