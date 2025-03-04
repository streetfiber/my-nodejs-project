from flask import Flask, render_template, redirect, url_for, Blueprint, flash,request,jsonify,send_file,Response
from antrian.admin.forms import user_F
from datetime import datetime
from antrian.models import Tuser
from antrian import db, bcrypt
from flask_login import login_user, current_user, logout_user, login_required
from escpos.printer import Usb
import os
import secrets
from antrian import app
from PIL import Image
import pandas as pd
from io import BytesIO
import os
import tempfile
import pytz
from datetime import datetime
from datetime import date
from sqlalchemy.sql import extract  # Import extract


rantri = Blueprint('rantri',__name__)

@rantri.route("/")
def index():
    return render_template("index.html")

@rantri.route("/ambilantrian", methods=["GET", "POST"])
def ambilantrian():
    form = user_F()
    if request.method == 'POST' and form.validate_on_submit():
        # Buat nomor antrian berurutan
        last_user = Tuser.query.order_by(Tuser.id.desc()).first()
        new_no_antrian = f"A{last_user.id + 1}" if last_user else "A1"

        # Simpan data ke database
        new_user = Tuser(
            noantrian=new_no_antrian,
            tiperawat=form.tiperawat.data,
            kategori=form.kategori.data,
            poli=form.poli.data
        )

        db.session.add(new_user)
        db.session.commit()

        flash(f'Antrian {new_no_antrian} berhasil dibuat!', 'success')
        return redirect(url_for('rantri.nomor_antrian', nomor=new_no_antrian, tipe=form.tiperawat.data, poli=form.poli.data, kategori=form.kategori.data))

    return render_template('form_antrian.html', form=form)

# Sesuaikan dengan printer Epson TM-T83II
printer = Usb(0x04B8, 0x0E27)

@app.route('/nomor_antrian')
def nomor_antrian():
    nomor = request.args.get('nomor')
    tipe = request.args.get('tipe')
    poli = request.args.get('poli')
    kategori = request.args.get('kategori')

    # Cetak nomor antrian
    printer.set(align="center", width=2, height=2)
    printer.text("NOMOR ANTRIAN\n")
    printer.text("----------------------\n")
    
    printer.set(align="center", width=3, height=3)
    printer.text(f"{nomor}\n")
    
    printer.set(align="center", width=2, height=2)
    printer.text(f"{tipe} - {poli}\n")
    
    printer.set(align="center", width=1, height=1)
    printer.text(f"Kategori: {kategori}\n")
    
    printer.text("----------------------\n")
    printer.text("Terima Kasih!\n\n")
    
    printer.cut()

    return render_template('nomor_antrian.html', nomor=nomor, tipe=tipe, poli=poli, kategori=kategori)

