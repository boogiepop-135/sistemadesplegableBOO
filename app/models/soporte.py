from app import db
from datetime import datetime
import uuid

class TemaSoporte(db.Model):
    __tablename__ = 'tema_soporte'
    
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False, unique=True)
    descripcion = db.Column(db.Text)
    categoria = db.Column(db.String(50))  # ej: "Base de Datos", "Herramientas", "Sistemas"
    color = db.Column(db.String(7), default='#2196f3')  # Color para identificar el tema
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    activo = db.Column(db.Boolean, default=True)
    codigo_unico = db.Column(db.String(36), unique=True, default=lambda: str(uuid.uuid4()))
    
    # Relación con procedimientos
    procedimientos = db.relationship('ProcedimientoSoporte', backref='tema', lazy=True, cascade='all, delete-orphan')

class ProcedimientoSoporte(db.Model):
    __tablename__ = 'procedimiento_soporte'
    
    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(200), nullable=False)
    descripcion = db.Column(db.Text)
    pasos = db.Column(db.Text)  # Pasos detallados del procedimiento
    comandos = db.Column(db.Text)  # Comandos específicos si aplica
    notas = db.Column(db.Text)  # Notas adicionales
    dificultad = db.Column(db.String(20), default='Intermedio')  # Fácil, Intermedio, Avanzado
    tiempo_estimado = db.Column(db.String(50))  # ej: "5-10 minutos"
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    fecha_actualizacion = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    activo = db.Column(db.Boolean, default=True)
    orden = db.Column(db.Integer, default=0)  # Para ordenar los procedimientos
    codigo_unico = db.Column(db.String(36), unique=True, default=lambda: str(uuid.uuid4()))
    
    # Clave foránea al tema
    tema_id = db.Column(db.Integer, db.ForeignKey('tema_soporte.id'), nullable=False)
    
    # Relación con el usuario que lo creó
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    usuario = db.relationship('Usuario', backref='procedimientos_creados')
    
    # Relación con documentos
    documentos = db.relationship('Documento', back_populates='procedimiento') 