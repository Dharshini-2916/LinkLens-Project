import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import linkRoutes from './routes/linkRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js'; // <-- NEW IMPORT
import { redirectLink } from './controllers/linkController.js';

dotenv.config();

const app = express();

app.set('trust proxy', true);

app.use(cors({
  origin: [process.env.CLIENT_URL, 'http://localhost:3000', 'http://localhost:5173'].filter(Boolean),
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'LinkLens API is running smoothly',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/links', linkRoutes);
app.use('/api/analytics', analyticsRoutes); // <-- MOUNT ANALYTICS ROUTES

// URL Redirect Route (MUST BE LAST before 404 handler)
app.get('/:shortCode', redirectLink);

app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `Route ${req.originalUrl} not found` 
  });
});

app.use(errorHandler);

export default app;