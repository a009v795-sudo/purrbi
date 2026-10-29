// ignore_for_file: unnecessary_getters_setters

import 'package:cloud_firestore/cloud_firestore.dart' hide Type;

import '/backend/schema/util/firestore_util.dart';
import '/backend/schema/util/schema_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

/// Struct JobInfo
class JobInfoStruct extends FFFirebaseStruct {
  JobInfoStruct({
    /// JobInfo.kind
    String? kind,

    /// JobInfo.traceId
    String? traceId,

    /// JobInfo.startedAt
    DateTime? startedAt,

    /// JobInfo.finishedAt
    DateTime? finishedAt,

    /// JobInfo.productCache
    String? productCache,

    /// JobInfo.recallCache
    String? recallCache,

    /// JobInfo.explanationsCached
    int? explanationsCached,

    /// JobInfo.explanationsNew
    int? explanationsNew,

    /// JobInfo.externalCalls
    int? externalCalls,

    /// JobInfo.aiCalls
    int? aiCalls,

    /// JobInfo.failedCalls
    int? failedCalls,
    FirestoreUtilData firestoreUtilData = const FirestoreUtilData(),
  })  : _kind = kind,
        _traceId = traceId,
        _startedAt = startedAt,
        _finishedAt = finishedAt,
        _productCache = productCache,
        _recallCache = recallCache,
        _explanationsCached = explanationsCached,
        _explanationsNew = explanationsNew,
        _externalCalls = externalCalls,
        _aiCalls = aiCalls,
        _failedCalls = failedCalls,
        super(firestoreUtilData);

  // "kind" field.
  String? _kind;
  String get kind => _kind ?? '';
  set kind(String? val) => _kind = val;

  bool hasKind() => _kind != null;

  // "traceId" field.
  String? _traceId;
  String get traceId => _traceId ?? '';
  set traceId(String? val) => _traceId = val;

  bool hasTraceId() => _traceId != null;

  // "startedAt" field.
  DateTime? _startedAt;
  DateTime? get startedAt => _startedAt;
  set startedAt(DateTime? val) => _startedAt = val;

  bool hasStartedAt() => _startedAt != null;

  // "finishedAt" field.
  DateTime? _finishedAt;
  DateTime? get finishedAt => _finishedAt;
  set finishedAt(DateTime? val) => _finishedAt = val;

  bool hasFinishedAt() => _finishedAt != null;

  // "productCache" field.
  String? _productCache;
  String get productCache => _productCache ?? '';
  set productCache(String? val) => _productCache = val;

  bool hasProductCache() => _productCache != null;

  // "recallCache" field.
  String? _recallCache;
  String get recallCache => _recallCache ?? '';
  set recallCache(String? val) => _recallCache = val;

  bool hasRecallCache() => _recallCache != null;

  // "explanationsCached" field.
  int? _explanationsCached;
  int get explanationsCached => _explanationsCached ?? 0;
  set explanationsCached(int? val) => _explanationsCached = val;

  void incrementExplanationsCached(int amount) =>
      explanationsCached = explanationsCached + amount;

  bool hasExplanationsCached() => _explanationsCached != null;

  // "explanationsNew" field.
  int? _explanationsNew;
  int get explanationsNew => _explanationsNew ?? 0;
  set explanationsNew(int? val) => _explanationsNew = val;

  void incrementExplanationsNew(int amount) =>
      explanationsNew = explanationsNew + amount;

  bool hasExplanationsNew() => _explanationsNew != null;

  // "externalCalls" field.
  int? _externalCalls;
  int get externalCalls => _externalCalls ?? 0;
  set externalCalls(int? val) => _externalCalls = val;

  void incrementExternalCalls(int amount) =>
      externalCalls = externalCalls + amount;

  bool hasExternalCalls() => _externalCalls != null;

  // "aiCalls" field.
  int? _aiCalls;
  int get aiCalls => _aiCalls ?? 0;
  set aiCalls(int? val) => _aiCalls = val;

