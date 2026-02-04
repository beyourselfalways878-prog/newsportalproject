import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const jwtConfig = {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    algorithm: process.env.JWT_ALGORITHM || 'HS256',
    issuer: 'firebase-backend',
    audience: 'my-app-client'
};

// Generate JWT token
export const generateToken = (payload) => {
    return jwt.sign(
        {
            ...payload,
            iat: Math.floor(Date.now() / 1000),
            iss: jwtConfig.issuer,
            aud: jwtConfig.audience
        },
        jwtConfig.secret,
        {
            algorithm: jwtConfig.algorithm,
            expiresIn: jwtConfig.expiresIn
        }
    );
};

// Verify JWT token
export const verifyToken = (token) => {
    try {
        return jwt.verify(token, jwtConfig.secret, {
            algorithms: [jwtConfig.algorithm],
            issuer: jwtConfig.issuer,
            audience: jwtConfig.audience
        });
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
};

// Decode token without verification (for debugging)
export const decodeToken = (token) => {
    return jwt.decode(token);
};
