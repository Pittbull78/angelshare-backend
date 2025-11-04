const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // --- Temporary Debug Endpoint ---
  if (req.method === 'GET') {
    return res.status(200).json({
      message: "This is the debug endpoint.",
      stripe_key_type: typeof process.env.STRIPE_SECRET_KEY,
      stripe_key_exists: !!process.env.STRIPE_SECRET_KEY,
      stripe_key_starts_with_sk: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.startsWith('sk_') : 'N/A',
      stripe_key_is_live: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.startsWith('sk_live_') : 'N/A',
    });
  }

  // --- CORS Configuration ---
  const allowedOrigins = ['https://angelsharegreetingcards.com', 'http://localhost:5173'];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    return res.status(403).json({ error: 'Origin not allowed' });
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // --- Payment Intent Logic ---
  if (req.method === 'POST') {
    try {
      if (!req.body || typeof req.body.amount !== 'number') {
        return res.status(400).json({ error: 'Invalid request: Please provide an amount in cents.' });
      }
      const { amount } = req.body;
      if (amount < 50) {
        return res.status(400).json({ error: 'Amount must be at least 50 cents.' });
      }
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
      });
      res.status(200).send({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error) {
      res.status(500).json({ error: `Internal Server Error: ${error.message}` });
    }
  } else {
    res.setHeader('Allow', ['POST', 'OPTIONS']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
