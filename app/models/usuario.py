from app import db
from werkzeug.security import generate_password_hash, check_password_hash

class Usuario(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False, unique=True)
    contrasena = db.Column(db.String(100), nullable=False)
    rol = db.Column(db.String(20), nullable=False)  # 'admin' o 'usuario'
    nombre_perfil = db.Column(db.String(100), nullable=True)
    tickets = db.relationship('Ticket', back_populates='usuario', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'rol': self.rol,
            'nombre_perfil': self.nombre_perfil
        }

    def set_password(self, password):
        self.contrasena = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.contrasena, password)