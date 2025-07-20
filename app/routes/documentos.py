from flask import Blueprint, request, jsonify, send_from_directory
from app.models.documento import Documento
from app import db
from werkzeug.utils import secure_filename
import os
from flask_cors import CORS

DOCUMENTOS_UPLOAD_FOLDER = os.path.join(os.getcwd(), 'instance', 'uploads')
ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg', 'txt'}

documentos_bp = Blueprint('documentos', __name__)
# CORS configurado globalmente en main.py

# Helper para validar extensiones
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Endpoint para subir documento
@documentos_bp.route('/subir', methods=['POST'])
def subir_documento():
    if 'archivo' not in request.files:
        return jsonify({'error': 'No se envió archivo'}), 400
    archivo = request.files['archivo']
    if archivo.filename == '':
        return jsonify({'error': 'Nombre de archivo vacío'}), 400
    if archivo and allowed_file(archivo.filename):
        filename = secure_filename(archivo.filename)
        ruta = os.path.join(DOCUMENTOS_UPLOAD_FOLDER, filename)
        archivo.save(ruta)
        descripcion = request.form.get('descripcion', '')
        tipo_archivo = filename.rsplit('.', 1)[1].lower()
        ticket_id = request.form.get('ticket_id')
        inventario_id = request.form.get('inventario_id')
        doc = Documento(
            nombre_archivo=filename,
            descripcion=descripcion,
            tipo_archivo=tipo_archivo,
            ruta_archivo=ruta,
            ticket_id=ticket_id if ticket_id else None,
            inventario_id=inventario_id if inventario_id else None
        )
        db.session.add(doc)
        db.session.commit()
        return jsonify({'success': True, 'documento': doc.to_dict()}), 201
    return jsonify({'error': 'Tipo de archivo no permitido'}), 400

# Endpoint para listar documentos
@documentos_bp.route('/', methods=['GET'])
def listar_documentos():
    docs = Documento.query.all()
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
