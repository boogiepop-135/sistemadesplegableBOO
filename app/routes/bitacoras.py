from flask import Blueprint, request, jsonify, send_file
from app.models.bitacora_mantenimiento import BitacoraMantenimiento
from app import db
from flask_cors import CORS
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
import io
import os

bitacoras_bp = Blueprint('bitacoras', __name__)
# CORS configurado globalmente en main.py

@bitacoras_bp.route('/', methods=['GET'])
def listar_bitacoras():
    bitacoras = BitacoraMantenimiento.query.all()
    return jsonify([b.to_dict() for b in bitacoras])

@bitacoras_bp.route('/', methods=['POST'])
def crear_bitacora():
    data = request.get_json()
    descripcion = data.get('descripcion')
    inventario_id = data.get('inventario_id')
    usuario_id = data.get('usuario_id')
    tipo_mantenimiento = data.get('tipo_mantenimiento')
    fecha_termino = data.get('fecha_termino')
    firma = data.get('firma')
    tickets_codigos = data.get('tickets_codigos', [])  # lista de códigos únicos
    if not descripcion or not inventario_id:
        return jsonify({'error': 'Faltan datos'}), 400
    bitacora = BitacoraMantenimiento(
        descripcion=descripcion,
        inventario_id=inventario_id,
        usuario_id=usuario_id,
        tipo_mantenimiento=tipo_mantenimiento,
        fecha_termino=fecha_termino,
        firma=firma
    )
    # Asociar tickets por código único
    if tickets_codigos:
        from app.models.ticket import Ticket
        tickets = Ticket.query.filter(Ticket.codigo_unico.in_(tickets_codigos)).all()
        bitacora.tickets = tickets
    db.session.add(bitacora)
    db.session.commit()
    return jsonify(bitacora.to_dict()), 201

@bitacoras_bp.route('/<int:bitacora_id>', methods=['DELETE'])
def eliminar_bitacora(bitacora_id):
    bitacora = BitacoraMantenimiento.query.get(bitacora_id)
    if not bitacora:
        return jsonify({'error': 'Bitácora no encontrada'}), 404
    db.session.delete(bitacora)
    db.session.commit()
    return jsonify({'success': True})

@bitacoras_bp.route('/<int:bitacora_id>/pdf', methods=['GET'])
def descargar_pdf_bitacora(bitacora_id):
    bitacora = BitacoraMantenimiento.query.get(bitacora_id)
    if not bitacora:
        return jsonify({'error': 'Bitácora no encontrada'}), 404
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    # Logo
    logo_path = os.path.join(os.getcwd(), 'instance', 'uploads', 'logo_informe.png')
    if os.path.exists(logo_path):
        c.drawImage(ImageReader(logo_path), 40, height-90, width=90, height=60, mask='auto')
    # Encabezado
    c.setFont('Helvetica-Bold', 14)
    c.drawString(150, height-50, 'San Cosme - Departamento de Sistemas')
    c.setFont('Helvetica', 10)
    c.drawString(150, height-65, f'Fecha: {bitacora.fecha}')
    c.drawString(150, height-80, f'Código único: {bitacora.codigo_unico}')
    c.drawString(400, height-65, f'ID: {bitacora.id}')
    c.drawString(400, height-80, f'Equipo: {bitacora.inventario_id}')
    # Título
    c.setFont('Helvetica-Bold', 18)
    c.drawCentredString(width/2, height-120, 'INFORME TÉCNICO')
    # Descripción
    c.setFont('Helvetica', 12)
    c.drawString(40, height-150, f'Descripción: {bitacora.descripcion}')
    # Tickets asociados
    c.setFont('Helvetica-Bold', 12)
    c.drawString(40, height-180, 'Tickets asociados:')
    c.setFont('Helvetica', 11)
    y = height-200
    for t in bitacora.tickets:
        c.drawString(60, y, f"[{t.codigo_unico[:8]}] {t.descripcion}")
        y -= 16
    # Pie de página: departamento, nombre y formulario de firma/cargo
    c.setFont('Helvetica', 11)
    c.drawString(40, 80, 'Departamento de IT')
    c.drawString(40, 65, 'Levi Eduardo Villarreal Argueta')
    # Formulario de cargo y nombre a la derecha
    c.rect(width-220, 60, 180, 40)
    c.drawString(width-215, 85, 'Cargo:')
    c.line(width-170, 83, width-50, 83)
    c.drawString(width-215, 70, 'Nombre:')
    c.line(width-170, 68, width-50, 68)
    c.save()
    buffer.seek(0)
    return send_file(buffer, as_attachment=True, download_name=f'bitacora_{bitacora.id}.pdf', mimetype='application/pdf')

@bitacoras_bp.route('/<int:bitacora_id>', methods=['PUT'])
def actualizar_bitacora(bitacora_id):
    bitacora = BitacoraMantenimiento.query.get(bitacora_id)
    if not bitacora:
        return jsonify({'error': 'Bitácora no encontrada'}), 404
    data = request.get_json()
    bitacora.descripcion = data.get('descripcion', bitacora.descripcion)
    bitacora.inventario_id = data.get('inventario_id', bitacora.inventario_id)
    bitacora.usuario_id = data.get('usuario_id', bitacora.usuario_id)
    bitacora.tipo_mantenimiento = data.get('tipo_mantenimiento', bitacora.tipo_mantenimiento)
    bitacora.fecha_termino = data.get('fecha_termino', bitacora.fecha_termino)
    bitacora.firma = data.get('firma', bitacora.firma)
    # Si se envía fecha, actualizarla
    if data.get('fecha'):
        bitacora.fecha = data.get('fecha')
    db.session.commit()
    return jsonify(bitacora.to_dict())
