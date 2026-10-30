// Runtime configuration. Secrets are read lazily through getters so they are never copied into
// Firestore, logs or error messages.

export interface Limits {
  scansPerUserPerDay: number;
  photosPerUserPerDay: number;
  researchPerUserPerDay: number;
  aiCallsPerDayGlobal: number; // budget breaker across all users
  maxPhotoBytes: number;
  maxPhotosPerScan: number;
  explanationsPerCall: number; // terms per explanation call; a scan explains all its new terms at once (parallel calls)
}

export interface RuntimeConfig {
  userAgent: string;
  openaiApiKey: () => string | undefined;
  visionModel: string;
  researchModel: string;
  explainModel: string;
  verdictModel: string;
  aiEnabled: boolean;
  researchEnabled: boolean;
  /** A public barcode database is asked for a product's title when the pet databases have no record (a search hint, never a fact). */
  barcodeLookupEnabled?: boolean;
  databaseImagesEnabled: boolean;
  explanationsEnabled: boolean;
  verdictsEnabled: boolean;
  /** Owners' verified label photos may fill gaps in the shared product record (backend only). */
  promoteLabelPhotos?: boolean;
  productFreshDays: number;
  recallFreshHours: number;
  limits: Limits;
  /** Development only: barcodes whose first attempt fails like a source outage, to check the owner
   *  retry path on a deployed backend. Empty unless deploy-config.json sets RETRY_TEST_BARCODES. */
  retryTestBarcodes?: string[];
}

export const DEFAULT_LIMITS: Limits = {
  scansPerUserPerDay: 40,
  photosPerUserPerDay: 20,
  researchPerUserPerDay: 10,
  aiCallsPerDayGlobal: 500,
  maxPhotoBytes: 10 * 1024 * 1024,
  maxPhotosPerScan: 6,
  explanationsPerCall: 8,
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

/** States in which a job is still working on the scan. */
export const WORKING_STATUSES: readonly string[] = [SCAN_STATUS.queued, SCAN_STATUS.identifying, SCAN_STATUS.researching, SCAN_STATUS.checkingAlerts, SCAN_STATUS.assessing, SCAN_STATUS.processingPhoto];
/** A working scan with no update for this long has stopped without a result (jobs time out after 5 minutes); the owner may retry it. */
export const STUCK_AFTER_MS = 6 * 60 * 1000;

export type ErrorCode =
  | 'invalid_barcode'
  | 'quota_exceeded'
  | 'source_unavailable'
  | 'analysis_failed'
  | 'save_failed'
  | 'photo_failed'
  | 'internal';
