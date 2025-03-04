from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_login import LoginManager
from flask_migrate import Migrate

app=Flask('__name__',template_folder='antrian/templates', static_folder='antrian/static')
app.config['SECRET_KEY']="d6079c2d0066bfd187b348e8df6fb192"
app.config['SQLALCHEMY_DATABASE_URI']= 'sqlite:///antrian_rs.db'
db= SQLAlchemy(app)
bcrypt = Bcrypt(app)
login_manager=LoginManager(app)
migrate = Migrate(app, db)  # Inisialisasi Flask-Migrate

from antrian.routes import rantri
app.register_blueprint(rantri)