from app import db
from datetime import datetime
import uuid
import pytz

class Ticket(db.Model):
    __tablename__ = 'ticket'  # Nombre de la tabla en la base de datos

    id = db.Column(db.Integer, primary_key=True)
    descripcion = db.Column(db.String(255), nullable=False)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    fecha_apertura = db.Column(db.DateTime, default=lambda: datetime.now(pytz.timezone('America/Mexico_City')))
    fecha_cierre = db.Column(db.DateTime, nullable=True)
    estado = db.Column(db.String(20), default='abierto')  # 'abierto', 'en pausa', 'cerrado', 'descartado'
    codigo_unico = db.Column(db.String(36), unique=True, default=lambda: str(uuid.uuid4()))

    # Relación con el modelo Usuario
    usuario = db.relationship('Usuario', back_populates='tickets')
    documentos = db.relationship('Documento', back_populates='ticket', cascade='all, delete-orphan')

    def __init__(self, **kwargs):
        super(Ticket, self).__init__(**kwargs)
        if not self.fecha_apertura:
            self.fecha_apertura = datetime.now(pytz.timezone('America/Mexico_City'))

    def cerrar(self):
        """Cierra el ticket y establece la fecha de cierre"""
        if self.estado != 'cerrado':
            self.estado = 'cerrado'
            self.fecha_cierre = datetime.now(pytz.timezone('America/Mexico_City'))
            return True
        return False

    def pausar(self):
        """Pausa el ticket"""
        if self.estado not in ['cerrado', 'descartado']:
            self.estado = 'en pausa'
            return True
        return False

    def descartar(self):
        """Descarta el ticket"""
        if self.estado not in ['cerrado']:
            self.estado = 'descartado'
            return True
        return False

    def reabrir(self):
        """Reabre un ticket cerrado"""
        if self.estado == 'cerrado':
            self.estado = 'abierto'
            self.fecha_cierre = None
            return True
        return False

    def get_duracion(self):
        """Calcula la duración del ticket en horas"""
        if not self.fecha_apertura:
            return 0
        
        fecha_fin = self.fecha_cierre if self.fecha_cierre else datetime.now(pytz.timezone('America/Mexico_City'))
        duracion = fecha_fin - self.fecha_apertura
        return round(duracion.total_seconds() / 3600, 2)  # Horas con 2 decimales

    def to_dict(self):
        return {
            'id': self.id,
            'descripcion': self.descripcion,
            'usuario_id': self.usuario_id,
            'usuario_nombre': self.usuario.nombre if self.usuario else None,
            'usuario_nombre_perfil': self.usuario.nombre_perfil if self.usuario else None,
            'fecha_apertura': self.fecha_apertura.strftime('%Y-%m-%d %H:%M:%S') if self.fecha_apertura else None,
            'fecha_cierre': self.fecha_cierre.strftime('%Y-%m-%d %H:%M:%S') if self.fecha_cierre else None,
            'estado': self.estado,
            'codigo_unico': self.codigo_unico,
            'duracion_horas': self.get_duracion()
        }

    def __repr__(self):
        return f'<Ticket {self.id}: {self.descripcion[:50]}... - {self.estado}>'