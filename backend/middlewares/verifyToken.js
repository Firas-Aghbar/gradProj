const jwt = require('jsonwebtoken');
const SECRET_KEY = 'your_jwt_secret_key'; // Use the same secret key used for signing the tokens

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(403).send({ message: 'No token provided.' });
  }

    jwt.verify(token.split(' ')[1], SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(500).send({ message: 'Failed to authenticate token.' });
    }

    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  });
};

module.exports = verifyToken;



/*


// Middleware to verify Firebase ID token
const authenticateFirebase = async (req, res, next) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];

    if (!idToken) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Error verifying Firebase ID token:', error);
        return res.status(403).json({ error: 'Unauthorized' });
    }
};

module.exports = authenticateFirebase;


*/