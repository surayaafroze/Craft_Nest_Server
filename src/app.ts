import express, { Application, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import dashboardRoutes from './routes/dashboard.routes';
import itemRoutes from './routes/item.routes';
import reviewRoutes from './routes/review.routes';
import wishlistRoutes from './routes/wishlist.routes';
import analyticsRoutes from './routes/analytics.routes';
import homeRoutes from './routes/home.routes';
import blogRoutes from './routes/blog.routes';
import newsletterRoutes from './routes/newsletter.routes';
import contactRoutes from './routes/contact.routes';
import categoryRoutes from './routes/category.routes';
import { connectDb } from './config/db';

dotenv.config();

const app: Application = express();

// Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Request logger middleware
app.use((req: Request, _res: Response, next) => {
  if (req.path !== '/favicon.ico' && process.env.NODE_ENV !== 'test') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
});

// Ignore favicon requests immediately
app.get('/favicon.ico', (req: Request, res: Response) => {
  res.status(204).end();
});

// Ensure DB is connected before handling any API requests
app.use(async (req: Request, res: Response, next) => {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is missing.');
    return res.status(500).json({
      success: false,
      message: 'Server configuration error: DATABASE_URL is missing. Please set DATABASE_URL in Vercel Environment Variables.'
    });
  }

  try {
    await connectDb();
    next();
  } catch (error: any) {
    console.error('Database connection failed in middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error: Database connection failed',
      error: error?.message
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/home', homeRoutes);
app.use('/api', reviewRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/categories', categoryRoutes);

app.get('/', (req: Request, res: Response) => {
  res.json({ success: true, message: 'CraftNest API is running' });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: err?.message || 'Internal Server Error'
  });
});

export default app;
