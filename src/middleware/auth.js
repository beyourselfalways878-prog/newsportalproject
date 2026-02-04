import { verifyToken } from '../config/jwt.js';

export const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'No token provided'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = verifyToken(token);

        // Add user info to request
        req.user = decoded;

        next();
    } catch (error) {
        return res.status(401).json({
            error: 'Invalid or expired token'
        });
    }
};

// Optional: Role-based middleware
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Insufficient permissions'
            });
        }

        next();
    };
};
