from flask_login import current_user
from flask_wtf import FlaskForm
from wtforms import StringField, SubmitField, TextAreaField, PasswordField, SelectField, IntegerField,DateTimeField,FloatField,DateField
from wtforms.validators import DataRequired, Length, Email, EqualTo, ValidationError, NumberRange
from flask_wtf.csrf import CSRFProtect
from antrian.models import Tuser
from flask_wtf.file import FileField,FileAllowed
from datetime import datetime

class user_F(FlaskForm):
    tiperawat = SelectField(u'Tipe Rawat :', choices=[('Rawat_jalan','Rawat Jalan'),('Rawat_Inap','Rawat Inap')], validators=[DataRequired()])
    kategori = SelectField(u'Kategori :', choices=[('BPJS','BPJS'),('UMUM','UMUM')], validators=[DataRequired()])
    poli = SelectField(u'Poli :', choices=[('Poli_Anak','Poli Anak'),
                                           ('Poli_Gigi_dan_Mulut','Poli Gigi dan Mulut'),
                                           ('Poli_Rehabilitasi_Medik','Poli Rehabilitasi Medik'),
                                           ('Poli_Jantung','Poli Jantung'),
                                           ('Poli_Paru','Poli Paru'),
                                           ('Poli_Saraf','Poli Saraf'),
                                           ('Poli_Mata','Poli Mata'),
                                           ('Poli_Kulit_dan_Kelamin','Poli Kulit dan Kelamin'),
                                           ('Poli_Gigi_dan_Mulut','Poli Gigi dan Mulut'),
                                           ('Poli_Tumbuh_Kembang_Anak','Poli Tumbuh Kembang Anak'),
                                           ('Poli_Bedah_Umum','Poli Bedah Umum'),
                                           ('Poli_Penyakit_Dalam','Poli Penyakit Dalam'),
                                           ('UGD','UGD'),
                                           ], validators=[DataRequired()])
    submit = SubmitField('Buat antrian')



        

