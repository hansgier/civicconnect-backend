// ===== User Roles =====
export const ROLES = {
  ADMIN: 'ADMIN',
  BARANGAY: 'BARANGAY',
  ASSISTANT_ADMIN: 'ASSISTANT_ADMIN',
  CITIZEN: 'CITIZEN',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

// ===== User Statuses =====
export const USER_STATUSES = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  PENDING: 'PENDING',
  SUSPENDED: 'SUSPENDED',
} as const;

export type UserStatus = (typeof USER_STATUSES)[keyof typeof USER_STATUSES];

// ===== Project Statuses =====
export const PROJECT_STATUSES = {
  ONGOING: 'ONGOING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  ON_HOLD: 'ON_HOLD',
  PLANNED: 'PLANNED',
  APPROVED_PROPOSAL: 'APPROVED_PROPOSAL',
} as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[keyof typeof PROJECT_STATUSES];

// ===== Project Categories =====
export const PROJECT_CATEGORIES = {
  INSTITUTIONAL: 'INSTITUTIONAL',
  TRANSPORTATION: 'TRANSPORTATION',
  HEALTH: 'HEALTH',
  WATER: 'WATER',
  EDUCATION: 'EDUCATION',
  SOCIAL: 'SOCIAL',
  INFRASTRUCTURE: 'INFRASTRUCTURE',
  SPORTS_AND_RECREATION: 'SPORTS_AND_RECREATION',
  ECONOMIC: 'ECONOMIC',
} as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[keyof typeof PROJECT_CATEGORIES];

// ===== Reaction Types =====
export const REACTION_TYPES = {
  LIKE: 'LIKE',
  DISLIKE: 'DISLIKE',
} as const;

export type ReactionType = (typeof REACTION_TYPES)[keyof typeof REACTION_TYPES];

// ===== Announcement Categories =====
export const ANNOUNCEMENT_CATEGORIES = {
  EVENT: 'EVENT',
  SAFETY: 'SAFETY',
  POLICY: 'POLICY',
  INFRASTRUCTURE: 'INFRASTRUCTURE',
} as const;

export type AnnouncementCategory =
  (typeof ANNOUNCEMENT_CATEGORIES)[keyof typeof ANNOUNCEMENT_CATEGORIES];

// ===== Notification Types =====
export const NOTIFICATION_TYPES = {
  APPROVAL: 'APPROVAL',
  COMMENT: 'COMMENT',
  UPDATE: 'UPDATE',
  ANNOUNCEMENT: 'ANNOUNCEMENT',
  SYSTEM: 'SYSTEM',
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

// ===== Contact Types =====
export const CONTACT_TYPES = {
  EMERGENCY: 'EMERGENCY',
  GOVERNMENT: 'GOVERNMENT',
  HEALTH: 'HEALTH',
  EDUCATION: 'EDUCATION',
  ENVIRONMENT: 'ENVIRONMENT',
  BUSINESS: 'BUSINESS',
  WATER: 'WATER',
  ELECTRICITY: 'ELECTRICITY',
} as const;

export type ContactType = (typeof CONTACT_TYPES)[keyof typeof CONTACT_TYPES];

// ===== Cache TTL (seconds) =====
export const CACHE_TTL = {
  PROJECTS: 300,
  BARANGAYS: 3600,
  USERS: 600,
  DASHBOARD: 300,
  DEFAULT: 300,
} as const;

// ===== Rate Limits =====
export const RATE_LIMITS = {
  LOGIN: { points: 5, duration: 60 },
  REGISTER: { points: 3, duration: 60 },
  API: { points: 100, duration: 60 },
} as const;

// ===== Upload Limits =====
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // Increased to 50MB for video support
  ALLOWED_TYPES: [
    'image/jpeg', 
    'image/png', 
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm'
  ],
  MAX_FILES: 10, // Increased to 10 files
} as const;
