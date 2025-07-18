from app import db

class Ubicacion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False, unique=True)
    inventarios = db.relationship('Inventario', back_populates='ubicacion')

    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre
        }
