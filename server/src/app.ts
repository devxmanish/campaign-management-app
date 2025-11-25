import express, { Express } from 'express';
import cors from 'cors';
import { config } from './config';
import routes from './routes';
import authRoutes from './routes/auth.routes';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';

const app: Express = express();

// CORS configuration
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DEPRECATED: Mount auth routes at /auth for backward compatibility
// This handles cases where frontend has VITE_API_URL without /api suffix
// TODO: Remove this once frontend is updated to use /api/auth endpoints
app.use('/auth', authRoutes);

// API routes
app.use('/api', routes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

export default app;
