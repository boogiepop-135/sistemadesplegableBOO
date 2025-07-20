from flask import Blueprint, request, jsonify
from app.models.ticket import Ticket
from app.models.usuario import Usuario
from app import db
from datetime import datetime
from flask_cors import CORS

tickets_bp = Blueprint('tickets', __name__)
CORS(tickets_bp, origins=[
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "https://web-production-21f2a.up.railway.app",
    "https://soporteches.online",
    "https://api.soporteches.online",
    "https://sistemadesplegableboo-production.up.railway.app"
], supports_credentials=True)

@tickets_bp.route('/', methods=['GET', 'OPTIONS'])
def listar_tickets():
    if request.method == 'OPTIONS':
        return '', 200
    tickets = Ticket.query.all()
    return jsonify([t.to_dict() for t in tickets])

@tickets_bp.route('/', methods=['POST'])
def crear_ticket():
    data = request.get_json()
    descripcion = data.get('descripcion')
    usuario_id = data.get('usuario_id')
    if not descripcion or not usuario_id:
        return jsonify({'error': 'Faltan datos'}), 400
    ticket = Ticket(descripcion=descripcion, usuario_id=usuario_id)
    db.session.add(ticket)
    db.session.commit()
    return jsonify(ticket.to_dict()), 201

@tickets_bp.route('/<int:ticket_id>/cerrar', methods=['POST'])
def cerrar_ticket(ticket_id):
    ticket = Ticket.query.get(ticket_id)
    if not ticket:
        return jsonify({'error': 'Ticket no encontrado'}), 404
    ticket.estado = 'cerrado'
    ticket.fecha_cierre = datetime.utcnow()
    db.session.commit()
    return jsonify(ticket.to_dict())

@tickets_bp.route('/<int:ticket_id>/pausar', methods=['POST'])
def pausar_ticket(ticket_id):
    ticket = Ticket.query.get(ticket_id)
    if not ticket:
        return jsonify({'error': 'Ticket no encontrado'}), 404
    ticket.estado = 'en pausa'
    db.session.commit()
    return jsonify(ticket.to_dict())

@tickets_bp.route('/<int:ticket_id>/descartar', methods=['POST'])
def descartar_ticket(ticket_id):
    ticket = Ticket.query.get(ticket_id)
    if not ticket:
        return jsonify({'error': 'Ticket no encontrado'}), 404
    ticket.estado = 'descartado'
    db.session.commit()
    return jsonify(ticket.to_dict())