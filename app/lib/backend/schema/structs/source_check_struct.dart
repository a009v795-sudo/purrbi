// ignore_for_file: unnecessary_getters_setters

import 'package:cloud_firestore/cloud_firestore.dart' hide Type;

import '/backend/schema/util/firestore_util.dart';
import '/backend/schema/util/schema_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

/// Struct SourceCheck
class SourceCheckStruct extends FFFirebaseStruct {
  SourceCheckStruct({
    /// SourceCheck.source
    String? source,

    /// SourceCheck.host
    String? host,

    /// SourceCheck.path
    String? path,

    /// SourceCheck.httpStatus
    int? httpStatus,

    /// SourceCheck.outcome
    String? outcome,

    /// SourceCheck.ms
    int? ms,

    /// SourceCheck.attempt
    int? attempt,
    FirestoreUtilData firestoreUtilData = const FirestoreUtilData(),
  })  : _source = source,
        _host = host,
        _path = path,
        _httpStatus = httpStatus,
        _outcome = outcome,
        _ms = ms,
        _attempt = attempt,
        super(firestoreUtilData);

  // "source" field.
  String? _source;
  String get source => _source ?? '';
  set source(String? val) => _source = val;

  bool hasSource() => _source != null;

  // "host" field.
  String? _host;
  String get host => _host ?? '';
  set host(String? val) => _host = val;

  bool hasHost() => _host != null;

  // "path" field.
  String? _path;
  String get path => _path ?? '';
  set path(String? val) => _path = val;

  bool hasPath() => _path != null;

  // "httpStatus" field.
  int? _httpStatus;
  int get httpStatus => _httpStatus ?? 0;
  set httpStatus(int? val) => _httpStatus = val;

  void incrementHttpStatus(int amount) => httpStatus = httpStatus + amount;

  bool hasHttpStatus() => _httpStatus != null;

  // "outcome" field.
  String? _outcome;
  String get outcome => _outcome ?? '';
  set outcome(String? val) => _outcome = val;

  bool hasOutcome() => _outcome != null;

  // "ms" field.
  int? _ms;
  int get ms => _ms ?? 0;
  set ms(int? val) => _ms = val;

  void incrementMs(int amount) => ms = ms + amount;

  bool hasMs() => _ms != null;

  // "attempt" field.
  int? _attempt;
  int get attempt => _attempt ?? 0;
  set attempt(int? val) => _attempt = val;

  void incrementAttempt(int amount) => attempt = attempt + amount;

  bool hasAttempt() => _attempt != null;

  static SourceCheckStruct fromMap(Map<String, dynamic> data) =>
      SourceCheckStruct(
        source: data['source'] as String?,
        host: data['host'] as String?,
        path: data['path'] as String?,
        httpStatus: castToType<int>(data['httpStatus']),
        outcome: data['outcome'] as String?,
        ms: castToType<int>(data['ms']),
        attempt: castToType<int>(data['attempt']),
      );

  static SourceCheckStruct? maybeFromMap(dynamic data) => data is Map
      ? SourceCheckStruct.fromMap(data.cast<String, dynamic>())
      : null;

  Map<String, dynamic> toMap() => {
        'source': _source,
        'host': _host,
        'path': _path,
        'httpStatus': _httpStatus,
        'outcome': _outcome,
        'ms': _ms,
        'attempt': _attempt,
      }.withoutNulls;

  @override
  Map<String, dynamic> toSerializableMap() => {
        'source': serializeParam(
          _source,
          ParamType.String,
        ),
        'host': serializeParam(
          _host,
          ParamType.String,
        ),
        'path': serializeParam(
          _path,
          ParamType.String,
        ),
        'httpStatus': serializeParam(
          _httpStatus,
          ParamType.int,
        ),
        'outcome': serializeParam(
          _outcome,
          ParamType.String,
        ),
        'ms': serializeParam(
          _ms,
          ParamType.int,
        ),
        'attempt': serializeParam(
          _attempt,
          ParamType.int,
        ),
      }.withoutNulls;

