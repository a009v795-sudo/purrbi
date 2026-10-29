import 'dart:async';

import 'package:collection/collection.dart';

import '/backend/schema/util/firestore_util.dart';
import '/backend/schema/util/schema_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

/// Collection scans
class ScansRecord extends FirestoreRecord {
  ScansRecord._(
    DocumentReference reference,
    Map<String, dynamic> data,
  ) : super(reference, data) {
    _initializeFields();
  }

  // "barcode" field.
  String? _barcode;
  String get barcode => _barcode ?? '';
  bool hasBarcode() => _barcode != null;

  // "petId" field.
  String? _petId;
  String get petId => _petId ?? '';
  bool hasPetId() => _petId != null;

  // "source" field.
  String? _source;
  String get source => _source ?? '';
  bool hasSource() => _source != null;

  // "status" field.
  String? _status;
  String get status => _status ?? '';
  bool hasStatus() => _status != null;

  // "createdAt" field.
  DateTime? _createdAt;
  DateTime? get createdAt => _createdAt;
  bool hasCreatedAt() => _createdAt != null;

  // "clientVersion" field.
  String? _clientVersion;
  String get clientVersion => _clientVersion ?? '';
  bool hasClientVersion() => _clientVersion != null;

  // "favorite" field.
  bool? _favorite;
  bool get favorite => _favorite ?? false;
  bool hasFavorite() => _favorite != null;

  // "skipPhotos" field.
  bool? _skipPhotos;
  bool get skipPhotos => _skipPhotos ?? false;
  bool hasSkipPhotos() => _skipPhotos != null;

  // "retryRequested" field.
  bool? _retryRequested;
  bool get retryRequested => _retryRequested ?? false;
  bool hasRetryRequested() => _retryRequested != null;

  // "refreshPersonalRequested" field.
  bool? _refreshPersonalRequested;
  bool get refreshPersonalRequested => _refreshPersonalRequested ?? false;
  bool hasRefreshPersonalRequested() => _refreshPersonalRequested != null;

  // "statusMessage" field.
  String? _statusMessage;
  String get statusMessage => _statusMessage ?? '';
  bool hasStatusMessage() => _statusMessage != null;

  // "progress" field.
  int? _progress;
  int get progress => _progress ?? 0;
  bool hasProgress() => _progress != null;

  // "traceId" field.
  String? _traceId;
  String get traceId => _traceId ?? '';
  bool hasTraceId() => _traceId != null;

  // "gtin" field.
  String? _gtin;
  String get gtin => _gtin ?? '';
  bool hasGtin() => _gtin != null;

  // "barcodeKind" field.
  String? _barcodeKind;
  String get barcodeKind => _barcodeKind ?? '';
  bool hasBarcodeKind() => _barcodeKind != null;

  // "claimCount" field.
  int? _claimCount;
  int get claimCount => _claimCount ?? 0;
  bool hasClaimCount() => _claimCount != null;

  // "duplicateDeliveries" field.
  int? _duplicateDeliveries;
  int get duplicateDeliveries => _duplicateDeliveries ?? 0;
  bool hasDuplicateDeliveries() => _duplicateDeliveries != null;

  // "errorCode" field.
  String? _errorCode;
  String get errorCode => _errorCode ?? '';
  bool hasErrorCode() => _errorCode != null;

  // "errorMessage" field.
  String? _errorMessage;
  String get errorMessage => _errorMessage ?? '';
  bool hasErrorMessage() => _errorMessage != null;

  // "errorRetryable" field.
  bool? _errorRetryable;
  bool get errorRetryable => _errorRetryable ?? false;
  bool hasErrorRetryable() => _errorRetryable != null;

  // "startedAt" field.
  DateTime? _startedAt;
  DateTime? get startedAt => _startedAt;
  bool hasStartedAt() => _startedAt != null;

  // "updatedAt" field.
  DateTime? _updatedAt;
  DateTime? get updatedAt => _updatedAt;
  bool hasUpdatedAt() => _updatedAt != null;

  // "assessedAt" field.
  DateTime? _assessedAt;
  DateTime? get assessedAt => _assessedAt;
  bool hasAssessedAt() => _assessedAt != null;

  // "completedAt" field.
  DateTime? _completedAt;
  DateTime? get completedAt => _completedAt;
  bool hasCompletedAt() => _completedAt != null;

  // "productName" field.
  String? _productName;
  String get productName => _productName ?? '';
  bool hasProductName() => _productName != null;

  // "brand" field.
  String? _brand;
  String get brand => _brand ?? '';
  bool hasBrand() => _brand != null;

  // "imageUrl" field.
  String? _imageUrl;
  String get imageUrl => _imageUrl ?? '';
  bool hasImageUrl() => _imageUrl != null;

  // "productSpecies" field.
  String? _productSpecies;
  String get productSpecies => _productSpecies ?? '';
  bool hasProductSpecies() => _productSpecies != null;

  // "productSpeciesLabel" field.
  String? _productSpeciesLabel;
  String get productSpeciesLabel => _productSpeciesLabel ?? '';
  bool hasProductSpeciesLabel() => _productSpeciesLabel != null;

  // "productCategory" field.
  String? _productCategory;
  String get productCategory => _productCategory ?? '';
  bool hasProductCategory() => _productCategory != null;

  // "productCategoryLabel" field.
  String? _productCategoryLabel;
  String get productCategoryLabel => _productCategoryLabel ?? '';
  bool hasProductCategoryLabel() => _productCategoryLabel != null;

  // "scope" field.
  String? _scope;
  String get scope => _scope ?? '';
  bool hasScope() => _scope != null;

