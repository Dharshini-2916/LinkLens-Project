import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import linkRoutes from './routes/linkRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import { redirectLink } from './controllers/linkController.js';

dotenv.config();

const app = express();

app.set('trust proxy', true);

// FIXED CORS
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'LinkLens API is running smoothly',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/links', linkRoutes);
app.use('/api/analytics', analyticsRoutes);

// URL redirect route (keep this last before 404)
app.get('/:shortCode', redirectLink);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use(errorHandler);

export default app;