  static SourceCheckStruct fromSerializableMap(Map<String, dynamic> data) =>
      SourceCheckStruct(
        source: deserializeParam(
          data['source'],
          ParamType.String,
          false,
        ),
        host: deserializeParam(
          data['host'],
          ParamType.String,
          false,
        ),
        path: deserializeParam(
          data['path'],
          ParamType.String,
          false,
        ),
        httpStatus: deserializeParam(
          data['httpStatus'],
          ParamType.int,
          false,
        ),
        outcome: deserializeParam(
          data['outcome'],
          ParamType.String,
          false,
        ),
        ms: deserializeParam(
          data['ms'],
          ParamType.int,
          false,
        ),
        attempt: deserializeParam(
          data['attempt'],
          ParamType.int,
          false,
        ),
      );

  @override
  String toString() => 'SourceCheckStruct(${toMap()})';

  @override
  bool operator ==(Object other) {
    return other is SourceCheckStruct &&
        source == other.source &&
        host == other.host &&
        path == other.path &&
        httpStatus == other.httpStatus &&
        outcome == other.outcome &&
        ms == other.ms &&
        attempt == other.attempt;
  }

  @override
  int get hashCode => const ListEquality()
      .hash([source, host, path, httpStatus, outcome, ms, attempt]);
}

SourceCheckStruct createSourceCheckStruct({
  String? source,
  String? host,
  String? path,
  int? httpStatus,
  String? outcome,
  int? ms,
  int? attempt,
  Map<String, dynamic> fieldValues = const {},
  bool clearUnsetFields = true,
  bool create = false,
  bool delete = false,
}) =>
    SourceCheckStruct(
      source: source,
      host: host,
      path: path,
      httpStatus: httpStatus,
      outcome: outcome,
      ms: ms,
      attempt: attempt,
      firestoreUtilData: FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
        delete: delete,
        fieldValues: fieldValues,
      ),
    );

SourceCheckStruct? updateSourceCheckStruct(
  SourceCheckStruct? sourceCheck, {
  bool clearUnsetFields = true,
  bool create = false,
}) =>
    sourceCheck
      ?..firestoreUtilData = FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
      );

void addSourceCheckStructData(
  Map<String, dynamic> firestoreData,
  SourceCheckStruct? sourceCheck,
  String fieldName, [
  bool forFieldValue = false,
]) {
  firestoreData.remove(fieldName);
  if (sourceCheck == null) {
    return;
  }
  if (sourceCheck.firestoreUtilData.delete) {
    firestoreData[fieldName] = FieldValue.delete();
    return;
  }
  final clearFields =
      !forFieldValue && sourceCheck.firestoreUtilData.clearUnsetFields;
  if (clearFields) {
    firestoreData[fieldName] = <String, dynamic>{};
  }
  final sourceCheckData =
      getSourceCheckFirestoreData(sourceCheck, forFieldValue);
  final nestedData =
      sourceCheckData.map((k, v) => MapEntry('$fieldName.$k', v));

  final mergeFields = sourceCheck.firestoreUtilData.create || clearFields;
  firestoreData
      .addAll(mergeFields ? mergeNestedFields(nestedData) : nestedData);
}

Map<String, dynamic> getSourceCheckFirestoreData(
  SourceCheckStruct? sourceCheck, [
  bool forFieldValue = false,
]) {
  if (sourceCheck == null) {
    return {};
  }
  final firestoreData = mapToFirestore(sourceCheck.toMap());

  // Add any Firestore field values
  mapToFirestore(sourceCheck.firestoreUtilData.fieldValues)
      .forEach((k, v) => firestoreData[k] = v);

  return forFieldValue ? mergeNestedFields(firestoreData) : firestoreData;
}

List<Map<String, dynamic>> getSourceCheckListFirestoreData(
  List<SourceCheckStruct>? sourceChecks,
) =>
    sourceChecks?.map((e) => getSourceCheckFirestoreData(e, true)).toList() ??
    [];
