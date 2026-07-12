import express from 'express';
import { getTopContributors, getBlogPreview, subscribeNewsletter } from '../controllers/home.controller';

const router = express.Router();

router.get('/top-contributors', getTopContributors);
router.get('/blog-preview', getBlogPreview);
router.post('/newsletter', subscribeNewsletter);

export default router;
