// ignore_for_file: unnecessary_getters_setters

import 'package:cloud_firestore/cloud_firestore.dart' hide Type;

import '/backend/schema/util/firestore_util.dart';
import '/backend/schema/util/schema_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

class HelpSupportModelStruct extends FFFirebaseStruct {
  HelpSupportModelStruct({
    String? title,
    String? description,
    FirestoreUtilData firestoreUtilData = const FirestoreUtilData(),
  })  : _title = title,
        _description = description,
        super(firestoreUtilData);

  // "title" field.
  String? _title;
  String get title => _title ?? '';
  set title(String? val) => _title = val;

  bool hasTitle() => _title != null;

  // "description" field.
  String? _description;
  String get description => _description ?? '';
  set description(String? val) => _description = val;

  bool hasDescription() => _description != null;

  static HelpSupportModelStruct fromMap(Map<String, dynamic> data) =>
      HelpSupportModelStruct(
        title: data['title'] as String?,
        description: data['description'] as String?,
      );

  static HelpSupportModelStruct? maybeFromMap(dynamic data) => data is Map
      ? HelpSupportModelStruct.fromMap(data.cast<String, dynamic>())
      : null;

  Map<String, dynamic> toMap() => {
        'title': _title,
        'description': _description,
      }.withoutNulls;

  @override
  Map<String, dynamic> toSerializableMap() => {
        'title': serializeParam(
          _title,
          ParamType.String,
        ),
        'description': serializeParam(
          _description,
          ParamType.String,
        ),
      }.withoutNulls;

  static HelpSupportModelStruct fromSerializableMap(
          Map<String, dynamic> data) =>
      HelpSupportModelStruct(
        title: deserializeParam(
          data['title'],
          ParamType.String,
          false,
        ),
        description: deserializeParam(
          data['description'],
          ParamType.String,
          false,
        ),
      );

  @override
  String toString() => 'HelpSupportModelStruct(${toMap()})';

  @override
  bool operator ==(Object other) {
    return other is HelpSupportModelStruct &&
        title == other.title &&
        description == other.description;
  }

  @override
  int get hashCode => const ListEquality().hash([title, description]);
}

HelpSupportModelStruct createHelpSupportModelStruct({
  String? title,
  String? description,
  Map<String, dynamic> fieldValues = const {},
  bool clearUnsetFields = true,
  bool create = false,
  bool delete = false,
}) =>
    HelpSupportModelStruct(
      title: title,
      description: description,
      firestoreUtilData: FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
        delete: delete,
        fieldValues: fieldValues,
      ),
    );

HelpSupportModelStruct? updateHelpSupportModelStruct(
  HelpSupportModelStruct? helpSupportModel, {
  bool clearUnsetFields = true,
  bool create = false,
}) =>
    helpSupportModel
      ?..firestoreUtilData = FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
      );

void addHelpSupportModelStructData(
  Map<String, dynamic> firestoreData,
  HelpSupportModelStruct? helpSupportModel,
  String fieldName, [
  bool forFieldValue = false,
]) {
  firestoreData.remove(fieldName);
  if (helpSupportModel == null) {
    return;
  }
  if (helpSupportModel.firestoreUtilData.delete) {
    firestoreData[fieldName] = FieldValue.delete();
    return;
  }
  final clearFields =
      !forFieldValue && helpSupportModel.firestoreUtilData.clearUnsetFields;
  if (clearFields) {
    firestoreData[fieldName] = <String, dynamic>{};
  }
  final helpSupportModelData =
      getHelpSupportModelFirestoreData(helpSupportModel, forFieldValue);
  final nestedData =
      helpSupportModelData.map((k, v) => MapEntry('$fieldName.$k', v));

  final mergeFields = helpSupportModel.firestoreUtilData.create || clearFields;
  firestoreData
      .addAll(mergeFields ? mergeNestedFields(nestedData) : nestedData);
}

Map<String, dynamic> getHelpSupportModelFirestoreData(
  HelpSupportModelStruct? helpSupportModel, [
  bool forFieldValue = false,
]) {
  if (helpSupportModel == null) {
    return {};
  }
  final firestoreData = mapToFirestore(helpSupportModel.toMap());

  // Add any Firestore field values
  mapToFirestore(helpSupportModel.firestoreUtilData.fieldValues)
      .forEach((k, v) => firestoreData[k] = v);

  return forFieldValue ? mergeNestedFields(firestoreData) : firestoreData;
}

List<Map<String, dynamic>> getHelpSupportModelListFirestoreData(
  List<HelpSupportModelStruct>? helpSupportModels,
) =>
    helpSupportModels
        ?.map((e) => getHelpSupportModelFirestoreData(e, true))
        .toList() ??
    [];
