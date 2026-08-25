const { getSupabase } = require('../lib/supabase');

const ROUTES = ['seoul', 'nami', 'dmz'];

function statusFor(pax) {
  if (pax >= 8) return 'full';
  if (pax >= 4) return 'confirmed';
  return 'pending';
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { route, month } = req.query;
  if (!ROUTES.includes(route) || !/^\d{4}-\d{2}$/.test(month || '')) {
    res.status(400).json({ error: 'route (seoul|nami|dmz) and month (YYYY-MM) are required' });
    return;
  }

  const [year, monthNum] = month.split('-').map(Number);
  const from = `${month}-01`;
  const lastDay = new Date(year, monthNum, 0).getDate();
  const to = `${month}-${String(lastDay).padStart(2, '0')}`;

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('bookings')
    .select('tour_date, pax')
    .eq('route', route)
    .gte('tour_date', from)
    .lte('tour_date', to);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const totals = {};
  for (const row of data) {
    totals[row.tour_date] = (totals[row.tour_date] || 0) + row.pax;
  }
  const days = Object.keys(totals)
    .sort()
    .map((date) => ({ date, pax: totals[date], status: statusFor(totals[date]) }));

  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  res.status(200).json({ days });
};
