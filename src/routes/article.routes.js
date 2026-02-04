import express from 'express';
import { articleController } from '../controllers/article.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/articles', articleController.list);
router.get('/trending-topics', articleController.getTrending);
router.get('/articles/:id', articleController.get);

// Protected routes (admin/editor only)
router.post('/create-article', authenticate, authorize('admin', 'editor'), articleController.create);
router.put('/articles/:id', authenticate, authorize('admin', 'editor'), articleController.update);
router.delete('/articles/:id', authenticate, authorize('admin', 'editor'), articleController.delete);
router.patch('/articles/:id/featured', authenticate, authorize('admin', 'editor'), articleController.toggleFeatured);
router.post('/upload-image', authenticate, authorize('admin', 'editor'), articleController.uploadImage);
router.post('/upload-video', authenticate, authorize('admin', 'editor'), articleController.uploadVideo);

export default router;

