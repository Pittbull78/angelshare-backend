const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  console.log('[BE] Function invoked');

  // --- CORS Configuration ---
  const allowedOrigins = ['https://angelsharegreetingcards.com', 'http://localhost:5173'];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    console.log(`[BE] CORS check passed for origin: ${origin}`);
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    console.error(`[BE] CORS check FAILED for origin: ${origin}`);
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    return res.status(403).json({ error: 'Origin not allowed' });
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    console.log('[BE] Responding to OPTIONS preflight request');
    return res.status(204).end();
  }

  // --- Payment Intent Logic ---
  if (req.method === 'POST') {
    console.log('[BE] Handling POST request');
    try {
      console.log('[BE] Request body:', req.body);
      if (!req.body || typeof req.body.amount !== 'number') {
        console.error("[BE] Bad request: Missing or invalid amount.", req.body);
        return res.status(400).json({ error: 'Invalid request: Please provide an amount in cents.' });
      }

      const { amount } = req.body;

      if (amount < 50) {
        console.error("[BE] Bad request: Amount too small.", { amount });
        return res.status(400).json({ error: 'Amount must be at least 50 cents.' });
      }

      console.log(`[BE] Attempting to create Payment Intent for amount: ${amount} cents`);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
      });

      console.log(`[BE] Successfully created Payment Intent: ${paymentIntent.id}`);

      res.status(200).send({
        clientSecret: paymentIntent.client_secret,
      });

    } catch (error) {
      console.error('[BE] Stripe API Error! Full error object:', JSON.stringify(error, null, 2));
      res.status(500).json({ error: `Internal Server Error: ${error.message}` });
    }
  } else {
    console.warn(`[BE] Method not allowed: ${req.method}`);
    res.setHeader('Allow', ['POST', 'OPTIONS']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
