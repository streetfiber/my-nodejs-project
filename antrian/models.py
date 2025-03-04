from datetime import datetime
from antrian import db, login_manager
from flask_login import UserMixin
from datetime import date

class Tuser(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    noantrian = db.Column(db.Integer, unique=True, nullable=False)  # Ubah ke Integer agar berurutan
    tiperawat = db.Column(db.String(50), nullable=False)
    kategori = db.Column(db.String(15), nullable=False)
    poli = db.Column(db.String(100), nullable=False)
    tanggal = db.Column(db.Date, nullable=False, default=date.today, index=True)

    def __repr__(self):
        return f"Tuser('{self.noantrian}','{self.tiperawat}','{self.kategori}','{self.poli}','{self.tanggal}')"
