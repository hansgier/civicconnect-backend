# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2026-02-19

### Fixed
- **Build Readiness**: Resolved critical TypeScript compilation errors across the backend to enable production deployment.
  - Implemented proper Express `User` type augmentation in `express.d.ts` for consistent `req.user` access.
  - Standardized asynchronous controller methods to explicitly return `Promise<void>` for Express compatibility.
  - Fixed Zod schema inference issues in Announcements and Notifications modules.
  - Corrected parameter type mismatches in Comments, Dashboard, Media, Projects, and Users services.
- **Production CORS Configuration**: Updated CORS middleware in `app.ts` to support dynamic origin validation, allowing both production `CLIENT_URL` and local development environments.
- **Dashboard Data Consistency**: Implemented cross-module cache invalidation for the dashboard.
  - Added `invalidateCache('dashboard:*')` in `ProjectsService`, `ReactionsService`, and `CommentsService` to ensure dashboard summary cards, trends, and top projects reflect the latest data immediately after any modification.
- **Comprehensive Lint Resolution**: Resolved 62 ESLint errors across the backend to improve code quality and maintainability.
  - Eliminated all `@typescript-eslint/no-explicit-any` errors by implementing proper types for Express request handlers, service methods, and aggregation results.
  - Fixed `@typescript-eslint/no-unused-vars` errors by using the `_` prefix convention for required framework parameters (e.g., Express `next` function).
  - Standardized error handling in `catch` blocks using `unknown` types.
  - Properly typed BullMQ workers and pg-boss job payloads in `email.worker.ts`.
  - Refined dashboard service aggregation results with specific interfaces.

### Added
- **Dashboard Status Trends API**: Added new endpoint `GET /api/dashboard/status-trends` to retrieve project status distribution by month
  - Returns project counts grouped by status (ongoing, completed, planned, approved_proposal, on_hold, cancelled) for each month
  - Supports `months` query parameter to control the time range (default: 12 months)
  - Includes caching with 5-minute TTL for optimal performance
  - Fills missing months with zero counts for consistent chart rendering
  - Files Updated:
    - `src/modules/dashboard/dashboard.service.ts` - Added `getStatusTrends()` method
    - `src/modules/dashboard/dashboard.controller.ts` - Added `getStatusTrends` controller
    - `src/modules/dashboard/dashboard.routes.ts` - Added `/status-trends` route

## [Unreleased] - 2026-02-18

### Fixed
- **Users API**: Fixed pagination logic by properly parsing query parameters with Zod schema in `usersController`. This ensures `page` and `limit` are correctly coerced into numbers before reaching the service layer.

### Added
- **User status filter**: Added support for filtering users by status (`ACTIVE`, `INACTIVE`, `PENDING`, `SUSPENDED`) in `GET /api/users`.
  - Updated `userQuerySchema` to include `status` and improved pagination parameter handling with Zod coercion.
  - Updated `usersService.getAllUsers` to apply the `status` filter to the database query.

## [Unreleased] - 2026-02-17

### Fixed
- **Critical: Redis cache invalidation for project lists** - Fixed cache invalidation pattern in reactions and comments services that prevented real-time updates
  - **Root Cause**: When reactions/comments were created, cache was invalidated using pattern `projects:${projectId}:*` but project list cache keys use pattern `projects:page=...`, causing a mismatch
  - **Impact**: Frontend would show stale data for up to 5 minutes (CACHE_TTL.PROJECTS) after adding reactions/comments
  - **Solution**: Changed all cache invalidation calls from `invalidateCache(\`projects:${projectId}:*\`)` to `invalidateCache('projects:*')` to match actual cache key patterns
  - **Files Updated**:
    - `src/modules/reactions/reactions.service.ts` - Updated 8 invalidation calls
    - `src/modules/comments/comments.service.ts` - Updated 2 invalidation calls
  - **Result**: Project cards now show updated like/dislike/comment counts immediately after mutations
- Include `approveCount` and `disapproveCount` in project list API response (`getAllProjects`) to ensure reaction counts are displayed in the feed.

## [1.0.0] - 2026-02-16

### Added
- Initial release of the Ormoc City Project Tracking System (Ormoc PIS) Backend.
- RESTful API with Express and TypeScript.
- PostgreSQL database with Prisma ORM.
- Authentication using JWT, Passport (Google, Facebook).
- Role-based access control (RBAC).
- File upload support with Cloudinary and Multer.
- Email notifications with Nodemailer.
- Real-time updates with Socket.io.
- Background jobs with pg-boss.
- Comprehensive documentation in `docs/`.