  // "scopeReason" field.
  String? _scopeReason;
  String get scopeReason => _scopeReason ?? '';
  bool hasScopeReason() => _scopeReason != null;

  // "outOfScopeKind" field.
  String? _outOfScopeKind;
  String get outOfScopeKind => _outOfScopeKind ?? '';
  bool hasOutOfScopeKind() => _outOfScopeKind != null;

  // "identitySource" field.
  String? _identitySource;
  String get identitySource => _identitySource ?? '';
  bool hasIdentitySource() => _identitySource != null;

  // "productFound" field.
  bool? _productFound;
  bool get productFound => _productFound ?? false;
  bool hasProductFound() => _productFound != null;

  // "resultState" field.
  String? _resultState;
  String get resultState => _resultState ?? '';
  bool hasResultState() => _resultState != null;

  // "resultLabel" field.
  String? _resultLabel;
  String get resultLabel => _resultLabel ?? '';
  bool hasResultLabel() => _resultLabel != null;

  // "scoreAvailable" field.
  bool? _scoreAvailable;
  bool get scoreAvailable => _scoreAvailable ?? false;
  bool hasScoreAvailable() => _scoreAvailable != null;

  // "score" field.
  int? _score;
  int get score => _score ?? 0;
  bool hasScore() => _score != null;

  // "scoreBand" field.
  String? _scoreBand;
  String get scoreBand => _scoreBand ?? '';
  bool hasScoreBand() => _scoreBand != null;

  // "scoreLabel" field.
  String? _scoreLabel;
  String get scoreLabel => _scoreLabel ?? '';
  bool hasScoreLabel() => _scoreLabel != null;

  // "scoreProvisional" field.
  bool? _scoreProvisional;
  bool get scoreProvisional => _scoreProvisional ?? false;
  bool hasScoreProvisional() => _scoreProvisional != null;

  // "scoreWithheldReason" field.
  String? _scoreWithheldReason;
  String get scoreWithheldReason => _scoreWithheldReason ?? '';
  bool hasScoreWithheldReason() => _scoreWithheldReason != null;

  // "scoreVersion" field.
  String? _scoreVersion;
  String get scoreVersion => _scoreVersion ?? '';
  bool hasScoreVersion() => _scoreVersion != null;

  // "kbVersion" field.
  String? _kbVersion;
  String get kbVersion => _kbVersion ?? '';
  bool hasKbVersion() => _kbVersion != null;

  // "scoreComponents" field.
  List<ScoreComponentStruct>? _scoreComponents;
  List<ScoreComponentStruct> get scoreComponents =>
      _scoreComponents ?? const [];
  bool hasScoreComponents() => _scoreComponents != null;

  // "generalFindings" field.
  List<FindingStruct>? _generalFindings;
  List<FindingStruct> get generalFindings => _generalFindings ?? const [];
  bool hasGeneralFindings() => _generalFindings != null;

  // "ingredientNotes" field.
  List<IngredientNoteStruct>? _ingredientNotes;
  List<IngredientNoteStruct> get ingredientNotes =>
      _ingredientNotes ?? const [];
  bool hasIngredientNotes() => _ingredientNotes != null;

  // "explanationsStatus" field.
  String? _explanationsStatus;
  String get explanationsStatus => _explanationsStatus ?? '';
  bool hasExplanationsStatus() => _explanationsStatus != null;

  // "ingredientsText" field.
  String? _ingredientsText;
  String get ingredientsText => _ingredientsText ?? '';
  bool hasIngredientsText() => _ingredientsText != null;

  // "ingredientsSource" field.
  String? _ingredientsSource;
  String get ingredientsSource => _ingredientsSource ?? '';
  bool hasIngredientsSource() => _ingredientsSource != null;

  // "nutrition" field.
  List<NutritionLineStruct>? _nutrition;
  List<NutritionLineStruct> get nutrition => _nutrition ?? const [];
  bool hasNutrition() => _nutrition != null;

  // "nutritionSource" field.
  String? _nutritionSource;
  String get nutritionSource => _nutritionSource ?? '';
  bool hasNutritionSource() => _nutritionSource != null;

  // "nutritionContext" field.
  List<String>? _nutritionContext;
  List<String> get nutritionContext => _nutritionContext ?? const [];
  bool hasNutritionContext() => _nutritionContext != null;

  // "caloriesText" field.
  String? _caloriesText;
  String get caloriesText => _caloriesText ?? '';
  bool hasCaloriesText() => _caloriesText != null;

  // "adequacyText" field.
  String? _adequacyText;
  String get adequacyText => _adequacyText ?? '';
  bool hasAdequacyText() => _adequacyText != null;

  // "adequacySummary" field.
  String? _adequacySummary;
  String get adequacySummary => _adequacySummary ?? '';
  bool hasAdequacySummary() => _adequacySummary != null;

  // "adequacySource" field.
  String? _adequacySource;
  String get adequacySource => _adequacySource ?? '';
  bool hasAdequacySource() => _adequacySource != null;

  // "activeIngredientsSource" field.
  String? _activeIngredientsSource;
  String get activeIngredientsSource => _activeIngredientsSource ?? '';
  bool hasActiveIngredientsSource() => _activeIngredientsSource != null;

  // "supplementSummary" field.
  String? _supplementSummary;
  String get supplementSummary => _supplementSummary ?? '';
  bool hasSupplementSummary() => _supplementSummary != null;

