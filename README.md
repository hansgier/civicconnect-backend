# Ormoc City Project Tracking System (Backend)

Backend API for the Ormoc City Project Tracking System (Ormoc PIS), built with Express, TypeScript, and PostgreSQL.

## Overview

This backend service powers a full-stack project tracking system designed for barangays in Ormoc City. It bridges the communication gap between residents and city administration regarding local infrastructure projects through RESTful APIs, real-time updates, and comprehensive data management.

## Features

- **RESTful API** with Express.js and TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based auth with Passport (Google, Facebook OAuth)
- **Role-based Access Control** (RBAC) for admins, assistants, and residents
- **File Uploads**: Cloudinary integration with Multer
- **Email Notifications**: Nodemailer for transactional emails
- **Real-time Updates**: Socket.io for live project updates
- **Background Jobs**: pg-boss for async job processing
- **Caching**: Redis with node-cache for performance optimization
- **Rate Limiting**: Flexible rate limiting with rate-limiter-flexible
- **Input Validation**: Zod schemas for request validation
- **Security**: Helmet, CORS, sanitize-html for security headers and XSS protection

## Tech Stack

- **Runtime**: Node.js 24+
- **Framework**: Express.js 5.x
- **Language**: TypeScript 5.9+
- **Database**: PostgreSQL 15+
- **ORM**: Prisma 7.3+
- **Testing**: Vitest
- **Linting**: ESLint with TypeScript support
- **Logging**: Pino with HTTP request logging

## Quick Start

### Prerequisites

- Node.js >= 24.0.0
- PostgreSQL 15+
- Redis (optional, for caching)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment:**
   Create a `.env` file in the backend directory:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/ormoc_pis"
   JWT_SECRET="your-secret-key"
   JWT_REFRESH_SECRET="your-refresh-secret"
   PORT=5000
   
   # OAuth (optional)
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   FACEBOOK_APP_ID="your-facebook-app-id"
   FACEBOOK_APP_SECRET="your-facebook-app-secret"
   
   # Cloudinary (for file uploads)
   CLOUDINARY_CLOUD_NAME="your-cloud-name"
   CLOUDINARY_API_KEY="your-api-key"
   CLOUDINARY_API_SECRET="your-api-secret"
   
   # Email (optional)
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=587
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-app-password"
   ```

3. **Database Setup:**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Run migrations
   npm run db:migrate
   
   # Seed database (optional)
   npm run db:seed
   ```

4. **Run Development Server:**
   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run test` - Run tests with Vitest (watch mode)
- `npm run test:run` - Run tests once

### Database Commands

- `npm run db:migrate` - Run Prisma migrations
- `npm run db:push` - Push schema changes (dev only)
- `npm run db:seed` - Seed database with initial data
- `npm run db:studio` - Open Prisma Studio (visual database manager)
- `npm run db:generate` - Generate Prisma client

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration (DB, Redis, etc.)
│   ├── middleware/      # Express middleware (auth, validation, etc.)
│   ├── modules/         # Feature modules
│   │   ├── auth/        # Authentication module
│   │   ├── users/       # User management
│   │   ├── projects/    # Project CRUD
│   │   ├── comments/    # Comments system
│   │   ├── reactions/   # Like/dislike reactions
│   │   ├── dashboard/   # Dashboard analytics
│   │   └── ...
│   ├── utils/           # Utility functions
│   └── server.ts        # Entry point
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Seed data
├── tests/               # Test files
└── dist/                # Compiled output
```

## API Documentation

The API follows RESTful conventions with the following main endpoints:

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `GET /api/users` - List users (admin only)
- `GET /api/projects` - List projects with pagination
- `GET /api/projects/:id` - Get project details
- `POST /api/projects` - Create project (admin only)
- `PATCH /api/projects/:id` - Update project (admin only)
- `DELETE /api/projects/:id` - Delete project (admin only)
- `GET /api/dashboard/summary` - Dashboard summary stats
- `GET /api/dashboard/status-trends` - Project status trends over time

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | Yes |
| `PORT` | Server port (default: 5000) | No |
| `NODE_ENV` | Environment (development/production) | No |
| `REDIS_URL` | Redis connection URL | No |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | No |
| `FACEBOOK_APP_ID` | Facebook app ID | No |
| `FACEBOOK_APP_SECRET` | Facebook app secret | No |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | No |
| `CLOUDINARY_API_KEY` | Cloudinary API key | No |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | No |
| `SMTP_HOST` | SMTP server host | No |
| `SMTP_PORT` | SMTP server port | No |
| `SMTP_USER` | SMTP username | No |
| `SMTP_PASS` | SMTP password | No |

## Testing

Run the test suite:

```bash
# Run tests in watch mode
npm run test

# Run tests once
npm run test:run
```

## Caching Strategy

The backend uses Redis/node-cache for caching:

- **Project Lists**: Cached for 5 minutes
- **Dashboard Data**: Cached for 5 minutes
- **User Sessions**: Cached for session duration
- **Static Data**: Longer cache times for reference data

Cache invalidation happens automatically on data mutations.

## Security Features

- **Helmet**: Security headers
- **CORS**: Configured for frontend origin
- **Rate Limiting**: API rate limiting per IP
- **Input Sanitization**: sanitize-html for user content
- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcryptjs for password storage
- **SQL Injection Protection**: Prisma ORM parameterized queries

## Recent Changes

See [CHANGELOG.md](./CHANGELOG.md) for detailed version history.

### Latest Updates (v1.0.0)

- Initial release with core features
- RESTful API with Express and TypeScript
- PostgreSQL database with Prisma ORM
- JWT and OAuth authentication
- Role-based access control
- Cloudinary file uploads
- Email notifications
- Real-time updates with Socket.io
- Background jobs with pg-boss

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Submit a pull request

## License

ISC

## Support

For issues or questions, please open an issue in the project repository.
