// Cache keys for different data types
export const CACHE_KEYS = {
  CADETS: 'cadets',
  NEWS: 'news',
  TASKS: 'tasks',
  ACHIEVEMENTS: 'achievements',
  AUTO_ACHIEVEMENTS: 'auto_achievements',
  SCORES: 'scores',
  ANALYTICS: 'analytics'
} as const;

// Cache duration in milliseconds
export const CACHE_DURATION = {
  SHORT: 5 * 60 * 1000,    // 5 minutes
  MEDIUM: 15 * 60 * 1000,  // 15 minutes
  LONG: 60 * 60 * 1000,    // 1 hour
  VERY_LONG: 24 * 60 * 60 * 1000  // 24 hours
} as const;

// API endpoints
export const API_ENDPOINTS = {
  CADETS: '/api/cadets',
  NEWS: '/api/news',
  TASKS: '/api/tasks',
  ACHIEVEMENTS: '/api/achievements'
} as const;

// Application constants
export const APP_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  DEFAULT_AVATAR: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?w=200'
} as const;