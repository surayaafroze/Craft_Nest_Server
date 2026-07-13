import express from 'express';
import { getTopContributors, getBlogPreview, subscribeNewsletter, getPlatformStatistics } from '../controllers/home.controller';

const router = express.Router();

router.get('/statistics', getPlatformStatistics);
router.get('/top-contributors', getTopContributors);
router.get('/blog-preview', getBlogPreview);
router.post('/newsletter', subscribeNewsletter);

export default router;
