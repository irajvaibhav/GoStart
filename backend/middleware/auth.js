// middleware/auth.js
// protects routes - checks for Bearer token in Authorization header
// if valid, attaches userId to req.user so routes can use it

const jwt = require('jsonwebtoken');

// this is express "middleware" - a function that runs BEFORE the actual
// route handler. any route file that does router.get('/x', auth, handler)
// runs this first; calling next() lets the request continue to handler,
// returning a response (like the 401s below) stops it there instead.
const auth = (req, res, next) => {
  // mobile app sends this header as: Authorization: Bearer <token>
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token, access denied' });
  }

  const token = header.split(' ')[1]; // "Bearer xyz123" -> "xyz123"

  try {
    // throws if signature doesn't match JWT_SECRET or token is expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // every route after this can read req.user to know who's calling
    req.user = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token is invalid or expired' });
  }
};

module.exports = auth;
