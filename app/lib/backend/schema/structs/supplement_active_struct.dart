// ignore_for_file: unnecessary_getters_setters

import 'package:cloud_firestore/cloud_firestore.dart' hide Type;

import '/backend/schema/util/firestore_util.dart';
import '/backend/schema/util/schema_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

/// Struct SupplementActive
class SupplementActiveStruct extends FFFirebaseStruct {
  SupplementActiveStruct({
    /// SupplementActive.name
    String? name,

    /// SupplementActive.amountText
    String? amountText,

    /// SupplementActive.evidence
    String? evidence,

    /// SupplementActive.note
    String? note,

    /// SupplementActive.sourceTitle
    String? sourceTitle,

    /// SupplementActive.sourceUrl
    String? sourceUrl,

    /// SupplementActive.quote
    String? quote,
    FirestoreUtilData firestoreUtilData = const FirestoreUtilData(),
  })  : _name = name,
        _amountText = amountText,
        _evidence = evidence,
        _note = note,
        _sourceTitle = sourceTitle,
        _sourceUrl = sourceUrl,
        _quote = quote,
        super(firestoreUtilData);

  // "name" field.
  String? _name;
  String get name => _name ?? '';
  set name(String? val) => _name = val;

  bool hasName() => _name != null;

  // "amountText" field.
  String? _amountText;
  String get amountText => _amountText ?? '';
  set amountText(String? val) => _amountText = val;

  bool hasAmountText() => _amountText != null;

  // "evidence" field.
  String? _evidence;
  String get evidence => _evidence ?? '';
  set evidence(String? val) => _evidence = val;

  bool hasEvidence() => _evidence != null;

  // "note" field.
  String? _note;
  String get note => _note ?? '';
  set note(String? val) => _note = val;

  bool hasNote() => _note != null;

  // "sourceTitle" field.
  String? _sourceTitle;
  String get sourceTitle => _sourceTitle ?? '';
  set sourceTitle(String? val) => _sourceTitle = val;

  bool hasSourceTitle() => _sourceTitle != null;

  // "sourceUrl" field.
  String? _sourceUrl;
  String get sourceUrl => _sourceUrl ?? '';
  set sourceUrl(String? val) => _sourceUrl = val;

  bool hasSourceUrl() => _sourceUrl != null;

  // "quote" field.
  String? _quote;
  String get quote => _quote ?? '';
  set quote(String? val) => _quote = val;

  bool hasQuote() => _quote != null;

  static SupplementActiveStruct fromMap(Map<String, dynamic> data) =>
      SupplementActiveStruct(
        name: data['name'] as String?,
        amountText: data['amountText'] as String?,
        evidence: data['evidence'] as String?,
        note: data['note'] as String?,
        sourceTitle: data['sourceTitle'] as String?,
        sourceUrl: data['sourceUrl'] as String?,
        quote: data['quote'] as String?,
      );

  static SupplementActiveStruct? maybeFromMap(dynamic data) => data is Map
      ? SupplementActiveStruct.fromMap(data.cast<String, dynamic>())
      : null;

  Map<String, dynamic> toMap() => {
        'name': _name,
        'amountText': _amountText,
        'evidence': _evidence,
        'note': _note,
        'sourceTitle': _sourceTitle,
        'sourceUrl': _sourceUrl,
        'quote': _quote,
      }.withoutNulls;

  @override
  Map<String, dynamic> toSerializableMap() => {
        'name': serializeParam(
          _name,
          ParamType.String,
        ),
        'amountText': serializeParam(
          _amountText,
          ParamType.String,
        ),
        'evidence': serializeParam(
          _evidence,
          ParamType.String,
        ),
        'note': serializeParam(
          _note,
          ParamType.String,
        ),
        'sourceTitle': serializeParam(
          _sourceTitle,
          ParamType.String,
        ),
        'sourceUrl': serializeParam(
          _sourceUrl,
          ParamType.String,
        ),
        'quote': serializeParam(
          _quote,
          ParamType.String,
        ),
      }.withoutNulls;

