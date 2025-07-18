from app import db
from datetime import datetime
import uuid

bitacora_ticket = db.Table('bitacora_ticket',
    db.Column('bitacora_id', db.Integer, db.ForeignKey('bitacora_mantenimiento.id'), primary_key=True),
    db.Column('ticket_id', db.Integer, db.ForeignKey('ticket.id'), primary_key=True)
)

class BitacoraMantenimiento(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    fecha = db.Column(db.DateTime, default=datetime.utcnow)
    descripcion = db.Column(db.String(255), nullable=False)
    inventario_id = db.Column(db.Integer, db.ForeignKey('inventario.id'), nullable=False)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=True)
    codigo_unico = db.Column(db.String(36), unique=True, default=lambda: str(uuid.uuid4()))

    inventario = db.relationship('Inventario', backref='bitacoras')
    usuario = db.relationship('Usuario', backref='bitacoras')
    tickets = db.relationship('Ticket', secondary=bitacora_ticket, backref='bitacoras')

    def to_dict(self):
        return {
            'id': self.id,
            'fecha': self.fecha.strftime('%Y-%m-%d %H:%M:%S'),
            'descripcion': self.descripcion,
            'inventario_id': self.inventario_id,
            'usuario_id': self.usuario_id,
            'codigo_unico': self.codigo_unico,
            'tickets': [
                {'id': t.id, 'codigo_unico': t.codigo_unico, 'descripcion': t.descripcion}
                for t in self.tickets
            ]
        }
