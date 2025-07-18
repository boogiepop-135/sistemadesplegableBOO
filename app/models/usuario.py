from app import db

class Usuario(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False, unique=True)
    contrasena = db.Column(db.String(100), nullable=False)
    rol = db.Column(db.String(20), nullable=False)  # 'admin' o 'usuario'
    tickets = db.relationship('Ticket', back_populates='usuario', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'rol': self.rol
            # Si quieres incluir los tickets, puedes agregar:
            # 'tickets': [t.id for t in self.tickets]
        }