  // "supplementPurposes" field.
  List<SupplementPurposeStruct>? _supplementPurposes;
  List<SupplementPurposeStruct> get supplementPurposes =>
      _supplementPurposes ?? const [];
  bool hasSupplementPurposes() => _supplementPurposes != null;

  // "supplementActives" field.
  List<SupplementActiveStruct>? _supplementActives;
  List<SupplementActiveStruct> get supplementActives =>
      _supplementActives ?? const [];
  bool hasSupplementActives() => _supplementActives != null;

  // "supplementActivesSource" field.
  String? _supplementActivesSource;
  String get supplementActivesSource => _supplementActivesSource ?? '';
  bool hasSupplementActivesSource() => _supplementActivesSource != null;

  // "supplementWarnings" field.
  List<FindingStruct>? _supplementWarnings;
  List<FindingStruct> get supplementWarnings => _supplementWarnings ?? const [];
  bool hasSupplementWarnings() => _supplementWarnings != null;

  // "supplementLimitations" field.
  List<String>? _supplementLimitations;
  List<String> get supplementLimitations => _supplementLimitations ?? const [];
  bool hasSupplementLimitations() => _supplementLimitations != null;

  // "supplementQualitySignals" field.
  List<String>? _supplementQualitySignals;
  List<String> get supplementQualitySignals =>
      _supplementQualitySignals ?? const [];
  bool hasSupplementQualitySignals() => _supplementQualitySignals != null;

  // "recallStatus" field.
  String? _recallStatus;
  String get recallStatus => _recallStatus ?? '';
  bool hasRecallStatus() => _recallStatus != null;

  // "recallSummary" field.
  String? _recallSummary;
  String get recallSummary => _recallSummary ?? '';
  bool hasRecallSummary() => _recallSummary != null;

  // "recallCheckedAt" field.
  DateTime? _recallCheckedAt;
  DateTime? get recallCheckedAt => _recallCheckedAt;
  bool hasRecallCheckedAt() => _recallCheckedAt != null;

  // "recallRecords" field.
  List<RecallRecordStruct>? _recallRecords;
  List<RecallRecordStruct> get recallRecords => _recallRecords ?? const [];
  bool hasRecallRecords() => _recallRecords != null;

  // "sources" field.
  List<EvidenceSourceStruct>? _sources;
  List<EvidenceSourceStruct> get sources => _sources ?? const [];
  bool hasSources() => _sources != null;

  // "evidenceNotes" field.
  List<String>? _evidenceNotes;
  List<String> get evidenceNotes => _evidenceNotes ?? const [];
  bool hasEvidenceNotes() => _evidenceNotes != null;

  // "sourceChecks" field.
  List<SourceCheckStruct>? _sourceChecks;
  List<SourceCheckStruct> get sourceChecks => _sourceChecks ?? const [];
  bool hasSourceChecks() => _sourceChecks != null;

  // "lastJob" field.
  JobInfoStruct? _lastJob;
  JobInfoStruct get lastJob => _lastJob ?? JobInfoStruct();
  bool hasLastJob() => _lastJob != null;

  // "petName" field.
  String? _petName;
  String get petName => _petName ?? '';
  bool hasPetName() => _petName != null;

  // "profileVersion" field.
  int? _profileVersion;
  int get profileVersion => _profileVersion ?? 0;
  bool hasProfileVersion() => _profileVersion != null;

  // "personalState" field.
  String? _personalState;
  String get personalState => _personalState ?? '';
  bool hasPersonalState() => _personalState != null;

  // "personalHeadline" field.
  String? _personalHeadline;
  String get personalHeadline => _personalHeadline ?? '';
  bool hasPersonalHeadline() => _personalHeadline != null;

  // "personalFindings" field.
  List<FindingStruct>? _personalFindings;
  List<FindingStruct> get personalFindings => _personalFindings ?? const [];
  bool hasPersonalFindings() => _personalFindings != null;

  // "personalUnresolved" field.
  List<String>? _personalUnresolved;
  List<String> get personalUnresolved => _personalUnresolved ?? const [];
  bool hasPersonalUnresolved() => _personalUnresolved != null;

  // "personalTrace" field.
  List<TraceItemStruct>? _personalTrace;
  List<TraceItemStruct> get personalTrace => _personalTrace ?? const [];
  bool hasPersonalTrace() => _personalTrace != null;

  // "summary" field.
  List<String>? _summary;
  List<String> get summary => _summary ?? const [];
  bool hasSummary() => _summary != null;

  // "missingInfo" field.
  List<String>? _missingInfo;
  List<String> get missingInfo => _missingInfo ?? const [];
  bool hasMissingInfo() => _missingInfo != null;

  // "photoRequests" field.
  List<PhotoRequestStruct>? _photoRequests;
  List<PhotoRequestStruct> get photoRequests => _photoRequests ?? const [];
  bool hasPhotoRequests() => _photoRequests != null;

  // "labelEvidenceUsed" field.
  bool? _labelEvidenceUsed;
  bool get labelEvidenceUsed => _labelEvidenceUsed ?? false;
  bool hasLabelEvidenceUsed() => _labelEvidenceUsed != null;

  // "evidenceRevision" field.
  int? _evidenceRevision;
  int get evidenceRevision => _evidenceRevision ?? 0;
  bool hasEvidenceRevision() => _evidenceRevision != null;

  // "scoreText" field.
  String? _scoreText;
  String get scoreText => _scoreText ?? '';
  bool hasScoreText() => _scoreText != null;

  // "scoreCoverage" field.
  int? _scoreCoverage;
  int get scoreCoverage => _scoreCoverage ?? 0;
  bool hasScoreCoverage() => _scoreCoverage != null;

