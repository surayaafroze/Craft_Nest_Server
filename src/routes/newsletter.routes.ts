import { Router } from 'express';
import { subscribe } from '../controllers/newsletter.controller';
import { validate } from '../middleware/validate';
import { subscribeNewsletterSchema } from '../validators/newsletter.validator';

const router = Router();

// Public route
router.post('/', validate(subscribeNewsletterSchema), subscribe as any);

export default router;
