import express, { Application, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import itemRoutes from './routes/item.routes';
import reviewRoutes from './routes/review.routes';
import wishlistRoutes from './routes/wishlist.routes';
import analyticsRoutes from './routes/analytics.routes';
import homeRoutes from './routes/home.routes';
import blogRoutes from './routes/blog.routes';
import newsletterRoutes from './routes/newsletter.routes';
import contactRoutes from './routes/contact.routes';

dotenv.config();

const app: Application = express();

// Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/home', homeRoutes);
app.use('/api', reviewRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/contact', contactRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

export default app;
