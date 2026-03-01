import { auth } from '../config/firebase.js';

// Protect routes by verifying Firebase ID tokens
export const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ error: 'No token provided, access denied' });
    }

    try {
        const decodedToken = await auth.verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Auth verification error:', error.message);
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// Authorize specific roles (stored as custom claims in Firebase or fetched from Firestore)
export const authorize = (...roles) => {
    return (req, res, next) => {
        // req.user has custom claims or we check the 'role' field we've added to the token
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: `User role '${req.user.role}' is not authorized to access this route` });
        }
        next();
    };
};
