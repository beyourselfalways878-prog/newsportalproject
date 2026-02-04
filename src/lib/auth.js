import jwt from 'jsonwebtoken';

const JWT_SECRET = import.meta.env.VITE_JWT_SECRET || process.env.JWT_SECRET || 'your-secret-key';

export function generateToken(userId, role = 'user') {
    return jwt.sign(
        { userId, role, iat: Math.floor(Date.now() / 1000) },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
}

export function getTokenFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.split(' ')[1];
}

export function extractUserFromToken(token) {
    const decoded = verifyToken(token);
    if (!decoded) return null;
    return {
        id: decoded.userId,
        role: decoded.role,
    };
}
