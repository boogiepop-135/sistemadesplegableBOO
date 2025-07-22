from app import db
from datetime import datetime
import uuid

class Ticket(db.Model):
    __tablename__ = 'ticket'  # Nombre de la tabla en la base de datos

    id = db.Column(db.Integer, primary_key=True)
    descripcion = db.Column(db.String(255), nullable=False)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    fecha_apertura = db.Column(db.DateTime, default=datetime.utcnow)
    fecha_cierre = db.Column(db.DateTime, nullable=True)
    estado = db.Column(db.String(20), default='abierto')  # 'abierto' o 'cerrado'
    codigo_unico = db.Column(db.String(36), unique=True, default=lambda: str(uuid.uuid4()))

    # Relación con el modelo Usuario
    usuario = db.relationship('Usuario', back_populates='tickets')
    documentos = db.relationship('Documento', back_populates='ticket', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'descripcion': self.descripcion,
            'usuario_id': self.usuario_id,
            'usuario_nombre': self.usuario.nombre if self.usuario else None,
            'usuario_nombre_perfil': self.usuario.nombre_perfil if self.usuario else None,
            'fecha_apertura': self.fecha_apertura.strftime('%Y-%m-%d %H:%M:%S'),
            'fecha_cierre': self.fecha_cierre.strftime('%Y-%m-%d %H:%M:%S') if self.fecha_cierre else None,
            'estado': self.estado,
            'codigo_unico': self.codigo_unico
        }