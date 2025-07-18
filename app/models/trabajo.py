from app import db
import uuid

class Trabajo(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    codigo_unico = db.Column(db.String(36), unique=True, default=lambda: str(uuid.uuid4()))
    titulo = db.Column(db.String(255), nullable=False)
    descripcion = db.Column(db.Text, nullable=True)
    estado = db.Column(db.String(30), default='pendiente')
    responsable_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=True)
    fecha_creacion = db.Column(db.DateTime, default=db.func.now())
    notas = db.Column(db.Text, nullable=True)
    relaciones = db.relationship('TrabajoRelacion', backref='trabajo', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'codigo_unico': self.codigo_unico,
            'titulo': self.titulo,
            'descripcion': self.descripcion,
            'estado': self.estado,
            'responsable_id': self.responsable_id,
            'fecha_creacion': self.fecha_creacion.strftime('%Y-%m-%d %H:%M:%S'),
            'notas': self.notas,
            'relaciones': [r.to_dict() for r in self.relaciones]
        }

class TrabajoRelacion(db.Model):
    __tablename__ = 'trabajo_relacion'
    trabajo_id = db.Column(db.Integer, db.ForeignKey('trabajo.id'), primary_key=True)
    entidad_tipo = db.Column(db.String(20), primary_key=True)  # 'inventario', 'ticket', 'bitacora', 'informe'
    entidad_codigo = db.Column(db.String(36), primary_key=True)

    def to_dict(self):
        return {
            'entidad_tipo': self.entidad_tipo,
            'entidad_codigo': self.entidad_codigo
        }