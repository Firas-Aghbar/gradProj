const jwt = require('jsonwebtoken');
const SECRET_KEY = 'your_jwt_secret_key'; // Use the same secret key used for signing the tokens

const verifyUserToken = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(403).send({ message: 'No token provided.' });
  }

  console.log({token});
  const decoded = jwt.decode(token)

    if (!decoded || decoded.role !== 'user') {
      return res.status(500).send({ message: 'Failed to authenticate token.' });
    }

    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  // });
};

module.exports = verifyUserToken;



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