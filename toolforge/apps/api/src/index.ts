import mongoose from 'mongoose';
import { createServer } from 'http';

import { config } from './config/index.js';
import { createApp } from './app.js';
import { setupSocketServer } from './socket/index.js';

async function bootstrap() {
  const app = createApp();
  const httpServer = createServer(app);

  // Setup Socket.IO
  setupSocketServer(httpServer);

  // Connect to MongoDB
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }

  // Handle MongoDB connection events
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
  });

  // Start server
  httpServer.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
    console.log(`Environment: ${config.nodeEnv}`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down...');
    await mongoose.connection.close();
    httpServer.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
