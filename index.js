
require('dotenv').config(); // Memuat variabel dari .env
const express = require('express');
const midtransClient = require('midtrans-client');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Mengizinkan request dari semua origin (untuk development)
app.use(express.json()); // Mem-parse body request sebagai JSON

// Inisialisasi Midtrans Snap API
let snap = new midtransClient.Snap({
    isProduction: false, // Set ke true jika sudah di produksi
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY
});

// Endpoint untuk cek status server
app.get('/', (req, res) => {
  res.send('Backend GDD.ai Aktif!');
});

// Endpoint untuk membuat transaksi pembayaran
app.post('/api/create-payment', async (req, res) => {
    try {
        // Ambil data dari body request yang dikirim Flutter
        const { plan_name, price, user_email, user_id } = req.body;

        if (!plan_name || !price || !user_email || !user_id) {
            return res.status(400).json({ error: 'Data tidak lengkap' });
        }

        // Buat order ID yang unik
        const orderId = `GDD-${plan_name.toUpperCase()}-${user_id.substring(0, 5)}-${Date.now()}`;

        let parameter = {
            "transaction_details": {
                "order_id": orderId,
                "gross_amount": price
            },
            "item_details": [{
                "id": plan_name.toLowerCase(),
                "price": price,
                "quantity": 1,
                "name": `Langganan GDD.ai - ${plan_name}`
            }],
            "customer_details": {
                "email": user_email,
            },
            // Anda bisa tambahkan callback URL jika diperlukan
            // "callbacks": {
            //     "finish": "https://website-anda.com/finish"
            // }
        };

        console.log("Membuat transaksi untuk:", parameter);

        // Panggil Midtrans untuk mendapatkan token
        const transaction = await snap.createTransaction(parameter);
        
        console.log("Transaksi berhasil dibuat:", transaction);
        
        // Kirim token kembali ke Flutter
        res.status(200).json(transaction);

    } catch (error) {
        console.error("Error membuat transaksi:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// Jalankan server
app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});