const { makeToken } = require('../lib/auth');

module.exports = (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const password = req.body && req.body.password;
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    res.status(401).json({ error: 'Invalid password' });
    return;
  }
  res.status(200).json({ token: makeToken(process.env.ADMIN_PASSWORD) });
};
