import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';
import { createApp } from '../apps/api/src/app.js';

const app = createApp();

let isConnected = false;

async function connectDB() {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI environment variable is not set');

  await mongoose.connect(uri);
  isConnected = true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await connectDB();
  app(req, res);
}