  // "scoreMaxPossible" field.
  int? _scoreMaxPossible;
  int get scoreMaxPossible => _scoreMaxPossible ?? 0;
  bool hasScoreMaxPossible() => _scoreMaxPossible != null;

  // "scoreBasis" field.
  String? _scoreBasis;
  String get scoreBasis => _scoreBasis ?? '';
  bool hasScoreBasis() => _scoreBasis != null;

  // "verdict" field.
  String? _verdict;
  String get verdict => _verdict ?? '';
  bool hasVerdict() => _verdict != null;

  // "verdictSource" field.
  String? _verdictSource;
  String get verdictSource => _verdictSource ?? '';
  bool hasVerdictSource() => _verdictSource != null;

  // "verdictStatus" field.
  String? _verdictStatus;
  String get verdictStatus => _verdictStatus ?? '';
  bool hasVerdictStatus() => _verdictStatus != null;

  // "positives" field.
  List<HighlightStruct>? _positives;
  List<HighlightStruct> get positives => _positives ?? const [];
  bool hasPositives() => _positives != null;

  // "cautions" field.
  List<HighlightStruct>? _cautions;
  List<HighlightStruct> get cautions => _cautions ?? const [];
  bool hasCautions() => _cautions != null;

  // "ingredientsPreview" field.
  String? _ingredientsPreview;
  String get ingredientsPreview => _ingredientsPreview ?? '';
  bool hasIngredientsPreview() => _ingredientsPreview != null;

  // "ingredientsCount" field.
  int? _ingredientsCount;
  int get ingredientsCount => _ingredientsCount ?? 0;
  bool hasIngredientsCount() => _ingredientsCount != null;

  // "verificationStatus" field.
  String? _verificationStatus;
  String get verificationStatus => _verificationStatus ?? '';
  bool hasVerificationStatus() => _verificationStatus != null;

  // "recallStatusLabel" field.
  String? _recallStatusLabel;
  String get recallStatusLabel => _recallStatusLabel ?? '';
  bool hasRecallStatusLabel() => _recallStatusLabel != null;

  // "recallSeverity" field.
  String? _recallSeverity;
  String get recallSeverity => _recallSeverity ?? '';
  bool hasRecallSeverity() => _recallSeverity != null;

  // "recallCheckedLabel" field.
  String? _recallCheckedLabel;
  String get recallCheckedLabel => _recallCheckedLabel ?? '';
  bool hasRecallCheckedLabel() => _recallCheckedLabel != null;

  DocumentReference get parentReference => reference.parent.parent!;

