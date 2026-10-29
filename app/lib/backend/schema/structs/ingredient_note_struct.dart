// ignore_for_file: unnecessary_getters_setters

import 'package:cloud_firestore/cloud_firestore.dart' hide Type;

import '/backend/schema/util/firestore_util.dart';
import '/backend/schema/util/schema_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

/// Struct IngredientNote
class IngredientNoteStruct extends FFFirebaseStruct {
  IngredientNoteStruct({
    /// IngredientNote.name
    String? name,

    /// IngredientNote.position
    int? position,

    /// IngredientNote.status
    String? status,

    /// IngredientNote.note
    String? note,

    /// IngredientNote.sourceTitle
    String? sourceTitle,

    /// IngredientNote.sourceUrl
    String? sourceUrl,

    /// IngredientNote.explanationKind
    String? explanationKind,

    /// IngredientNote.explanation
    String? explanation,

    /// IngredientNote.explanationSourceTitle
    String? explanationSourceTitle,

    /// IngredientNote.explanationSourceUrl
    String? explanationSourceUrl,

    /// IngredientNote.explanationQuote
    String? explanationQuote,
    FirestoreUtilData firestoreUtilData = const FirestoreUtilData(),
  })  : _name = name,
        _position = position,
        _status = status,
        _note = note,
        _sourceTitle = sourceTitle,
        _sourceUrl = sourceUrl,
        _explanationKind = explanationKind,
        _explanation = explanation,
        _explanationSourceTitle = explanationSourceTitle,
        _explanationSourceUrl = explanationSourceUrl,
        _explanationQuote = explanationQuote,
        super(firestoreUtilData);

  // "name" field.
  String? _name;
  String get name => _name ?? '';
  set name(String? val) => _name = val;

  bool hasName() => _name != null;

  // "position" field.
  int? _position;
  int get position => _position ?? 0;
  set position(int? val) => _position = val;

  void incrementPosition(int amount) => position = position + amount;

  bool hasPosition() => _position != null;

  // "status" field.
  String? _status;
  String get status => _status ?? '';
  set status(String? val) => _status = val;

  bool hasStatus() => _status != null;

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

  // "explanationKind" field.
  String? _explanationKind;
  String get explanationKind => _explanationKind ?? '';
  set explanationKind(String? val) => _explanationKind = val;

  bool hasExplanationKind() => _explanationKind != null;

  // "explanation" field.
  String? _explanation;
  String get explanation => _explanation ?? '';
  set explanation(String? val) => _explanation = val;

  bool hasExplanation() => _explanation != null;

  // "explanationSourceTitle" field.
  String? _explanationSourceTitle;
  String get explanationSourceTitle => _explanationSourceTitle ?? '';
  set explanationSourceTitle(String? val) => _explanationSourceTitle = val;

  bool hasExplanationSourceTitle() => _explanationSourceTitle != null;

  // "explanationSourceUrl" field.
  String? _explanationSourceUrl;
  String get explanationSourceUrl => _explanationSourceUrl ?? '';
  set explanationSourceUrl(String? val) => _explanationSourceUrl = val;

  bool hasExplanationSourceUrl() => _explanationSourceUrl != null;

  // "explanationQuote" field.
  String? _explanationQuote;
  String get explanationQuote => _explanationQuote ?? '';
  set explanationQuote(String? val) => _explanationQuote = val;

  bool hasExplanationQuote() => _explanationQuote != null;

  static IngredientNoteStruct fromMap(Map<String, dynamic> data) =>
      IngredientNoteStruct(
        name: data['name'] as String?,
        position: castToType<int>(data['position']),
        status: data['status'] as String?,
        note: data['note'] as String?,
        sourceTitle: data['sourceTitle'] as String?,
        sourceUrl: data['sourceUrl'] as String?,
        explanationKind: data['explanationKind'] as String?,
        explanation: data['explanation'] as String?,
        explanationSourceTitle: data['explanationSourceTitle'] as String?,
        explanationSourceUrl: data['explanationSourceUrl'] as String?,
        explanationQuote: data['explanationQuote'] as String?,
      );

  static IngredientNoteStruct? maybeFromMap(dynamic data) => data is Map
      ? IngredientNoteStruct.fromMap(data.cast<String, dynamic>())
      : null;

  Map<String, dynamic> toMap() => {
        'name': _name,
        'position': _position,
        'status': _status,
        'note': _note,
        'sourceTitle': _sourceTitle,
        'sourceUrl': _sourceUrl,
        'explanationKind': _explanationKind,
        'explanation': _explanation,
        'explanationSourceTitle': _explanationSourceTitle,
        'explanationSourceUrl': _explanationSourceUrl,
        'explanationQuote': _explanationQuote,
      }.withoutNulls;

