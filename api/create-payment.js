const midtransClient = require('midtrans-client');

const snap = new midtransClient.Snap({
  isProduction: true,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const { plan_name, price, user_email, user_id } = req.body;

    // Validasi input
    if (!plan_name || !price || !user_email || !user_id) {
      return res.status(400).json({ error: 'Data tidak lengkap' });
    }

    const orderId = `GDD-${plan_name.toUpperCase()}-${user_id.substring(0, 5)}-${Date.now()}`;

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: price,
      },
      item_details: [
        {
          id: plan_name.toLowerCase(),
          price: price,
          quantity: 1,
          name: `Langganan GDD.ai - ${plan_name}`,
        },
      ],
      customer_details: {
        email: user_email,
      },
      // Callbacks opsional - bisa dihapus atau disesuaikan
      // callbacks: {
      //   finish: 'https://yourapp.com/payment/finish',
      //   error: 'https://yourapp.com/payment/error', 
      //   pending: 'https://yourapp.com/payment/pending'
      // }
    };

    console.log('Creating transaction with parameter:', JSON.stringify(parameter, null, 2));

    const transaction = await snap.createTransaction(parameter);
    
    console.log('Midtrans response:', JSON.stringify(transaction, null, 2));

    // Pastikan response memiliki struktur yang konsisten
    const response = {
      success: true,
      order_id: orderId,
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      // Tambahkan data lain yang mungkin dibutuhkan
      transaction_details: {
        order_id: orderId,
        gross_amount: price,
        plan_name: plan_name
      }
    };

    console.log('Sending response to Flutter:', JSON.stringify(response, null, 2));

    res.status(200).json(response);
  } catch (err) {
    console.error('Error membuat transaksi:', err);
    res.status(500).json({ 
      success: false,
      error: err.message || 'Terjadi kesalahan internal server',
      details: process.env.NODE_ENV === 'production' ? err.stack : undefined
    });
  }
};