from flask import Blueprint, request, jsonify
from app.models.ticket import Ticket
from app.models.usuario import Usuario
from app import db
from datetime import datetime
import pytz
from flask_cors import CORS

tickets_bp = Blueprint('tickets', __name__)
# CORS configurado globalmente en main.py

@tickets_bp.route('/', methods=['GET'])
def listar_tickets():
    tickets = Ticket.query.all()
    return jsonify([t.to_dict() for t in tickets])

@tickets_bp.route('/', methods=['POST'])
def crear_ticket():
    try:
        data = request.get_json()
        descripcion = data.get('descripcion')
        usuario_id = data.get('usuario_id')
        
        if not descripcion or not usuario_id:
            return jsonify({'error': 'Faltan datos requeridos'}), 400
        
        # Verificar que el usuario existe
        usuario = Usuario.query.get(usuario_id)
        if not usuario:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        
        # Configurar zona horaria de México Central
        mexico_tz = pytz.timezone('America/Mexico_City')
        hora_mexico = datetime.now(mexico_tz)
        
        ticket = Ticket(
            descripcion=descripcion, 
            usuario_id=usuario_id,
            fecha_apertura=hora_mexico,
            estado='abierto'
        )
        
        db.session.add(ticket)
        db.session.commit()
        
        print(f"DEBUG - Nuevo ticket creado: {ticket.id} por usuario {usuario.nombre_perfil or usuario.nombre} a las {hora_mexico}")
        return jsonify(ticket.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error creando ticket: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@tickets_bp.route('/<int:ticket_id>/cerrar', methods=['POST'])
def cerrar_ticket(ticket_id):
    try:
        ticket = Ticket.query.get(ticket_id)
        if not ticket:
            return jsonify({'error': 'Ticket no encontrado'}), 404
        
        if ticket.estado == 'cerrado':
            return jsonify({'error': 'El ticket ya está cerrado'}), 400
        
        # Configurar zona horaria de México Central
        mexico_tz = pytz.timezone('America/Mexico_City')
        hora_cierre = datetime.now(mexico_tz)
        
        ticket.estado = 'cerrado'
        ticket.fecha_cierre = hora_cierre
        db.session.commit()
        
        print(f"DEBUG - Ticket {ticket_id} cerrado a las {hora_cierre}")
        return jsonify(ticket.to_dict())
        
    except Exception as e:
        db.session.rollback()
        print(f"Error cerrando ticket: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@tickets_bp.route('/<int:ticket_id>/pausar', methods=['POST'])
def pausar_ticket(ticket_id):
    try:
        ticket = Ticket.query.get(ticket_id)
        if not ticket:
            return jsonify({'error': 'Ticket no encontrado'}), 404
        
        if ticket.estado == 'cerrado':
            return jsonify({'error': 'No se puede pausar un ticket cerrado'}), 400
        
        ticket.estado = 'en pausa'
        db.session.commit()
        
        print(f"DEBUG - Ticket {ticket_id} pausado")
        return jsonify(ticket.to_dict())
        
    except Exception as e:
        db.session.rollback()
        print(f"Error pausando ticket: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@tickets_bp.route('/<int:ticket_id>/descartar', methods=['POST'])
def descartar_ticket(ticket_id):
    try:
        ticket = Ticket.query.get(ticket_id)
        if not ticket:
            return jsonify({'error': 'Ticket no encontrado'}), 404
        
        if ticket.estado == 'cerrado':
            return jsonify({'error': 'No se puede descartar un ticket cerrado'}), 400
        
        ticket.estado = 'descartado'
        db.session.commit()
        
        print(f"DEBUG - Ticket {ticket_id} descartado")
        return jsonify(ticket.to_dict())
        
    except Exception as e:
        db.session.rollback()
        print(f"Error descartando ticket: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@tickets_bp.route('/<int:ticket_id>', methods=['GET'])
def obtener_ticket(ticket_id):
    try:
        ticket = Ticket.query.get(ticket_id)
        if not ticket:
            return jsonify({'error': 'Ticket no encontrado'}), 404
        
        return jsonify(ticket.to_dict())
        
    except Exception as e:
        print(f"Error obteniendo ticket: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500