  void incrementAiCalls(int amount) => aiCalls = aiCalls + amount;

  bool hasAiCalls() => _aiCalls != null;

  // "failedCalls" field.
  int? _failedCalls;
  int get failedCalls => _failedCalls ?? 0;
  set failedCalls(int? val) => _failedCalls = val;

  void incrementFailedCalls(int amount) => failedCalls = failedCalls + amount;

  bool hasFailedCalls() => _failedCalls != null;

  static JobInfoStruct fromMap(Map<String, dynamic> data) => JobInfoStruct(
        kind: data['kind'] as String?,
        traceId: data['traceId'] as String?,
        startedAt: data['startedAt'] as DateTime?,
        finishedAt: data['finishedAt'] as DateTime?,
        productCache: data['productCache'] as String?,
        recallCache: data['recallCache'] as String?,
        explanationsCached: castToType<int>(data['explanationsCached']),
        explanationsNew: castToType<int>(data['explanationsNew']),
        externalCalls: castToType<int>(data['externalCalls']),
        aiCalls: castToType<int>(data['aiCalls']),
        failedCalls: castToType<int>(data['failedCalls']),
      );

  static JobInfoStruct? maybeFromMap(dynamic data) =>
      data is Map ? JobInfoStruct.fromMap(data.cast<String, dynamic>()) : null;

  Map<String, dynamic> toMap() => {
        'kind': _kind,
        'traceId': _traceId,
        'startedAt': _startedAt,
        'finishedAt': _finishedAt,
        'productCache': _productCache,
        'recallCache': _recallCache,
        'explanationsCached': _explanationsCached,
        'explanationsNew': _explanationsNew,
        'externalCalls': _externalCalls,
        'aiCalls': _aiCalls,
        'failedCalls': _failedCalls,
      }.withoutNulls;

  @override
  Map<String, dynamic> toSerializableMap() => {
        'kind': serializeParam(
          _kind,
          ParamType.String,
        ),
        'traceId': serializeParam(
          _traceId,
          ParamType.String,
        ),
        'startedAt': serializeParam(
          _startedAt,
          ParamType.DateTime,
        ),
        'finishedAt': serializeParam(
          _finishedAt,
          ParamType.DateTime,
        ),
        'productCache': serializeParam(
          _productCache,
          ParamType.String,
        ),
        'recallCache': serializeParam(
          _recallCache,
          ParamType.String,
        ),
        'explanationsCached': serializeParam(
          _explanationsCached,
          ParamType.int,
        ),
        'explanationsNew': serializeParam(
          _explanationsNew,
          ParamType.int,
        ),
        'externalCalls': serializeParam(
          _externalCalls,
          ParamType.int,
        ),
        'aiCalls': serializeParam(
          _aiCalls,
          ParamType.int,
        ),
        'failedCalls': serializeParam(
          _failedCalls,
          ParamType.int,
        ),
      }.withoutNulls;

  static JobInfoStruct fromSerializableMap(Map<String, dynamic> data) =>
      JobInfoStruct(
        kind: deserializeParam(
          data['kind'],
          ParamType.String,
          false,
        ),
        traceId: deserializeParam(
          data['traceId'],
          ParamType.String,
          false,
        ),
        startedAt: deserializeParam(
          data['startedAt'],
          ParamType.DateTime,
          false,
        ),
        finishedAt: deserializeParam(
          data['finishedAt'],
          ParamType.DateTime,
          false,
        ),
        productCache: deserializeParam(
          data['productCache'],
          ParamType.String,
          false,
        ),
        recallCache: deserializeParam(
          data['recallCache'],
          ParamType.String,
          false,
        ),
        explanationsCached: deserializeParam(
          data['explanationsCached'],
          ParamType.int,
          false,
        ),
        explanationsNew: deserializeParam(
          data['explanationsNew'],
          ParamType.int,
          false,
        ),
        externalCalls: deserializeParam(
          data['externalCalls'],
          ParamType.int,
          false,
        ),
        aiCalls: deserializeParam(
          data['aiCalls'],
          ParamType.int,
          false,
        ),
        failedCalls: deserializeParam(
          data['failedCalls'],
          ParamType.int,
          false,
        ),
      );

