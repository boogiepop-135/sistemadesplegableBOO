from flask import Blueprint, jsonify, request
from flask_cors import CORS
from app.models.ticket import Ticket
from app import db
from datetime import datetime

avisos_bp = Blueprint('avisos', __name__)
CORS(avisos_bp, origins=[
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "https://web-production-21f2a.up.railway.app",
    "https://soporteches.online",
    "https://sistemadesplegableboo-production.up.railway.app"
], supports_credentials=True)

# Variable global temporal para almacenar el aviso
aviso_actual = {'mensaje': 'Mantenimiento programado el viernes a las 18:00 hrs.', 'fecha': datetime.now().isoformat()}

@avisos_bp.route('/', methods=['GET', 'OPTIONS'])
def obtener_aviso():
    if request.method == 'OPTIONS':
        return '', 200
    # Mensaje enfocado en tareas pendientes
    mensaje = aviso_actual.get('mensaje') or 'Tienes tareas pendientes por revisar.'
    fecha = aviso_actual.get('fecha')
    # Obtener los 5 tickets más recientes o pendientes (abiertos)
    tickets = Ticket.query.filter_by(estado='abierto').order_by(Ticket.fecha_apertura.desc()).limit(5).all()
    tickets_data = [t.to_dict() for t in tickets]
    return jsonify({'mensaje': mensaje, 'fecha': fecha, 'tickets_pendientes': tickets_data})

@avisos_bp.route('/', methods=['POST'])
def fijar_aviso():
    data = request.get_json()
    aviso_actual['mensaje'] = data.get('mensaje', '')
    aviso_actual['fecha'] = datetime.now().isoformat()
    return jsonify({'success': True, 'mensaje': aviso_actual['mensaje'], 'fecha': aviso_actual['fecha']})