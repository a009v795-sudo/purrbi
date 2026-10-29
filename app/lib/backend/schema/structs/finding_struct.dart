// ignore_for_file: unnecessary_getters_setters

import 'package:cloud_firestore/cloud_firestore.dart' hide Type;

import '/backend/schema/util/firestore_util.dart';
import '/backend/schema/util/schema_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

/// Struct Finding
class FindingStruct extends FFFirebaseStruct {
  FindingStruct({
    /// Finding.kind
    String? kind,

    /// Finding.text
    String? text,

    /// Finding.evidence
    String? evidence,

    /// Finding.rule
    String? rule,
    FirestoreUtilData firestoreUtilData = const FirestoreUtilData(),
  })  : _kind = kind,
        _text = text,
        _evidence = evidence,
        _rule = rule,
        super(firestoreUtilData);

  // "kind" field.
  String? _kind;
  String get kind => _kind ?? '';
  set kind(String? val) => _kind = val;

  bool hasKind() => _kind != null;

  // "text" field.
  String? _text;
  String get text => _text ?? '';
  set text(String? val) => _text = val;

  bool hasText() => _text != null;

  // "evidence" field.
  String? _evidence;
  String get evidence => _evidence ?? '';
  set evidence(String? val) => _evidence = val;

  bool hasEvidence() => _evidence != null;

  // "rule" field.
  String? _rule;
  String get rule => _rule ?? '';
  set rule(String? val) => _rule = val;

  bool hasRule() => _rule != null;

  static FindingStruct fromMap(Map<String, dynamic> data) => FindingStruct(
        kind: data['kind'] as String?,
        text: data['text'] as String?,
        evidence: data['evidence'] as String?,
        rule: data['rule'] as String?,
      );

  static FindingStruct? maybeFromMap(dynamic data) =>
      data is Map ? FindingStruct.fromMap(data.cast<String, dynamic>()) : null;

  Map<String, dynamic> toMap() => {
        'kind': _kind,
        'text': _text,
        'evidence': _evidence,
        'rule': _rule,
      }.withoutNulls;

  @override
  Map<String, dynamic> toSerializableMap() => {
        'kind': serializeParam(
          _kind,
          ParamType.String,
        ),
        'text': serializeParam(
          _text,
          ParamType.String,
        ),
        'evidence': serializeParam(
          _evidence,
          ParamType.String,
        ),
        'rule': serializeParam(
          _rule,
          ParamType.String,
        ),
      }.withoutNulls;

  static FindingStruct fromSerializableMap(Map<String, dynamic> data) =>
      FindingStruct(
        kind: deserializeParam(
          data['kind'],
          ParamType.String,
          false,
        ),
        text: deserializeParam(
          data['text'],
          ParamType.String,
          false,
        ),
        evidence: deserializeParam(
          data['evidence'],
          ParamType.String,
          false,
        ),
        rule: deserializeParam(
          data['rule'],
          ParamType.String,
          false,
        ),
      );

  @override
  String toString() => 'FindingStruct(${toMap()})';

  @override
  bool operator ==(Object other) {
    return other is FindingStruct &&
        kind == other.kind &&
        text == other.text &&
        evidence == other.evidence &&
        rule == other.rule;
  }

  @override
  int get hashCode => const ListEquality().hash([kind, text, evidence, rule]);
}

FindingStruct createFindingStruct({
  String? kind,
  String? text,
  String? evidence,
  String? rule,
  Map<String, dynamic> fieldValues = const {},
  bool clearUnsetFields = true,
  bool create = false,
  bool delete = false,
}) =>
    FindingStruct(
      kind: kind,
      text: text,
      evidence: evidence,
      rule: rule,
      firestoreUtilData: FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
        delete: delete,
        fieldValues: fieldValues,
      ),
    );

FindingStruct? updateFindingStruct(
  FindingStruct? finding, {
  bool clearUnsetFields = true,
  bool create = false,
}) =>
    finding
      ?..firestoreUtilData = FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
      );

void addFindingStructData(
  Map<String, dynamic> firestoreData,
  FindingStruct? finding,
  String fieldName, [
  bool forFieldValue = false,
]) {
  firestoreData.remove(fieldName);
  if (finding == null) {
    return;
  }
  if (finding.firestoreUtilData.delete) {
    firestoreData[fieldName] = FieldValue.delete();
    return;
  }
  final clearFields =
      !forFieldValue && finding.firestoreUtilData.clearUnsetFields;
  if (clearFields) {
    firestoreData[fieldName] = <String, dynamic>{};
  }
  final findingData = getFindingFirestoreData(finding, forFieldValue);
  final nestedData = findingData.map((k, v) => MapEntry('$fieldName.$k', v));

  final mergeFields = finding.firestoreUtilData.create || clearFields;
  firestoreData
      .addAll(mergeFields ? mergeNestedFields(nestedData) : nestedData);
}

Map<String, dynamic> getFindingFirestoreData(
  FindingStruct? finding, [
  bool forFieldValue = false,
]) {
  if (finding == null) {
    return {};
  }
  final firestoreData = mapToFirestore(finding.toMap());

  // Add any Firestore field values
  mapToFirestore(finding.firestoreUtilData.fieldValues)
      .forEach((k, v) => firestoreData[k] = v);

  return forFieldValue ? mergeNestedFields(firestoreData) : firestoreData;
}

List<Map<String, dynamic>> getFindingListFirestoreData(
  List<FindingStruct>? findings,
) =>
    findings?.map((e) => getFindingFirestoreData(e, true)).toList() ?? [];