  void _initializeFields() {
    _barcode = snapshotData['barcode'] as String?;
    _petId = snapshotData['petId'] as String?;
    _source = snapshotData['source'] as String?;
    _status = snapshotData['status'] as String?;
    _createdAt = snapshotData['createdAt'] as DateTime?;
    _clientVersion = snapshotData['clientVersion'] as String?;
    _favorite = snapshotData['favorite'] as bool?;
    _skipPhotos = snapshotData['skipPhotos'] as bool?;
    _retryRequested = snapshotData['retryRequested'] as bool?;
    _refreshPersonalRequested =
        snapshotData['refreshPersonalRequested'] as bool?;
    _statusMessage = snapshotData['statusMessage'] as String?;
    _progress = castToType<int>(snapshotData['progress']);
    _traceId = snapshotData['traceId'] as String?;
    _gtin = snapshotData['gtin'] as String?;
    _barcodeKind = snapshotData['barcodeKind'] as String?;
    _claimCount = castToType<int>(snapshotData['claimCount']);
    _duplicateDeliveries = castToType<int>(snapshotData['duplicateDeliveries']);
    _errorCode = snapshotData['errorCode'] as String?;
    _errorMessage = snapshotData['errorMessage'] as String?;
    _errorRetryable = snapshotData['errorRetryable'] as bool?;
    _startedAt = snapshotData['startedAt'] as DateTime?;
    _updatedAt = snapshotData['updatedAt'] as DateTime?;
    _assessedAt = snapshotData['assessedAt'] as DateTime?;
    _completedAt = snapshotData['completedAt'] as DateTime?;
    _productName = snapshotData['productName'] as String?;
    _brand = snapshotData['brand'] as String?;
    _imageUrl = snapshotData['imageUrl'] as String?;
    _productSpecies = snapshotData['productSpecies'] as String?;
    _productSpeciesLabel = snapshotData['productSpeciesLabel'] as String?;
    _productCategory = snapshotData['productCategory'] as String?;
    _productCategoryLabel = snapshotData['productCategoryLabel'] as String?;
    _scope = snapshotData['scope'] as String?;
    _scopeReason = snapshotData['scopeReason'] as String?;
    _outOfScopeKind = snapshotData['outOfScopeKind'] as String?;
    _identitySource = snapshotData['identitySource'] as String?;
    _productFound = snapshotData['productFound'] as bool?;
    _resultState = snapshotData['resultState'] as String?;
    _resultLabel = snapshotData['resultLabel'] as String?;
    _scoreAvailable = snapshotData['scoreAvailable'] as bool?;
    _score = castToType<int>(snapshotData['score']);
    _scoreBand = snapshotData['scoreBand'] as String?;
    _scoreLabel = snapshotData['scoreLabel'] as String?;
    _scoreProvisional = snapshotData['scoreProvisional'] as bool?;
    _scoreWithheldReason = snapshotData['scoreWithheldReason'] as String?;
    _scoreVersion = snapshotData['scoreVersion'] as String?;
    _kbVersion = snapshotData['kbVersion'] as String?;
    _scoreComponents = getStructList(
      snapshotData['scoreComponents'],
      ScoreComponentStruct.fromMap,
    );
    _generalFindings = getStructList(
      snapshotData['generalFindings'],
      FindingStruct.fromMap,
    );
    _ingredientNotes = getStructList(
      snapshotData['ingredientNotes'],
      IngredientNoteStruct.fromMap,
    );
    _explanationsStatus = snapshotData['explanationsStatus'] as String?;
    _ingredientsText = snapshotData['ingredientsText'] as String?;
    _ingredientsSource = snapshotData['ingredientsSource'] as String?;
    _nutrition = getStructList(
      snapshotData['nutrition'],
      NutritionLineStruct.fromMap,
    );
    _nutritionSource = snapshotData['nutritionSource'] as String?;
    _nutritionContext = getDataList(snapshotData['nutritionContext']);
    _caloriesText = snapshotData['caloriesText'] as String?;
    _adequacyText = snapshotData['adequacyText'] as String?;
    _adequacySummary = snapshotData['adequacySummary'] as String?;
    _adequacySource = snapshotData['adequacySource'] as String?;
    _activeIngredientsSource =
        snapshotData['activeIngredientsSource'] as String?;
    _supplementSummary = snapshotData['supplementSummary'] as String?;
    _supplementPurposes = getStructList(
      snapshotData['supplementPurposes'],
      SupplementPurposeStruct.fromMap,
    );
    _supplementActives = getStructList(
      snapshotData['supplementActives'],
      SupplementActiveStruct.fromMap,
    );
    _supplementActivesSource =
        snapshotData['supplementActivesSource'] as String?;
    _supplementWarnings = getStructList(
      snapshotData['supplementWarnings'],
      FindingStruct.fromMap,
    );
    _supplementLimitations = getDataList(snapshotData['supplementLimitations']);
    _supplementQualitySignals =
        getDataList(snapshotData['supplementQualitySignals']);
    _recallStatus = snapshotData['recallStatus'] as String?;
    _recallSummary = snapshotData['recallSummary'] as String?;
    _recallCheckedAt = snapshotData['recallCheckedAt'] as DateTime?;
    _recallRecords = getStructList(
      snapshotData['recallRecords'],
      RecallRecordStruct.fromMap,
    );
    _sources = getStructList(
      snapshotData['sources'],
      EvidenceSourceStruct.fromMap,
    );
    _evidenceNotes = getDataList(snapshotData['evidenceNotes']);
    _sourceChecks = getStructList(
      snapshotData['sourceChecks'],
      SourceCheckStruct.fromMap,
    );
    _lastJob = snapshotData['lastJob'] is JobInfoStruct
        ? snapshotData['lastJob']
        : JobInfoStruct.maybeFromMap(snapshotData['lastJob']);
    _petName = snapshotData['petName'] as String?;
    _profileVersion = castToType<int>(snapshotData['profileVersion']);
    _personalState = snapshotData['personalState'] as String?;
    _personalHeadline = snapshotData['personalHeadline'] as String?;
    _personalFindings = getStructList(
      snapshotData['personalFindings'],
      FindingStruct.fromMap,
    );
    _personalUnresolved = getDataList(snapshotData['personalUnresolved']);
    _personalTrace = getStructList(
      snapshotData['personalTrace'],
      TraceItemStruct.fromMap,
    );
    _summary = getDataList(snapshotData['summary']);
    _missingInfo = getDataList(snapshotData['missingInfo']);
    _photoRequests = getStructList(
      snapshotData['photoRequests'],
      PhotoRequestStruct.fromMap,
    );
    _labelEvidenceUsed = snapshotData['labelEvidenceUsed'] as bool?;
    _evidenceRevision = castToType<int>(snapshotData['evidenceRevision']);
    _scoreText = snapshotData['scoreText'] as String?;
    _scoreCoverage = castToType<int>(snapshotData['scoreCoverage']);
    _scoreMaxPossible = castToType<int>(snapshotData['scoreMaxPossible']);
    _scoreBasis = snapshotData['scoreBasis'] as String?;
    _verdict = snapshotData['verdict'] as String?;
    _verdictSource = snapshotData['verdictSource'] as String?;
    _verdictStatus = snapshotData['verdictStatus'] as String?;
    _positives = getStructList(
      snapshotData['positives'],
      HighlightStruct.fromMap,
    );
    _cautions = getStructList(
      snapshotData['cautions'],
      HighlightStruct.fromMap,
    );
    _ingredientsPreview = snapshotData['ingredientsPreview'] as String?;
    _ingredientsCount = castToType<int>(snapshotData['ingredientsCount']);
    _verificationStatus = snapshotData['verificationStatus'] as String?;
    _recallStatusLabel = snapshotData['recallStatusLabel'] as String?;
    _recallSeverity = snapshotData['recallSeverity'] as String?;
    _recallCheckedLabel = snapshotData['recallCheckedLabel'] as String?;
  }

  static Query<Map<String, dynamic>> collection([DocumentReference? parent]) =>
      parent != null
          ? parent.collection('scans')
          : FirebaseFirestore.instance.collectionGroup('scans');

  static DocumentReference createDoc(DocumentReference parent, {String? id}) =>
      parent.collection('scans').doc(id);

  static Stream<ScansRecord> getDocument(DocumentReference ref) =>
      ref.snapshots().map((s) => ScansRecord.fromSnapshot(s));

  static Future<ScansRecord> getDocumentOnce(DocumentReference ref) =>
      ref.get().then((s) => ScansRecord.fromSnapshot(s));