  @override
  String toString() => 'JobInfoStruct(${toMap()})';

  @override
  bool operator ==(Object other) {
    return other is JobInfoStruct &&
        kind == other.kind &&
        traceId == other.traceId &&
        startedAt == other.startedAt &&
        finishedAt == other.finishedAt &&
        productCache == other.productCache &&
        recallCache == other.recallCache &&
        explanationsCached == other.explanationsCached &&
        explanationsNew == other.explanationsNew &&
        externalCalls == other.externalCalls &&
        aiCalls == other.aiCalls &&
        failedCalls == other.failedCalls;
  }

  @override
  int get hashCode => const ListEquality().hash([
        kind,
        traceId,
        startedAt,
        finishedAt,
        productCache,
        recallCache,
        explanationsCached,
        explanationsNew,
        externalCalls,
        aiCalls,
        failedCalls
      ]);
}

JobInfoStruct createJobInfoStruct({
  String? kind,
  String? traceId,
  DateTime? startedAt,
  DateTime? finishedAt,
  String? productCache,
  String? recallCache,
  int? explanationsCached,
  int? explanationsNew,
  int? externalCalls,
  int? aiCalls,
  int? failedCalls,
  Map<String, dynamic> fieldValues = const {},
  bool clearUnsetFields = true,
  bool create = false,
  bool delete = false,
}) =>
    JobInfoStruct(
      kind: kind,
      traceId: traceId,
      startedAt: startedAt,
      finishedAt: finishedAt,
      productCache: productCache,
      recallCache: recallCache,
      explanationsCached: explanationsCached,
      explanationsNew: explanationsNew,
      externalCalls: externalCalls,
      aiCalls: aiCalls,
      failedCalls: failedCalls,
      firestoreUtilData: FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
        delete: delete,
        fieldValues: fieldValues,
      ),
    );

JobInfoStruct? updateJobInfoStruct(
  JobInfoStruct? jobInfo, {
  bool clearUnsetFields = true,
  bool create = false,
}) =>
    jobInfo
      ?..firestoreUtilData = FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
      );

void addJobInfoStructData(
  Map<String, dynamic> firestoreData,
  JobInfoStruct? jobInfo,
  String fieldName, [
  bool forFieldValue = false,
]) {
  firestoreData.remove(fieldName);
  if (jobInfo == null) {
    return;
  }
  if (jobInfo.firestoreUtilData.delete) {
    firestoreData[fieldName] = FieldValue.delete();
    return;
  }
  final clearFields =
      !forFieldValue && jobInfo.firestoreUtilData.clearUnsetFields;
  if (clearFields) {
    firestoreData[fieldName] = <String, dynamic>{};
  }
  final jobInfoData = getJobInfoFirestoreData(jobInfo, forFieldValue);
  final nestedData = jobInfoData.map((k, v) => MapEntry('$fieldName.$k', v));

  final mergeFields = jobInfo.firestoreUtilData.create || clearFields;
  firestoreData
      .addAll(mergeFields ? mergeNestedFields(nestedData) : nestedData);
}

Map<String, dynamic> getJobInfoFirestoreData(
  JobInfoStruct? jobInfo, [
  bool forFieldValue = false,
]) {
  if (jobInfo == null) {
    return {};
  }
  final firestoreData = mapToFirestore(jobInfo.toMap());

  // Add any Firestore field values
  mapToFirestore(jobInfo.firestoreUtilData.fieldValues)
      .forEach((k, v) => firestoreData[k] = v);

  return forFieldValue ? mergeNestedFields(firestoreData) : firestoreData;
}

List<Map<String, dynamic>> getJobInfoListFirestoreData(
  List<JobInfoStruct>? jobInfos,
) =>
    jobInfos?.map((e) => getJobInfoFirestoreData(e, true)).toList() ?? [];
