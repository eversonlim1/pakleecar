const crypto = require('crypto');
const { makeToken } = require('../lib/auth');

function passwordsMatch(password, expected) {
  if (!password || typeof password !== 'string') return false;
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

module.exports = (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const password = req.body && req.body.password;
  if (!passwordsMatch(password, process.env.ADMIN_PASSWORD)) {
    res.status(401).json({ error: 'Invalid password' });
    return;
  }
  res.status(200).json({ token: makeToken(process.env.ADMIN_PASSWORD) });
};
