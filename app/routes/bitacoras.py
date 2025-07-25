from flask import Blueprint, request, jsonify, send_file
from app.models.bitacora_mantenimiento import BitacoraMantenimiento
from app import db
from flask_cors import CORS
import io
import os
from datetime import datetime

# Importación segura de reportlab
try:
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    from reportlab.lib.utils import ImageReader
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False
    print("Warning: reportlab no está disponible, la generación de PDF estará deshabilitada")

bitacoras_bp = Blueprint('bitacoras', __name__)
# CORS configurado globalmente en main.py

@bitacoras_bp.route('/', methods=['GET'])
def listar_bitacoras():
    bitacoras = BitacoraMantenimiento.query.all()
    return jsonify([b.to_dict() for b in bitacoras])

@bitacoras_bp.route('/', methods=['POST'])
def crear_bitacora():
    data = request.get_json()
    print('DEBUG - Datos recibidos en /bitacoras/:', data)
    descripcion = data.get('descripcion')
    inventario_id = data.get('inventario_id')
    usuario_id = data.get('usuario_id')
    tipo_mantenimiento = data.get('tipo_mantenimiento')
    fecha_termino = data.get('fecha_termino')
    firma = data.get('firma')
    tickets_codigos = data.get('tickets_codigos', [])  # lista de códigos únicos
    # Validación robusta
    if not descripcion:
        return jsonify({'error': 'Falta el campo descripcion'}), 400
    if not inventario_id:
        return jsonify({'error': 'Falta el campo inventario_id'}), 400
    # Parsear fecha_termino si viene como string
    if fecha_termino:
        try:
            if len(fecha_termino) == 10:
                fecha_termino = datetime.strptime(fecha_termino, '%Y-%m-%d')
            else:
                fecha_termino = datetime.fromisoformat(fecha_termino)
        except Exception as e:
            print('ERROR al parsear fecha_termino:', e)
            return jsonify({'error': 'Formato de fecha_termino inválido, usa YYYY-MM-DD'}), 400
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
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print('ERROR al crear bitácora:', e)
        return jsonify({'error': str(e)}), 500
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
    if not REPORTLAB_AVAILABLE:
        return jsonify({'error': 'La generación de PDF no está disponible'}), 503
    
    bitacora = BitacoraMantenimiento.query.get(bitacora_id)
    if not bitacora:
        return jsonify({'error': 'Bitácora no encontrada'}), 404
    
    try:
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
        c.setFont('Helvetica-Bold', 12)
        c.drawString(40, height-150, 'Descripción:')
        c.setFont('Helvetica', 10)
        # Dividir descripción en líneas
        descripcion = bitacora.descripcion
        y_pos = height-170
        for i in range(0, len(descripcion), 80):
            linea = descripcion[i:i+80]
            c.drawString(40, y_pos, linea)
            y_pos -= 15
            if y_pos < 100:  # Si se acaba el espacio, crear nueva página
                c.showPage()
                c.setFont('Helvetica', 10)
                y_pos = height-50
        # Información adicional
        c.setFont('Helvetica-Bold', 12)
        c.drawString(40, y_pos-30, 'Información adicional:')
        c.setFont('Helvetica', 10)
        c.drawString(40, y_pos-50, f'Tipo de mantenimiento: {bitacora.tipo_mantenimiento or "No especificado"}')
        c.drawString(40, y_pos-70, f'Usuario: {bitacora.usuario_id or "No especificado"}')
        if bitacora.fecha_termino:
            c.drawString(40, y_pos-90, f'Fecha de término: {bitacora.fecha_termino.strftime("%Y-%m-%d")}')
        # Firma
        if bitacora.firma:
            c.setFont('Helvetica-Bold', 12)
            c.drawString(40, y_pos-120, 'Firma:')
            c.setFont('Helvetica', 10)
            c.drawString(40, y_pos-140, bitacora.firma)
        c.save()
        buffer.seek(0)
        return send_file(buffer, download_name=f'bitacora_{bitacora_id}.pdf', as_attachment=True)
    except Exception as e:
        print(f"Error generando PDF: {str(e)}")
        return jsonify({'error': 'Error al generar el PDF'}), 500

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
