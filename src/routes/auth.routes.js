import express from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/signin', authController.login); // Frontend alias
router.post('/refresh-token', authenticate, authController.refreshToken);

// Protected routes (require authentication)
router.get('/profile', authenticate, authController.getProfile);
router.get('/profile/:userId', authenticate, authController.getProfile); // Support for frontend param-based fetch
router.post('/logout', authenticate, authController.logout);
router.post('/signout', authenticate, authController.logout); // Frontend alias

export default router;
