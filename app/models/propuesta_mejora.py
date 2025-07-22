from app import db
from datetime import datetime
import uuid

class PropuestaMejora(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(255), nullable=False)
    descripcion = db.Column(db.Text, nullable=True)
    nombre_archivo = db.Column(db.String(255), nullable=True)
    ruta_archivo = db.Column(db.String(255), nullable=True)
    persona_responsable = db.Column(db.String(255), nullable=False)
    estado = db.Column(db.String(50), default='pendiente')  # pendiente, en_revision, aprobada, rechazada, implementada
    prioridad = db.Column(db.String(20), default='media')  # baja, media, alta, critica
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    fecha_aprobacion = db.Column(db.DateTime, nullable=True)
    fecha_implementacion = db.Column(db.DateTime, nullable=True)
    codigo_unico = db.Column(db.String(36), unique=True, default=lambda: str(uuid.uuid4()))
    
    # Relación con el usuario que creó la propuesta
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    usuario = db.relationship('Usuario', back_populates='propuestas')

    def to_dict(self):
        return {
            'id': self.id,
            'titulo': self.titulo,
            'descripcion': self.descripcion,
            'nombre_archivo': self.nombre_archivo,
            'ruta_archivo': self.ruta_archivo,
            'persona_responsable': self.persona_responsable,
            'estado': self.estado,
            'prioridad': self.prioridad,
            'fecha_creacion': self.fecha_creacion.strftime('%Y-%m-%d %H:%M:%S'),
            'fecha_aprobacion': self.fecha_aprobacion.strftime('%Y-%m-%d %H:%M:%S') if self.fecha_aprobacion else None,
            'fecha_implementacion': self.fecha_implementacion.strftime('%Y-%m-%d %H:%M:%S') if self.fecha_implementacion else None,
            'usuario_id': self.usuario_id,
            'usuario_nombre': self.usuario.nombre if self.usuario else None,
            'codigo_unico': self.codigo_unico
        } 