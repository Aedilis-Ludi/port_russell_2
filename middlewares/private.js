const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || process.env.SECRET_KEY;

function extractToken(req) {
  const authHeader = (req.headers.authorization || '').toString();
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }
  if (req.headers['x-access-token']) {
    return req.headers['x-access-token'];
  }
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  return null;
}

function isApiRequest(req) {
  // originalUrl contient le chemin complet depuis la racine, donc ça marche même si
  // on est dans un router monté (contrairement à req.path).
  return req.originalUrl.startsWith('/api/');
}

exports.checkJWT = (req, res, next) => {
  console.log("=== checkJWT: headers ===", {
    authorization: req.headers.authorization,
    x_access_token: req.headers['x-access-token'],
    cookies: req.cookies,
    originalUrl: req.originalUrl,
    path: req.path,
  });

  const token = extractToken(req);
  console.log("=== checkJWT: extracted token ===", token ? token.slice(0, 10) + "..." : null);

  if (!token) {
    if (isApiRequest(req)) {
      return res.status(401).json({ message: 'token_required' });
    }
    return res.redirect('/?error=missing_token');
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded.user ? decoded.user : decoded;
    console.log("=== checkJWT: token valid for user ===", req.user);
    next();
  } catch (err) {
    console.log("=== checkJWT: token invalid ===", err.message);
    if (isApiRequest(req)) {
      return res.status(401).json({ message: 'token_not_valid' });
    }
    return res.redirect('/?error=invalid_token');
  }
};
