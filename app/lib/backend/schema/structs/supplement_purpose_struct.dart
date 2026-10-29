// ignore_for_file: unnecessary_getters_setters

import 'package:cloud_firestore/cloud_firestore.dart' hide Type;

import '/backend/schema/util/firestore_util.dart';
import '/backend/schema/util/schema_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

/// Struct SupplementPurpose
class SupplementPurposeStruct extends FFFirebaseStruct {
  SupplementPurposeStruct({
    /// SupplementPurpose.key
    String? key,

    /// SupplementPurpose.label
    String? label,

    /// SupplementPurpose.evidence
    String? evidence,
    FirestoreUtilData firestoreUtilData = const FirestoreUtilData(),
  })  : _key = key,
        _label = label,
        _evidence = evidence,
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

  // "evidence" field.
  String? _evidence;
  String get evidence => _evidence ?? '';
  set evidence(String? val) => _evidence = val;

  bool hasEvidence() => _evidence != null;

  static SupplementPurposeStruct fromMap(Map<String, dynamic> data) =>
      SupplementPurposeStruct(
        key: data['key'] as String?,
        label: data['label'] as String?,
        evidence: data['evidence'] as String?,
      );

  static SupplementPurposeStruct? maybeFromMap(dynamic data) => data is Map
      ? SupplementPurposeStruct.fromMap(data.cast<String, dynamic>())
      : null;

  Map<String, dynamic> toMap() => {
        'key': _key,
        'label': _label,
        'evidence': _evidence,
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
        'evidence': serializeParam(
          _evidence,
          ParamType.String,
        ),
      }.withoutNulls;

  static SupplementPurposeStruct fromSerializableMap(
          Map<String, dynamic> data) =>
      SupplementPurposeStruct(
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
        evidence: deserializeParam(
          data['evidence'],
          ParamType.String,
          false,
        ),
      );

  @override
  String toString() => 'SupplementPurposeStruct(${toMap()})';

  @override
  bool operator ==(Object other) {
    return other is SupplementPurposeStruct &&
        key == other.key &&
        label == other.label &&
        evidence == other.evidence;
  }

  @override
  int get hashCode => const ListEquality().hash([key, label, evidence]);
}

SupplementPurposeStruct createSupplementPurposeStruct({
  String? key,
  String? label,
  String? evidence,
  Map<String, dynamic> fieldValues = const {},
  bool clearUnsetFields = true,
  bool create = false,
  bool delete = false,
}) =>
    SupplementPurposeStruct(
      key: key,
      label: label,
      evidence: evidence,
      firestoreUtilData: FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
        delete: delete,
        fieldValues: fieldValues,
      ),
    );

SupplementPurposeStruct? updateSupplementPurposeStruct(
  SupplementPurposeStruct? supplementPurpose, {
  bool clearUnsetFields = true,
  bool create = false,
}) =>
    supplementPurpose
      ?..firestoreUtilData = FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
      );

void addSupplementPurposeStructData(
  Map<String, dynamic> firestoreData,
  SupplementPurposeStruct? supplementPurpose,
  String fieldName, [
  bool forFieldValue = false,
]) {
  firestoreData.remove(fieldName);
  if (supplementPurpose == null) {
    return;
  }
  if (supplementPurpose.firestoreUtilData.delete) {
    firestoreData[fieldName] = FieldValue.delete();
    return;
  }
  final clearFields =
      !forFieldValue && supplementPurpose.firestoreUtilData.clearUnsetFields;
  if (clearFields) {
    firestoreData[fieldName] = <String, dynamic>{};
  }
  final supplementPurposeData =
      getSupplementPurposeFirestoreData(supplementPurpose, forFieldValue);
  final nestedData =
      supplementPurposeData.map((k, v) => MapEntry('$fieldName.$k', v));

  final mergeFields = supplementPurpose.firestoreUtilData.create || clearFields;
  firestoreData
      .addAll(mergeFields ? mergeNestedFields(nestedData) : nestedData);
}

Map<String, dynamic> getSupplementPurposeFirestoreData(
  SupplementPurposeStruct? supplementPurpose, [
  bool forFieldValue = false,
]) {
  if (supplementPurpose == null) {
    return {};
  }
  final firestoreData = mapToFirestore(supplementPurpose.toMap());

  // Add any Firestore field values
  mapToFirestore(supplementPurpose.firestoreUtilData.fieldValues)
      .forEach((k, v) => firestoreData[k] = v);

  return forFieldValue ? mergeNestedFields(firestoreData) : firestoreData;
}

List<Map<String, dynamic>> getSupplementPurposeListFirestoreData(
  List<SupplementPurposeStruct>? supplementPurposes,
) =>
    supplementPurposes
        ?.map((e) => getSupplementPurposeFirestoreData(e, true))
        .toList() ??
    [];
