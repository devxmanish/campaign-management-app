import express, { Express } from 'express';
import cors from 'cors';
import { config } from './config';
import routes from './routes';
import authRoutes from './routes/auth.routes';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';

const app: Express = express();

// CORS configuration - support multiple origins for different environments
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    // Parse allowed origins from environment (comma-separated)
    const allowedOrigins = config.frontendUrl
      .split(',')
      .map(url => url.trim())
      .filter(url => url.length > 0);
    
    // In development, allow localhost origins
    if (config.nodeEnv === 'development') {
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
    }
    
    // Check if the origin is in our allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Reject origins not in the allowed list
    callback(new Error('CORS not allowed'), false);
  },
  credentials: true,
};

app.use(cors(corsOptions));

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
