import app from './src/app';
import { connectDb, closeDb } from './src/config/db';

const port = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Connect to Prisma PostgreSQL Singleton
    await connectDb();
    
    // 2. Start listening on the configured Port
    const server = app.listen(port, () => {
      console.log(`[server]: Server is running at http://localhost:${port}`);
    });

    // 3. Graceful shutdown handler
    const gracefulShutdown = async () => {
      console.log('Shutting down server...');
      server.close(async () => {
        console.log('Server HTTP server closed.');
        await closeDb();
        process.exit(0);
      });
    };

    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
