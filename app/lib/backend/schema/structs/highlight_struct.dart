// ignore_for_file: unnecessary_getters_setters

import 'package:cloud_firestore/cloud_firestore.dart' hide Type;

import '/backend/schema/util/firestore_util.dart';
import '/backend/schema/util/schema_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

/// Struct Highlight
class HighlightStruct extends FFFirebaseStruct {
  HighlightStruct({
    /// Highlight.kind
    String? kind,

    /// Highlight.severity
    String? severity,

    /// Highlight.title
    String? title,

    /// Highlight.detail
    String? detail,

    /// Highlight.value
    String? value,

    /// Highlight.evidence
    String? evidence,

    /// Highlight.rule
    String? rule,
    FirestoreUtilData firestoreUtilData = const FirestoreUtilData(),
  })  : _kind = kind,
        _severity = severity,
        _title = title,
        _detail = detail,
        _value = value,
        _evidence = evidence,
        _rule = rule,
        super(firestoreUtilData);

  // "kind" field.
  String? _kind;
  String get kind => _kind ?? '';
  set kind(String? val) => _kind = val;

  bool hasKind() => _kind != null;

  // "severity" field.
  String? _severity;
  String get severity => _severity ?? '';
  set severity(String? val) => _severity = val;

  bool hasSeverity() => _severity != null;

  // "title" field.
  String? _title;
  String get title => _title ?? '';
  set title(String? val) => _title = val;

  bool hasTitle() => _title != null;

  // "detail" field.
  String? _detail;
  String get detail => _detail ?? '';
  set detail(String? val) => _detail = val;

  bool hasDetail() => _detail != null;

  // "value" field.
  String? _value;
  String get value => _value ?? '';
  set value(String? val) => _value = val;

  bool hasValue() => _value != null;

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

  static HighlightStruct fromMap(Map<String, dynamic> data) => HighlightStruct(
        kind: data['kind'] as String?,
        severity: data['severity'] as String?,
        title: data['title'] as String?,
        detail: data['detail'] as String?,
        value: data['value'] as String?,
        evidence: data['evidence'] as String?,
        rule: data['rule'] as String?,
      );

  static HighlightStruct? maybeFromMap(dynamic data) => data is Map
      ? HighlightStruct.fromMap(data.cast<String, dynamic>())
      : null;

  Map<String, dynamic> toMap() => {
        'kind': _kind,
        'severity': _severity,
        'title': _title,
        'detail': _detail,
        'value': _value,
        'evidence': _evidence,
        'rule': _rule,
      }.withoutNulls;

  @override
  Map<String, dynamic> toSerializableMap() => {
        'kind': serializeParam(
          _kind,
          ParamType.String,
        ),
        'severity': serializeParam(
          _severity,
          ParamType.String,
        ),
        'title': serializeParam(
          _title,
          ParamType.String,
        ),
        'detail': serializeParam(
          _detail,
          ParamType.String,
        ),
        'value': serializeParam(
          _value,
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

  static HighlightStruct fromSerializableMap(Map<String, dynamic> data) =>
      HighlightStruct(
        kind: deserializeParam(
          data['kind'],
          ParamType.String,
          false,
        ),
        severity: deserializeParam(
          data['severity'],
          ParamType.String,
          false,
        ),
        title: deserializeParam(
          data['title'],
          ParamType.String,
          false,
        ),
        detail: deserializeParam(
          data['detail'],
          ParamType.String,
          false,
        ),
        value: deserializeParam(
          data['value'],
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
  String toString() => 'HighlightStruct(${toMap()})';

  @override
  bool operator ==(Object other) {
    return other is HighlightStruct &&
        kind == other.kind &&
        severity == other.severity &&
        title == other.title &&
        detail == other.detail &&
        value == other.value &&
        evidence == other.evidence &&
        rule == other.rule;
  }

  @override
  int get hashCode => const ListEquality()
      .hash([kind, severity, title, detail, value, evidence, rule]);
}

HighlightStruct createHighlightStruct({
  String? kind,
  String? severity,
  String? title,
  String? detail,
  String? value,
  String? evidence,
  String? rule,
  Map<String, dynamic> fieldValues = const {},
  bool clearUnsetFields = true,
  bool create = false,
  bool delete = false,
}) =>
    HighlightStruct(
      kind: kind,
      severity: severity,
      title: title,
      detail: detail,
      value: value,
      evidence: evidence,
      rule: rule,
      firestoreUtilData: FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
        delete: delete,
        fieldValues: fieldValues,
      ),
    );

HighlightStruct? updateHighlightStruct(
  HighlightStruct? highlight, {
  bool clearUnsetFields = true,
  bool create = false,
}) =>
    highlight
      ?..firestoreUtilData = FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
      );

void addHighlightStructData(
  Map<String, dynamic> firestoreData,
  HighlightStruct? highlight,
  String fieldName, [
  bool forFieldValue = false,
]) {
  firestoreData.remove(fieldName);
  if (highlight == null) {
    return;
  }
  if (highlight.firestoreUtilData.delete) {
    firestoreData[fieldName] = FieldValue.delete();
    return;
  }
  final clearFields =
      !forFieldValue && highlight.firestoreUtilData.clearUnsetFields;
  if (clearFields) {
    firestoreData[fieldName] = <String, dynamic>{};
  }
  final highlightData = getHighlightFirestoreData(highlight, forFieldValue);
  final nestedData = highlightData.map((k, v) => MapEntry('$fieldName.$k', v));

  final mergeFields = highlight.firestoreUtilData.create || clearFields;
  firestoreData
      .addAll(mergeFields ? mergeNestedFields(nestedData) : nestedData);
}

Map<String, dynamic> getHighlightFirestoreData(
  HighlightStruct? highlight, [
  bool forFieldValue = false,
]) {
  if (highlight == null) {
    return {};
  }
  final firestoreData = mapToFirestore(highlight.toMap());

  // Add any Firestore field values
  mapToFirestore(highlight.firestoreUtilData.fieldValues)
      .forEach((k, v) => firestoreData[k] = v);

  return forFieldValue ? mergeNestedFields(firestoreData) : firestoreData;
}

List<Map<String, dynamic>> getHighlightListFirestoreData(
  List<HighlightStruct>? highlights,
) =>
    highlights?.map((e) => getHighlightFirestoreData(e, true)).toList() ?? [];
