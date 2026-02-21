import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import pino from 'pino';
import { env } from './config/env.js';
import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import barangaysRoutes from './modules/barangays/barangays.routes.js';
import projectsRoutes from './modules/projects/projects.routes.js';
import { mediaRouter } from './modules/media/media.routes.js';
import fundingSourcesRoutes from './modules/funding-sources/funding-sources.routes.js';
import announcementsRoutes from './modules/announcements/announcements.routes.js';
import contactsRoutes from './modules/contacts/contacts.routes.js';
import notificationsRoutes from './modules/notifications/notifications.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import passport from './config/passport.js';

import { errorHandler } from './middleware/error.middleware.js';

export const app = express();

const logger = pino({
  name: 'ormoc-pis',
  level: env.NODE_ENV === 'development' ? 'debug' : 'info',
});

app.use(pinoHttp({ logger }));

app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [env.CLIENT_URL];
      allowedOrigins.push('https://civicconnect-pi.vercel.app');
      if (env.NODE_ENV === 'development') {
        allowedOrigins.push('http://localhost:5173');
        allowedOrigins.push('http://127.0.0.1:5173');
      }
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/barangays', barangaysRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/media', mediaRouter);
app.use('/api/funding-sources', fundingSourcesRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

app.use(errorHandler);

export default app;
