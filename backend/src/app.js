/**
 * app.js — Express Application Setup
 *
 * Configures and exports the Express app instance.
 * Responsibilities:
 *   - Security middleware (helmet, cors, rate-limiting)
 *   - Body/cookie parsers
 *   - HTTP logging (morgan)
 *   - API routes
 *   - 404 handler
 *   - Global error handler
 *
 * Does NOT start the HTTP server — that is server.js's job.
 */

import express      from 'express';
import helmet       from 'helmet';
import cors         from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit    from 'express-rate-limit';

import env          from './config/env.js';
import serverConfig from './config/server.js';
import routes       from './routes/index.js';
import { httpLogger }   from './middlewares/morgan.middleware.js';
import { notFound }     from './middlewares/notFound.middleware.js';
import { errorHandler } from './middlewares/error.middleware.js';

const app = express();

// ─── 1. Security Headers (Helmet) ─────────────────────────────────────────────
app.use(helmet());

// ─── 2. CORS ──────────────────────────────────────────────────────────────────
app.use(cors({
  origin         : env.cors.origin,
  methods        : serverConfig.allowedMethods,
  allowedHeaders : ['Content-Type', 'Authorization'],
  credentials    : true,           // allow cookies / auth headers
}));

// ─── 3. Global Rate Limiting ──────────────────────────────────────────────────
app.use(rateLimit({
  windowMs      : env.rateLimit.windowMs, // default: 15 minutes
  max           : env.rateLimit.max,      // default: 100 requests per window
  standardHeaders: true,
  legacyHeaders : false,
  message       : { success: false, message: 'Too many requests. Please try again later.' },
}));

// ─── 4. Body Parsers ──────────────────────────────────────────────────────────
app.use(express.json({ limit: serverConfig.jsonLimit }));
app.use(express.urlencoded({ extended: true, limit: serverConfig.urlencodedLimit }));

// ─── 5. Cookie Parser ─────────────────────────────────────────────────────────
app.use(cookieParser());

// ─── 6. HTTP Request Logger (Morgan → Winston) ────────────────────────────────
app.use(httpLogger);

// ─── 7. Serve Static Frontend Files ───────────────────────────────────────────
app.use(express.static('public'));

// ─── 8. API Routes ────────────────────────────────────────────────────────────
app.use(serverConfig.apiPrefix, routes);

// ─── 8. 404 — Unknown Route ───────────────────────────────────────────────────
app.use(notFound);

// ─── 9. Global Error Handler (MUST be last) ───────────────────────────────────
app.use(errorHandler);

export default app;
