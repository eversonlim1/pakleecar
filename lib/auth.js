const crypto = require('crypto');

function todayStamp() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD, UTC
}

function makeToken(password) {
  return crypto.createHmac('sha256', password).update(todayStamp()).digest('hex');
}

function verifyToken(token, password) {
  if (!token || typeof token !== 'string') return false;
  const expected = makeToken(password);
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

module.exports = { makeToken, verifyToken };
