const { getSupabase } = require('../lib/supabase');
const { verifyToken } = require('../lib/auth');

const ROUTES = ['seoul', 'nami', 'dmz'];

module.exports = async (req, res) => {
  if (!verifyToken(req.headers['x-admin-token'], process.env.ADMIN_PASSWORD)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const supabase = getSupabase();

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('bookings')
      .select('id, tour_date, route, pax, note, created_at')
      .order('tour_date', { ascending: true });
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(200).json({ bookings: data });
    return;
  }

  if (req.method === 'POST') {
    const { tour_date, route, pax, note } = req.body || {};
    if (!tour_date || !ROUTES.includes(route) || !Number.isInteger(pax) || pax < 1) {
      res.status(400).json({ error: 'tour_date, route (seoul|nami|dmz), pax (positive integer) are required' });
      return;
    }
    const { data, error } = await supabase
      .from('bookings')
      .insert({ tour_date, route, pax, note: note || null })
      .select()
      .single();
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(201).json({ booking: data });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