  static ScansRecord fromSnapshot(DocumentSnapshot snapshot) => ScansRecord._(
        snapshot.reference,
        mapFromFirestore(snapshot.data() as Map<String, dynamic>),
      );

  static ScansRecord getDocumentFromData(
    Map<String, dynamic> data,
    DocumentReference reference,
  ) =>
      ScansRecord._(reference, mapFromFirestore(data));

  @override
  String toString() =>
      'ScansRecord(reference: ${reference.path}, data: $snapshotData)';

  @override
  int get hashCode => reference.path.hashCode;

  @override
  bool operator ==(other) =>
      other is ScansRecord && reference.path == other.reference.path;
}

Map<String, dynamic> createScansRecordData({
  String? barcode,
  String? petId,
  String? source,
  String? status,
  DateTime? createdAt,
  String? clientVersion,
  bool? favorite,
  bool? skipPhotos,
  bool? retryRequested,
  bool? refreshPersonalRequested,
  String? statusMessage,
  int? progress,
  String? traceId,
  String? gtin,
  String? barcodeKind,
  int? claimCount,
  int? duplicateDeliveries,
  String? errorCode,
  String? errorMessage,
  bool? errorRetryable,
  DateTime? startedAt,
  DateTime? updatedAt,
  DateTime? assessedAt,
  DateTime? completedAt,
  String? productName,
  String? brand,
  String? imageUrl,
  String? productSpecies,
  String? productSpeciesLabel,
  String? productCategory,
  String? productCategoryLabel,
  String? scope,
  String? scopeReason,
  String? outOfScopeKind,
  String? identitySource,
  bool? productFound,
  String? resultState,
  String? resultLabel,
  bool? scoreAvailable,
  int? score,
  String? scoreBand,
  String? scoreLabel,
  bool? scoreProvisional,
  String? scoreWithheldReason,
  String? scoreVersion,
  String? kbVersion,
  String? explanationsStatus,
  String? ingredientsText,
  String? ingredientsSource,
  String? nutritionSource,
  String? caloriesText,
  String? adequacyText,
  String? adequacySummary,
  String? adequacySource,
  String? activeIngredientsSource,
  String? supplementSummary,
  String? supplementActivesSource,
  String? recallStatus,
  String? recallSummary,
  DateTime? recallCheckedAt,
  JobInfoStruct? lastJob,
  String? petName,
  int? profileVersion,
  String? personalState,
  String? personalHeadline,
  bool? labelEvidenceUsed,
  int? evidenceRevision,
  String? scoreText,
  int? scoreCoverage,
  int? scoreMaxPossible,
  String? scoreBasis,
  String? verdict,
  String? verdictSource,
  String? verdictStatus,
  String? ingredientsPreview,
  int? ingredientsCount,
  String? verificationStatus,
  String? recallStatusLabel,
  String? recallSeverity,
  String? recallCheckedLabel,
}) {
  final firestoreData = mapToFirestore(
    <String, dynamic>{
      'barcode': barcode,
      'petId': petId,
      'source': source,
      'status': status,
      'createdAt': createdAt,
      'clientVersion': clientVersion,
      'favorite': favorite,
      'skipPhotos': skipPhotos,
      'retryRequested': retryRequested,
      'refreshPersonalRequested': refreshPersonalRequested,
      'statusMessage': statusMessage,
      'progress': progress,
      'traceId': traceId,
      'gtin': gtin,
      'barcodeKind': barcodeKind,
      'claimCount': claimCount,
      'duplicateDeliveries': duplicateDeliveries,
      'errorCode': errorCode,
      'errorMessage': errorMessage,
      'errorRetryable': errorRetryable,
      'startedAt': startedAt,
      'updatedAt': updatedAt,
      'assessedAt': assessedAt,
      'completedAt': completedAt,
      'productName': productName,
      'brand': brand,
      'imageUrl': imageUrl,
      'productSpecies': productSpecies,
      'productSpeciesLabel': productSpeciesLabel,
      'productCategory': productCategory,
      'productCategoryLabel': productCategoryLabel,
      'scope': scope,
      'scopeReason': scopeReason,
      'outOfScopeKind': outOfScopeKind,
      'identitySource': identitySource,
      'productFound': productFound,
      'resultState': resultState,
      'resultLabel': resultLabel,
      'scoreAvailable': scoreAvailable,
      'score': score,
      'scoreBand': scoreBand,
      'scoreLabel': scoreLabel,
      'scoreProvisional': scoreProvisional,
      'scoreWithheldReason': scoreWithheldReason,
      'scoreVersion': scoreVersion,
      'kbVersion': kbVersion,
      'explanationsStatus': explanationsStatus,
      'ingredientsText': ingredientsText,
      'ingredientsSource': ingredientsSource,
      'nutritionSource': nutritionSource,
      'caloriesText': caloriesText,
      'adequacyText': adequacyText,
      'adequacySummary': adequacySummary,
      'adequacySource': adequacySource,
      'activeIngredientsSource': activeIngredientsSource,
      'supplementSummary': supplementSummary,
      'supplementActivesSource': supplementActivesSource,
      'recallStatus': recallStatus,
      'recallSummary': recallSummary,
      'recallCheckedAt': recallCheckedAt,
      'lastJob': JobInfoStruct().toMap(),
      'petName': petName,
      'profileVersion': profileVersion,
      'personalState': personalState,
      'personalHeadline': personalHeadline,
      'labelEvidenceUsed': labelEvidenceUsed,
      'evidenceRevision': evidenceRevision,
      'scoreText': scoreText,
      'scoreCoverage': scoreCoverage,
      'scoreMaxPossible': scoreMaxPossible,
      'scoreBasis': scoreBasis,
      'verdict': verdict,
      'verdictSource': verdictSource,
      'verdictStatus': verdictStatus,
      'ingredientsPreview': ingredientsPreview,
      'ingredientsCount': ingredientsCount,
      'verificationStatus': verificationStatus,
      'recallStatusLabel': recallStatusLabel,
      'recallSeverity': recallSeverity,
      'recallCheckedLabel': recallCheckedLabel,
    }.withoutNulls,
  );

  // Handle nested data for "lastJob" field.
  addJobInfoStructData(firestoreData, lastJob, 'lastJob');

  return firestoreData;
}

