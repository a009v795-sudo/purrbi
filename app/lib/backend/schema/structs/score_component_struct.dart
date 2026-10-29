// ignore_for_file: unnecessary_getters_setters

import 'package:cloud_firestore/cloud_firestore.dart' hide Type;

import '/backend/schema/util/firestore_util.dart';
import '/backend/schema/util/schema_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

/// Struct ScoreComponent
class ScoreComponentStruct extends FFFirebaseStruct {
  ScoreComponentStruct({
    /// ScoreComponent.key
    String? key,

    /// ScoreComponent.label
    String? label,

    /// ScoreComponent.points
    int? points,

    /// ScoreComponent.maxPoints
    int? maxPoints,

    /// ScoreComponent.status
    String? status,

    /// ScoreComponent.explanation
    String? explanation,
    FirestoreUtilData firestoreUtilData = const FirestoreUtilData(),
  })  : _key = key,
        _label = label,
        _points = points,
        _maxPoints = maxPoints,
        _status = status,
        _explanation = explanation,
        super(firestoreUtilData);

  // "key" field.
  String? _key;
  String get key => _key ?? '';
  set key(String? val) => _key = val;

  bool hasKey() => _key != null;

  // "label" field.
  String? _label;
  String get label => _label ?? '';
  set label(String? val) => _label = val;

  bool hasLabel() => _label != null;

  // "points" field.
  int? _points;
  int get points => _points ?? 0;
  set points(int? val) => _points = val;

  void incrementPoints(int amount) => points = points + amount;

  bool hasPoints() => _points != null;

  // "maxPoints" field.
  int? _maxPoints;
  int get maxPoints => _maxPoints ?? 0;
  set maxPoints(int? val) => _maxPoints = val;

  void incrementMaxPoints(int amount) => maxPoints = maxPoints + amount;

  bool hasMaxPoints() => _maxPoints != null;

  // "status" field.
  String? _status;
  String get status => _status ?? '';
  set status(String? val) => _status = val;

  bool hasStatus() => _status != null;

  // "explanation" field.
  String? _explanation;
  String get explanation => _explanation ?? '';
  set explanation(String? val) => _explanation = val;

  bool hasExplanation() => _explanation != null;

  static ScoreComponentStruct fromMap(Map<String, dynamic> data) =>
      ScoreComponentStruct(
        key: data['key'] as String?,
        label: data['label'] as String?,
        points: castToType<int>(data['points']),
        maxPoints: castToType<int>(data['maxPoints']),
        status: data['status'] as String?,
        explanation: data['explanation'] as String?,
      );

  static ScoreComponentStruct? maybeFromMap(dynamic data) => data is Map
      ? ScoreComponentStruct.fromMap(data.cast<String, dynamic>())
      : null;

  Map<String, dynamic> toMap() => {
        'key': _key,
        'label': _label,
        'points': _points,
        'maxPoints': _maxPoints,
        'status': _status,
        'explanation': _explanation,
      }.withoutNulls;

  @override
  Map<String, dynamic> toSerializableMap() => {
        'key': serializeParam(
          _key,
          ParamType.String,
        ),
        'label': serializeParam(
          _label,
          ParamType.String,
        ),
        'points': serializeParam(
          _points,
          ParamType.int,
        ),
        'maxPoints': serializeParam(
          _maxPoints,
          ParamType.int,
        ),
        'status': serializeParam(
          _status,
          ParamType.String,
        ),
        'explanation': serializeParam(
          _explanation,
          ParamType.String,
        ),
      }.withoutNulls;

  static ScoreComponentStruct fromSerializableMap(Map<String, dynamic> data) =>
      ScoreComponentStruct(
        key: deserializeParam(
          data['key'],
          ParamType.String,
          false,
        ),
        label: deserializeParam(
          data['label'],
          ParamType.String,
          false,
        ),
        points: deserializeParam(
          data['points'],
          ParamType.int,
          false,
        ),
        maxPoints: deserializeParam(
          data['maxPoints'],
          ParamType.int,
          false,
        ),
        status: deserializeParam(
          data['status'],
          ParamType.String,
          false,
        ),
        explanation: deserializeParam(
          data['explanation'],
          ParamType.String,
          false,
        ),
      );

  @override
  String toString() => 'ScoreComponentStruct(${toMap()})';

  @override
  bool operator ==(Object other) {
    return other is ScoreComponentStruct &&
        key == other.key &&
        label == other.label &&
        points == other.points &&
        maxPoints == other.maxPoints &&
        status == other.status &&
        explanation == other.explanation;
  }

  @override
  int get hashCode => const ListEquality()
      .hash([key, label, points, maxPoints, status, explanation]);
}

ScoreComponentStruct createScoreComponentStruct({
  String? key,
  String? label,
  int? points,
  int? maxPoints,
  String? status,
  String? explanation,
  Map<String, dynamic> fieldValues = const {},
  bool clearUnsetFields = true,
  bool create = false,
  bool delete = false,
}) =>
    ScoreComponentStruct(
      key: key,
      label: label,
      points: points,
      maxPoints: maxPoints,
      status: status,
      explanation: explanation,
      firestoreUtilData: FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
        delete: delete,
        fieldValues: fieldValues,
      ),
    );

ScoreComponentStruct? updateScoreComponentStruct(
  ScoreComponentStruct? scoreComponent, {
  bool clearUnsetFields = true,
  bool create = false,
}) =>
    scoreComponent
      ?..firestoreUtilData = FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
      );

void addScoreComponentStructData(
  Map<String, dynamic> firestoreData,
  ScoreComponentStruct? scoreComponent,
  String fieldName, [
  bool forFieldValue = false,
]) {
  firestoreData.remove(fieldName);
  if (scoreComponent == null) {
    return;
  }
  if (scoreComponent.firestoreUtilData.delete) {
    firestoreData[fieldName] = FieldValue.delete();
    return;
  }
  final clearFields =
      !forFieldValue && scoreComponent.firestoreUtilData.clearUnsetFields;
  if (clearFields) {
    firestoreData[fieldName] = <String, dynamic>{};
  }
  final scoreComponentData =
      getScoreComponentFirestoreData(scoreComponent, forFieldValue);
  final nestedData =
      scoreComponentData.map((k, v) => MapEntry('$fieldName.$k', v));

  final mergeFields = scoreComponent.firestoreUtilData.create || clearFields;
  firestoreData
      .addAll(mergeFields ? mergeNestedFields(nestedData) : nestedData);
}

Map<String, dynamic> getScoreComponentFirestoreData(
  ScoreComponentStruct? scoreComponent, [
  bool forFieldValue = false,
]) {
  if (scoreComponent == null) {
    return {};
  }
  final firestoreData = mapToFirestore(scoreComponent.toMap());

  // Add any Firestore field values
  mapToFirestore(scoreComponent.firestoreUtilData.fieldValues)
      .forEach((k, v) => firestoreData[k] = v);

  return forFieldValue ? mergeNestedFields(firestoreData) : firestoreData;
}

List<Map<String, dynamic>> getScoreComponentListFirestoreData(
  List<ScoreComponentStruct>? scoreComponents,
) =>
    scoreComponents
        ?.map((e) => getScoreComponentFirestoreData(e, true))
        .toList() ??
    [];
