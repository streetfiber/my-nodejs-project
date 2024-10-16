const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const midtransClient = require('midtrans-client');
const axios = require('axios');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(bodyParser.json());


// Data sementara untuk menyimpan pembayaran
const paymentData = [];

// Midtrans API Configuration
const CLIENT_KEY = 'SB-Mid-client-HtrBVqThPeJpzv-l'; // Client Key langsung dimasukkan
const SERVER_KEY = 'SB-Mid-server-9cEe9pBpmC8XuB0zOw-A-Huq'; // Server Key langsung dimasukkan

// Endpoint untuk mengecek ketersediaan
app.get('/check-availability', async (req, res) => {
    try {
        const response = await fetch('https://script.google.com/macros/s/AKfycbw7qRvhQeKEt2-zQ6mvnU1jdghL3WtuLp9Jh-00BdKeJHdBtWSs8YyLJCzZ6g3uDZRWtQ/exec');
        const bookings = await response.json();

        console.log(bookings); // Tambahkan log untuk memeriksa isi bookings

        // Pastikan bookings adalah array
        if (!Array.isArray(bookings)) {
            return res.status(500).json({ error: 'Data tidak valid' });
        }

        // Proses bookings sesuai kebutuhan
        const isAvailable = bookings.some(booking => {
            return booking.tanggal_foto === req.query.tanggal_foto && booking.jam_foto === req.query.jam_foto;
        });

        res.json({ available: !isAvailable });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ error: 'Error fetching bookings' });
    }
});



// Endpoint untuk membuat link pembayaran Midtrans
app.post('/midtrans-payment', async (req, res) => {
    try {
        const { name, whatsapp, jumlah_orang, harga_total, tanggal_foto, jam_foto } = req.body;

        // Inisialisasi Midtrans Snap API Client
        const snap = new midtransClient.Snap({
            isProduction: false,
            clientKey: CLIENT_KEY,
            serverKey: SERVER_KEY
        });

        // Membuat parameter transaksi
        const orderId = `order-${Date.now()}`;
        const parameter = {
            transaction_details: {
                order_id: orderId,
                gross_amount: harga_total
            },
            customer_details: {
                first_name: name,
                email: `${whatsapp}@dummy.com`,
                phone: whatsapp
            },
            item_details: [
                {
                    id: 'photo_booking',
                    price: 30000,
                    quantity: jumlah_orang,
                    name: `Booking foto ${tanggal_foto} ${jam_foto}`
                }
            ],
            callbacks: {
                finish: 'https://my-nodejs-project-production.up.railway.app/midtrans-finish'
            }
        };

        // Membuat transaksi ke Midtrans
        const transaction = await snap.createTransaction(parameter);

        // Simpan data pembayaran sementara
        paymentData.push({
            name,
            whatsapp,
            jumlah_orang,
            tanggal_foto,
            jam_foto,
            harga_total,
            order_id: orderId,
            transaction_status: 'unpaid'
        });

        // Kirim data ke Google Spreadsheet (status 'unpaid')
        const scriptUrl = 'https://script.google.com/macros/s/AKfycbzu1Jzx1beUIWf068ca3BNkjsMs605jZuXVEpMBW7WGP8twXBhFqfX17P4cOo43XhM/exec';
        await fetch(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({
                ...paymentData[paymentData.length - 1],
                transaction_status: 'unpaid'
            }),
            headers: { 'Content-Type': 'application/json' }
        });

        // Mengembalikan link pembayaran ke frontend
        res.json({ redirect_url: transaction.redirect_url });
    } catch (error) {
        console.error('Error creating payment:', error);
        res.status(500).json({ error: 'Error creating payment' });
    }
});

// Endpoint untuk menangani notifikasi dari Midtrans
app.post('/midtrans-notification', async (req, res) => {
    try {
        const notification = req.body;
        const transactionStatus = notification.transaction_status || 'Status Tidak Tersedia';
        const orderID = notification.order_id || 'Order ID Tidak Tersedia';

        if (transactionStatus === 'settlement') {
            // Proses data pembayaran jika status 'settlement'
            const paymentDetail = paymentData.find(payment => payment.order_id === orderID);

            if (paymentDetail) {
                // Kirim data ke Google Spreadsheet dengan status 'paid'
                const scriptUrl = 'https://script.google.com/macros/s/AKfycbw7qRvhQeKEt2-zQ6mvnU1jdghL3WtuLp9Jh-00BdKeJHdBtWSs8YyLJCzZ6g3uDZRWtQ/exec';
                await fetch(scriptUrl, {
                    method: 'POST',
                    body: JSON.stringify({
                        name: paymentDetail.name,
                        whatsapp: paymentDetail.whatsapp,
                        jumlah_orang: paymentDetail.jumlah_orang,
                        tanggal_foto: paymentDetail.tanggal_foto,
                        jam_foto: paymentDetail.jam_foto,
                        harga_total: paymentDetail.harga_total,
                        order_id: paymentDetail.order_id,
                        transaction_status: 'paid'
                    }),
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // Kirim respons sukses ke Midtrans
        res.status(200).json({ message: 'Notifikasi diterima dan diproses' });
    } catch (error) {
        console.error('Error di notifikasi Midtrans:', error);
        res.status(500).json({ error: 'Terjadi kesalahan saat memproses notifikasi' });
    }
});

app.get('/midtrans-finish', (req, res) => {
    const { status_message, order_id } = req.query;

    // Ambil detail pembayaran berdasarkan order_id
    const paymentDetail = paymentData.find(payment => payment.order_id === order_id);

    // Periksa status transaksi dan tampilkan hasil ke pengguna
    if (paymentDetail) {
        res.send(`
             <!DOCTYPE html>
            <html lang="id">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Status Pembayaran</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f4f4f4;
                        margin: 0;
                        padding: 0;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                    }
                    .container {
                        background-color: #fff;
                        padding: 20px;
                        border-radius: 10px;
                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                        text-align: center;
                    }
                    h1 {
                        color: #28a745;
                    }
                    p {
                        font-size: 18px;
                        color: #333;
                    }
                    .footer {
                        margin-top: 20px;
                        font-size: 14px;
                        color: #888;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Terima kasih, ${paymentDetail.name}!</h1>
                    <p>Status pembayaran: <strong>${status_message}</strong></p>
                    <p>Order ID: ${order_id}</p>
                    <p>WhatsApp: ${paymentDetail.whatsapp}</p>
                    <p>Jumlah Orang: ${paymentDetail.jumlah_orang}</p>
                    <p>Tanggal Foto: ${paymentDetail.tanggal_foto}</p>
                    <p>Jam Foto: ${paymentDetail.jam_foto}</p>
                    <div class="footer">
                        <p>Jika ada pertanyaan, silakan hubungi kami melalui WhatsApp.</p>
                    </div>
                </div>
            </body>
            </html>
        `);
        
    } else {
        res.status(404).send('Transaksi tidak ditemukan.');
    }
});


// Menjalankan server
app.listen(3000, () => {
    console.log('Backend server running on port 3000');
});
