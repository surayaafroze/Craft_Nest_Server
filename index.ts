import app from './src/app';
import { connectDb } from './src/config/db';
import { initDbCollectionsAndIndexes } from './src/config/dbInit';

// Vercel serverless function entrypoint
// Connect to the database and initialize indexes
connectDb()
  .then((db) => initDbCollectionsAndIndexes(db))
  .catch((err) => console.error('Failed to connect to MongoDB in Vercel Serverless:', err));

// Export the express app for Vercel
export default app;
