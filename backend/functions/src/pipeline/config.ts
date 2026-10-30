// Runtime configuration. Secrets are read lazily through getters so they are never copied into
// Firestore, logs or error messages.

export interface Limits {
  scansPerUserPerDay: number;
  photosPerUserPerDay: number;
  researchPerUserPerDay: number;
  refreshesPerUserPerDay: number; // re-checks of saved results under new rules (each may re-read sources)
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
  refreshesPerUserPerDay: 40,
  aiCallsPerDayGlobal: 500,
  maxPhotoBytes: 10 * 1024 * 1024,
  maxPhotosPerScan: 6,
  explanationsPerCall: 4, // up to three claims per term must fit the model's output limit
};

/**
 * The version of everything that decides a result (classification, research, score, ingredient knowledge,
 * explanations, verdict). Saved with each result; the app asks for a refresh of a result saved under an
 * older version when it is opened, so a known bad classification is corrected without deleting history.
 */
export const ASSESSMENT_VERSION = 'assessment-3.0.0';

/**
 * Whether a saved result was made under older rules than these: a missing or unreadable version is older;
 * a newer one (saved by a later release, e.g. before a rollback) is left alone, never re-assessed under
 * older rules.
 */
export function olderAssessment(saved: unknown): boolean {
  const parse = (v: unknown) => (typeof v === 'string' ? /^assessment-(\d+)\.(\d+)\.(\d+)$/.exec(v)?.slice(1).map(Number) ?? null : null);
  const a = parse(saved);
  const b = parse(ASSESSMENT_VERSION)!;
  if (!a) return true;
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] < b[i];
  return false;
}

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
/** Research must finish this long after the job starts (functions stop at 300 s; the result is written after it). */
export const RESEARCH_TIME_LIMIT_MS = 200 * 1000;
/** New explanations and the verdict start in the same job only this soon after it started; later, in a run of their own. */
export const STEP8_LATEST_START_MS = 100 * 1000;
/** Terms whose cached explanations a result looks up, and new ones explained per run (later runs explain the next ones). */
export const MAX_CACHE_LOOKUPS = 80;
export const MAX_NEW_TERMS = 24;

export type ErrorCode =
  | 'invalid_barcode'
  | 'quota_exceeded'
  | 'source_unavailable'
  | 'analysis_failed'
  | 'save_failed'
  | 'photo_failed'
  | 'internal';
