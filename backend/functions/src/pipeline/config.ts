// Runtime configuration. Secrets are read lazily through getters so they are never copied into
// Firestore, logs or error messages.

export interface Limits {
  scansPerUserPerDay: number;
  photosPerUserPerDay: number;
  researchPerUserPerDay: number;
  aiCallsPerDayGlobal: number; // budget breaker across all users
  maxPhotoBytes: number;
  maxPhotosPerScan: number;
  explanationsPerScan: number; // new terms explained per scan (one AI call)
}

export interface RuntimeConfig {
  userAgent: string;
  openaiApiKey: () => string | undefined;
  visionModel: string;
  researchModel: string;
  explainModel: string;
  aiEnabled: boolean;
  researchEnabled: boolean;
  databaseImagesEnabled: boolean;
  explanationsEnabled: boolean;
  productFreshDays: number;
  recallFreshHours: number;
  limits: Limits;
}

export const DEFAULT_LIMITS: Limits = {
  scansPerUserPerDay: 40,
  photosPerUserPerDay: 20,
  researchPerUserPerDay: 10,
  aiCallsPerDayGlobal: 500,
  maxPhotoBytes: 10 * 1024 * 1024,
  maxPhotosPerScan: 6,
  explanationsPerScan: 8,
};

export const SCAN_STATUS = {
  queued: 'queued',
  identifying: 'identifying',
  researching: 'researching',
  checkingAlerts: 'checking_alerts',
  assessing: 'assessing',
  needsPhotos: 'needs_photos',
  processingPhoto: 'processing_photo',
  complete: 'complete',
  outOfScope: 'out_of_scope',
  failed: 'failed',
} as const;

export type ErrorCode =
  | 'invalid_barcode'
  | 'quota_exceeded'
  | 'source_unavailable'
  | 'analysis_failed'
  | 'save_failed'
  | 'photo_failed'
  | 'internal';
