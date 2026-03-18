export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify the callback and update order status
  console.log('Payment callback received:', req.body);

  // In a real app, you'd verify the payment status and update your database
  // For now, just acknowledge the callback
  res.status(200).send('OK');
}