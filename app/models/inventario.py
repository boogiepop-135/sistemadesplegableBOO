from app import db
import uuid

class Inventario(db.Model):
    __tablename__ = 'inventario'

    id = db.Column(db.Integer, primary_key=True)
    equipo = db.Column(db.String(100), nullable=False)  # nombre del objeto
    tipo = db.Column(db.String(100), nullable=False)    # tipo/categoría (ej: Laptop, Impresora)
    estado = db.Column(db.String(50), nullable=False)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=True)
    usuario = db.relationship('Usuario', backref='inventario_asignado')
    documentos = db.relationship('Documento', back_populates='inventario', cascade='all, delete-orphan')
    codigo_unico = db.Column(db.String(36), unique=True, default=lambda: str(uuid.uuid4()))
    ubicacion_id = db.Column(db.Integer, db.ForeignKey('ubicacion.id'), nullable=True)
    ubicacion = db.relationship('Ubicacion', back_populates='inventarios')

    def to_dict(self):
        return {
            'id': self.id,
            'equipo': self.equipo,
            'tipo': self.tipo,
            'estado': self.estado,
            'usuario_id': self.usuario_id,
            'usuario_nombre': self.usuario.nombre if self.usuario else None,
            'usuario_nombre_perfil': self.usuario.nombre_perfil if self.usuario else None,
            'codigo_unico': self.codigo_unico,
            'ubicacion_id': self.ubicacion_id,
            'ubicacion_nombre': self.ubicacion.nombre if self.ubicacion else None
        }