class ScansRecordDocumentEquality implements Equality<ScansRecord> {
  const ScansRecordDocumentEquality();

  @override
  bool equals(ScansRecord? e1, ScansRecord? e2) {
    const listEquality = ListEquality();
    return e1?.barcode == e2?.barcode &&
        e1?.petId == e2?.petId &&
        e1?.source == e2?.source &&
        e1?.status == e2?.status &&
        e1?.createdAt == e2?.createdAt &&
        e1?.clientVersion == e2?.clientVersion &&
        e1?.favorite == e2?.favorite &&
        e1?.skipPhotos == e2?.skipPhotos &&
        e1?.retryRequested == e2?.retryRequested &&
        e1?.refreshPersonalRequested == e2?.refreshPersonalRequested &&
        e1?.statusMessage == e2?.statusMessage &&
        e1?.progress == e2?.progress &&
        e1?.traceId == e2?.traceId &&
        e1?.gtin == e2?.gtin &&
        e1?.barcodeKind == e2?.barcodeKind &&
        e1?.claimCount == e2?.claimCount &&
        e1?.duplicateDeliveries == e2?.duplicateDeliveries &&
        e1?.errorCode == e2?.errorCode &&
        e1?.errorMessage == e2?.errorMessage &&
        e1?.errorRetryable == e2?.errorRetryable &&
        e1?.startedAt == e2?.startedAt &&
        e1?.updatedAt == e2?.updatedAt &&
        e1?.assessedAt == e2?.assessedAt &&
        e1?.completedAt == e2?.completedAt &&
        e1?.productName == e2?.productName &&
        e1?.brand == e2?.brand &&
        e1?.imageUrl == e2?.imageUrl &&
        e1?.productSpecies == e2?.productSpecies &&
        e1?.productSpeciesLabel == e2?.productSpeciesLabel &&
        e1?.productCategory == e2?.productCategory &&
        e1?.productCategoryLabel == e2?.productCategoryLabel &&
        e1?.scope == e2?.scope &&
        e1?.scopeReason == e2?.scopeReason &&
        e1?.outOfScopeKind == e2?.outOfScopeKind &&
        e1?.identitySource == e2?.identitySource &&
        e1?.productFound == e2?.productFound &&
        e1?.resultState == e2?.resultState &&
        e1?.resultLabel == e2?.resultLabel &&
        e1?.scoreAvailable == e2?.scoreAvailable &&
        e1?.score == e2?.score &&
        e1?.scoreBand == e2?.scoreBand &&
        e1?.scoreLabel == e2?.scoreLabel &&
        e1?.scoreProvisional == e2?.scoreProvisional &&
        e1?.scoreWithheldReason == e2?.scoreWithheldReason &&
        e1?.scoreVersion == e2?.scoreVersion &&
        e1?.kbVersion == e2?.kbVersion &&
        listEquality.equals(e1?.scoreComponents, e2?.scoreComponents) &&
        listEquality.equals(e1?.generalFindings, e2?.generalFindings) &&
        listEquality.equals(e1?.ingredientNotes, e2?.ingredientNotes) &&
        e1?.explanationsStatus == e2?.explanationsStatus &&
        e1?.ingredientsText == e2?.ingredientsText &&
        e1?.ingredientsSource == e2?.ingredientsSource &&
        listEquality.equals(e1?.nutrition, e2?.nutrition) &&
        e1?.nutritionSource == e2?.nutritionSource &&
        listEquality.equals(e1?.nutritionContext, e2?.nutritionContext) &&
        e1?.caloriesText == e2?.caloriesText &&
        e1?.adequacyText == e2?.adequacyText &&
        e1?.adequacySummary == e2?.adequacySummary &&
        e1?.adequacySource == e2?.adequacySource &&
        e1?.activeIngredientsSource == e2?.activeIngredientsSource &&
        e1?.supplementSummary == e2?.supplementSummary &&
        listEquality.equals(e1?.supplementPurposes, e2?.supplementPurposes) &&
        listEquality.equals(e1?.supplementActives, e2?.supplementActives) &&
        e1?.supplementActivesSource == e2?.supplementActivesSource &&
        listEquality.equals(e1?.supplementWarnings, e2?.supplementWarnings) &&
        listEquality.equals(
            e1?.supplementLimitations, e2?.supplementLimitations) &&
        listEquality.equals(
            e1?.supplementQualitySignals, e2?.supplementQualitySignals) &&
        e1?.recallStatus == e2?.recallStatus &&
        e1?.recallSummary == e2?.recallSummary &&
        e1?.recallCheckedAt == e2?.recallCheckedAt &&
        listEquality.equals(e1?.recallRecords, e2?.recallRecords) &&
        listEquality.equals(e1?.sources, e2?.sources) &&
        listEquality.equals(e1?.evidenceNotes, e2?.evidenceNotes) &&
        listEquality.equals(e1?.sourceChecks, e2?.sourceChecks) &&
        e1?.lastJob == e2?.lastJob &&
        e1?.petName == e2?.petName &&
        e1?.profileVersion == e2?.profileVersion &&
        e1?.personalState == e2?.personalState &&
        e1?.personalHeadline == e2?.personalHeadline &&
        listEquality.equals(e1?.personalFindings, e2?.personalFindings) &&
        listEquality.equals(e1?.personalUnresolved, e2?.personalUnresolved) &&
        listEquality.equals(e1?.personalTrace, e2?.personalTrace) &&
        listEquality.equals(e1?.summary, e2?.summary) &&
        listEquality.equals(e1?.missingInfo, e2?.missingInfo) &&
        listEquality.equals(e1?.photoRequests, e2?.photoRequests) &&
        e1?.labelEvidenceUsed == e2?.labelEvidenceUsed &&
        e1?.evidenceRevision == e2?.evidenceRevision &&
        e1?.scoreText == e2?.scoreText &&
        e1?.scoreCoverage == e2?.scoreCoverage &&
        e1?.scoreMaxPossible == e2?.scoreMaxPossible &&
        e1?.scoreBasis == e2?.scoreBasis &&
        e1?.verdict == e2?.verdict &&
        e1?.verdictSource == e2?.verdictSource &&
        e1?.verdictStatus == e2?.verdictStatus &&
        listEquality.equals(e1?.positives, e2?.positives) &&
        listEquality.equals(e1?.cautions, e2?.cautions) &&
        e1?.ingredientsPreview == e2?.ingredientsPreview &&
        e1?.ingredientsCount == e2?.ingredientsCount &&
        e1?.verificationStatus == e2?.verificationStatus &&
        e1?.recallStatusLabel == e2?.recallStatusLabel &&
        e1?.recallSeverity == e2?.recallSeverity &&
        e1?.recallCheckedLabel == e2?.recallCheckedLabel;
  }

