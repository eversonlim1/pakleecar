const { getSupabase } = require('../../lib/supabase');
const { verifyToken } = require('../../lib/auth');

const ROUTES = ['seoul', 'nami', 'dmz'];

module.exports = async (req, res) => {
  if (!verifyToken(req.headers['x-admin-token'], process.env.ADMIN_PASSWORD)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { id } = req.query;
  const supabase = getSupabase();

  if (req.method === 'PUT') {
    const { tour_date, route, pax, note } = req.body || {};
    if (!tour_date || !ROUTES.includes(route) || !Number.isInteger(pax) || pax < 1 || pax > 8) {
      res.status(400).json({ error: 'tour_date, route (seoul|nami|dmz), pax (integer 1-8) are required' });
      return;
    }
    const { data, error } = await supabase
      .from('bookings')
      .update({ tour_date, route, pax, note: note || null })
      .eq('id', id)
      .select()
      .single();
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(200).json({ booking: data });
    return;
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('bookings').delete().eq('id', id);
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(204).end();
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
