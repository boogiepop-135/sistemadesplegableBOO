from app import db
from datetime import datetime
import uuid

class Documento(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre_archivo = db.Column(db.String(255), nullable=False)
    descripcion = db.Column(db.String(255), nullable=True)
    tipo_archivo = db.Column(db.String(50), nullable=False)
    ruta_archivo = db.Column(db.String(255), nullable=False, unique=True)
    fecha_subida = db.Column(db.DateTime, default=datetime.utcnow)
    codigo_unico = db.Column(db.String(36), unique=True, default=lambda: str(uuid.uuid4()))

    # Relaciones opcionales
    ticket_id = db.Column(db.Integer, db.ForeignKey('ticket.id'), nullable=True)
    inventario_id = db.Column(db.Integer, db.ForeignKey('inventario.id'), nullable=True)
    procedimiento_id = db.Column(db.Integer, db.ForeignKey('procedimiento_soporte.id'), nullable=True)

    # Relaciones de back-population (opcional, pero recomendado)
    ticket = db.relationship('Ticket', back_populates='documentos')
    inventario = db.relationship('Inventario', back_populates='documentos')
    procedimiento = db.relationship('ProcedimientoSoporte', back_populates='documentos')

    def to_dict(self):
        return {
            'id': self.id,
            'nombre_archivo': self.nombre_archivo,
            'descripcion': self.descripcion,
            'tipo_archivo': self.tipo_archivo,
            'ruta_archivo': self.ruta_archivo,
            'fecha_subida': self.fecha_subida.strftime('%Y-%m-%d %H:%M:%S'),
            'ticket_id': self.ticket_id,
            'inventario_id': self.inventario_id,
            'procedimiento_id': self.procedimiento_id,
            'codigo_unico': self.codigo_unico
        }