  @override
  int hash(ScansRecord? e) => const ListEquality().hash([
        e?.barcode,
        e?.petId,
        e?.source,
        e?.status,
        e?.createdAt,
        e?.clientVersion,
        e?.favorite,
        e?.skipPhotos,
        e?.retryRequested,
        e?.refreshPersonalRequested,
        e?.statusMessage,
        e?.progress,
        e?.traceId,
        e?.gtin,
        e?.barcodeKind,
        e?.claimCount,
        e?.duplicateDeliveries,
        e?.errorCode,
        e?.errorMessage,
        e?.errorRetryable,
        e?.startedAt,
        e?.updatedAt,
        e?.assessedAt,
        e?.completedAt,
        e?.productName,
        e?.brand,
        e?.imageUrl,
        e?.productSpecies,
        e?.productSpeciesLabel,
        e?.productCategory,
        e?.productCategoryLabel,
        e?.scope,
        e?.scopeReason,
        e?.outOfScopeKind,
        e?.identitySource,
        e?.productFound,
        e?.resultState,
        e?.resultLabel,
        e?.scoreAvailable,
        e?.score,
        e?.scoreBand,
        e?.scoreLabel,
        e?.scoreProvisional,
        e?.scoreWithheldReason,
        e?.scoreVersion,
        e?.kbVersion,
        const ListEquality().hash(e?.scoreComponents),
        const ListEquality().hash(e?.generalFindings),
        const ListEquality().hash(e?.ingredientNotes),
        e?.explanationsStatus,
        e?.ingredientsText,
        e?.ingredientsSource,
        const ListEquality().hash(e?.nutrition),
        e?.nutritionSource,
        const ListEquality().hash(e?.nutritionContext),
        e?.caloriesText,
        e?.adequacyText,
        e?.adequacySummary,
        e?.adequacySource,
        e?.activeIngredientsSource,
        e?.supplementSummary,
        const ListEquality().hash(e?.supplementPurposes),
        const ListEquality().hash(e?.supplementActives),
        e?.supplementActivesSource,
        const ListEquality().hash(e?.supplementWarnings),
        const ListEquality().hash(e?.supplementLimitations),
        const ListEquality().hash(e?.supplementQualitySignals),
        e?.recallStatus,
        e?.recallSummary,
        e?.recallCheckedAt,
        const ListEquality().hash(e?.recallRecords),
        const ListEquality().hash(e?.sources),
        const ListEquality().hash(e?.evidenceNotes),
        const ListEquality().hash(e?.sourceChecks),
        e?.lastJob,
        e?.petName,
        e?.profileVersion,
        e?.personalState,
        e?.personalHeadline,
        const ListEquality().hash(e?.personalFindings),
        const ListEquality().hash(e?.personalUnresolved),
        const ListEquality().hash(e?.personalTrace),
        const ListEquality().hash(e?.summary),
        const ListEquality().hash(e?.missingInfo),
        const ListEquality().hash(e?.photoRequests),
        e?.labelEvidenceUsed,
        e?.evidenceRevision,
        e?.scoreText,
        e?.scoreCoverage,
        e?.scoreMaxPossible,
        e?.scoreBasis,
        e?.verdict,
        e?.verdictSource,
        e?.verdictStatus,
        const ListEquality().hash(e?.positives),
        const ListEquality().hash(e?.cautions),
        e?.ingredientsPreview,
        e?.ingredientsCount,
        e?.verificationStatus,
        e?.recallStatusLabel,
        e?.recallSeverity,
        e?.recallCheckedLabel
      ]);

  @override
  bool isValidKey(Object? o) => o is ScansRecord;
}
