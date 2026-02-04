import express from 'express';
import authRoutes from './auth.routes.js';
import articleRoutes from './article.routes.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Auth routes
router.use('/auth', authRoutes);

// Article routes
router.use('/', articleRoutes);


// Protected API routes
router.get('/protected', authenticate, (req, res) => {
    res.json({
        success: true,
        message: 'This is a protected route',
        user: req.user
    });
});

// Admin-only route
router.get('/admin', authenticate, authorize('admin'), (req, res) => {
    res.json({
        success: true,
        message: 'Welcome admin!',
        user: req.user
    });
});

export default router;