  static SupplementActiveStruct fromSerializableMap(
          Map<String, dynamic> data) =>
      SupplementActiveStruct(
        name: deserializeParam(
          data['name'],
          ParamType.String,
          false,
        ),
        amountText: deserializeParam(
          data['amountText'],
          ParamType.String,
          false,
        ),
        evidence: deserializeParam(
          data['evidence'],
          ParamType.String,
          false,
        ),
        note: deserializeParam(
          data['note'],
          ParamType.String,
          false,
        ),
        sourceTitle: deserializeParam(
          data['sourceTitle'],
          ParamType.String,
          false,
        ),
        sourceUrl: deserializeParam(
          data['sourceUrl'],
          ParamType.String,
          false,
        ),
        quote: deserializeParam(
          data['quote'],
          ParamType.String,
          false,
        ),
      );

  @override
  String toString() => 'SupplementActiveStruct(${toMap()})';

  @override
  bool operator ==(Object other) {
    return other is SupplementActiveStruct &&
        name == other.name &&
        amountText == other.amountText &&
        evidence == other.evidence &&
        note == other.note &&
        sourceTitle == other.sourceTitle &&
        sourceUrl == other.sourceUrl &&
        quote == other.quote;
  }

  @override
  int get hashCode => const ListEquality()
      .hash([name, amountText, evidence, note, sourceTitle, sourceUrl, quote]);
}

SupplementActiveStruct createSupplementActiveStruct({
  String? name,
  String? amountText,
  String? evidence,
  String? note,
  String? sourceTitle,
  String? sourceUrl,
  String? quote,
  Map<String, dynamic> fieldValues = const {},
  bool clearUnsetFields = true,
  bool create = false,
  bool delete = false,
}) =>
    SupplementActiveStruct(
      name: name,
      amountText: amountText,
      evidence: evidence,
      note: note,
      sourceTitle: sourceTitle,
      sourceUrl: sourceUrl,
      quote: quote,
      firestoreUtilData: FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
        delete: delete,
        fieldValues: fieldValues,
      ),
    );

SupplementActiveStruct? updateSupplementActiveStruct(
  SupplementActiveStruct? supplementActive, {
  bool clearUnsetFields = true,
  bool create = false,
}) =>
    supplementActive
      ?..firestoreUtilData = FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
      );

void addSupplementActiveStructData(
  Map<String, dynamic> firestoreData,
  SupplementActiveStruct? supplementActive,
  String fieldName, [
  bool forFieldValue = false,
]) {
  firestoreData.remove(fieldName);
  if (supplementActive == null) {
    return;
  }
  if (supplementActive.firestoreUtilData.delete) {
    firestoreData[fieldName] = FieldValue.delete();
    return;
  }
  final clearFields =
      !forFieldValue && supplementActive.firestoreUtilData.clearUnsetFields;
  if (clearFields) {
    firestoreData[fieldName] = <String, dynamic>{};
  }
  final supplementActiveData =
      getSupplementActiveFirestoreData(supplementActive, forFieldValue);
  final nestedData =
      supplementActiveData.map((k, v) => MapEntry('$fieldName.$k', v));

  final mergeFields = supplementActive.firestoreUtilData.create || clearFields;
  firestoreData
      .addAll(mergeFields ? mergeNestedFields(nestedData) : nestedData);
}

Map<String, dynamic> getSupplementActiveFirestoreData(
  SupplementActiveStruct? supplementActive, [
  bool forFieldValue = false,
]) {
  if (supplementActive == null) {
    return {};
  }
  final firestoreData = mapToFirestore(supplementActive.toMap());

  // Add any Firestore field values
  mapToFirestore(supplementActive.firestoreUtilData.fieldValues)
      .forEach((k, v) => firestoreData[k] = v);

  return forFieldValue ? mergeNestedFields(firestoreData) : firestoreData;
}

List<Map<String, dynamic>> getSupplementActiveListFirestoreData(
  List<SupplementActiveStruct>? supplementActives,
) =>
    supplementActives
        ?.map((e) => getSupplementActiveFirestoreData(e, true))
        .toList() ??
    [];