  @override
  Map<String, dynamic> toSerializableMap() => {
        'name': serializeParam(
          _name,
          ParamType.String,
        ),
        'position': serializeParam(
          _position,
          ParamType.int,
        ),
        'status': serializeParam(
          _status,
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
        'explanationKind': serializeParam(
          _explanationKind,
          ParamType.String,
        ),
        'explanation': serializeParam(
          _explanation,
          ParamType.String,
        ),
        'explanationSourceTitle': serializeParam(
          _explanationSourceTitle,
          ParamType.String,
        ),
        'explanationSourceUrl': serializeParam(
          _explanationSourceUrl,
          ParamType.String,
        ),
        'explanationQuote': serializeParam(
          _explanationQuote,
          ParamType.String,
        ),
      }.withoutNulls;

  static IngredientNoteStruct fromSerializableMap(Map<String, dynamic> data) =>
      IngredientNoteStruct(
        name: deserializeParam(
          data['name'],
          ParamType.String,
          false,
        ),
        position: deserializeParam(
          data['position'],
          ParamType.int,
          false,
        ),
        status: deserializeParam(
          data['status'],
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
        explanationKind: deserializeParam(
          data['explanationKind'],
          ParamType.String,
          false,
        ),
        explanation: deserializeParam(
          data['explanation'],
          ParamType.String,
          false,
        ),
        explanationSourceTitle: deserializeParam(
          data['explanationSourceTitle'],
          ParamType.String,
          false,
        ),
        explanationSourceUrl: deserializeParam(
          data['explanationSourceUrl'],
          ParamType.String,
          false,
        ),
        explanationQuote: deserializeParam(
          data['explanationQuote'],
          ParamType.String,
          false,
        ),
      );

  @override
  String toString() => 'IngredientNoteStruct(${toMap()})';

  @override
  bool operator ==(Object other) {
    return other is IngredientNoteStruct &&
        name == other.name &&
        position == other.position &&
        status == other.status &&
        note == other.note &&
        sourceTitle == other.sourceTitle &&
        sourceUrl == other.sourceUrl &&
        explanationKind == other.explanationKind &&
        explanation == other.explanation &&
        explanationSourceTitle == other.explanationSourceTitle &&
        explanationSourceUrl == other.explanationSourceUrl &&
        explanationQuote == other.explanationQuote;
  }

  @override
  int get hashCode => const ListEquality().hash([
        name,
        position,
        status,
        note,
        sourceTitle,
        sourceUrl,
        explanationKind,
        explanation,
        explanationSourceTitle,
        explanationSourceUrl,
        explanationQuote
      ]);
}

IngredientNoteStruct createIngredientNoteStruct({
  String? name,
  int? position,
  String? status,
  String? note,
  String? sourceTitle,
  String? sourceUrl,
  String? explanationKind,
  String? explanation,
  String? explanationSourceTitle,
  String? explanationSourceUrl,
  String? explanationQuote,
  Map<String, dynamic> fieldValues = const {},
  bool clearUnsetFields = true,
  bool create = false,
  bool delete = false,
}) =>
    IngredientNoteStruct(
      name: name,
      position: position,
      status: status,
      note: note,
      sourceTitle: sourceTitle,
      sourceUrl: sourceUrl,
      explanationKind: explanationKind,
      explanation: explanation,
      explanationSourceTitle: explanationSourceTitle,
      explanationSourceUrl: explanationSourceUrl,
      explanationQuote: explanationQuote,
      firestoreUtilData: FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
        delete: delete,
        fieldValues: fieldValues,
      ),
    );

IngredientNoteStruct? updateIngredientNoteStruct(
  IngredientNoteStruct? ingredientNote, {
  bool clearUnsetFields = true,
  bool create = false,
}) =>
    ingredientNote
      ?..firestoreUtilData = FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
      );

void addIngredientNoteStructData(
  Map<String, dynamic> firestoreData,
  IngredientNoteStruct? ingredientNote,
  String fieldName, [
  bool forFieldValue = false,
]) {
  firestoreData.remove(fieldName);
  if (ingredientNote == null) {
    return;
  }
  if (ingredientNote.firestoreUtilData.delete) {
    firestoreData[fieldName] = FieldValue.delete();
    return;
  }
  final clearFields =
      !forFieldValue && ingredientNote.firestoreUtilData.clearUnsetFields;
  if (clearFields) {
    firestoreData[fieldName] = <String, dynamic>{};
  }
  final ingredientNoteData =
      getIngredientNoteFirestoreData(ingredientNote, forFieldValue);
  final nestedData =
      ingredientNoteData.map((k, v) => MapEntry('$fieldName.$k', v));

  final mergeFields = ingredientNote.firestoreUtilData.create || clearFields;
  firestoreData
      .addAll(mergeFields ? mergeNestedFields(nestedData) : nestedData);
}

Map<String, dynamic> getIngredientNoteFirestoreData(
  IngredientNoteStruct? ingredientNote, [
  bool forFieldValue = false,
]) {
  if (ingredientNote == null) {
    return {};
  }
  final firestoreData = mapToFirestore(ingredientNote.toMap());

  // Add any Firestore field values
  mapToFirestore(ingredientNote.firestoreUtilData.fieldValues)
      .forEach((k, v) => firestoreData[k] = v);

  return forFieldValue ? mergeNestedFields(firestoreData) : firestoreData;
}

List<Map<String, dynamic>> getIngredientNoteListFirestoreData(
  List<IngredientNoteStruct>? ingredientNotes,
) =>
    ingredientNotes
        ?.map((e) => getIngredientNoteFirestoreData(e, true))
        .toList() ??
    [];
