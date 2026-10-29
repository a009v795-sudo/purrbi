// ignore_for_file: unnecessary_getters_setters

import 'package:cloud_firestore/cloud_firestore.dart' hide Type;

import '/backend/schema/util/firestore_util.dart';
import '/backend/schema/util/schema_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

class ChooseStyleModelStruct extends FFFirebaseStruct {
  ChooseStyleModelStruct({
    String? image,
    String? name,
    FirestoreUtilData firestoreUtilData = const FirestoreUtilData(),
  })  : _image = image,
        _name = name,
        super(firestoreUtilData);

  // "image" field.
  String? _image;
  String get image => _image ?? '';
  set image(String? val) => _image = val;

  bool hasImage() => _image != null;

  // "name" field.
  String? _name;
  String get name => _name ?? '';
  set name(String? val) => _name = val;

  bool hasName() => _name != null;

  static ChooseStyleModelStruct fromMap(Map<String, dynamic> data) =>
      ChooseStyleModelStruct(
        image: data['image'] as String?,
        name: data['name'] as String?,
      );

  static ChooseStyleModelStruct? maybeFromMap(dynamic data) => data is Map
      ? ChooseStyleModelStruct.fromMap(data.cast<String, dynamic>())
      : null;

  Map<String, dynamic> toMap() => {
        'image': _image,
        'name': _name,
      }.withoutNulls;

  @override
  Map<String, dynamic> toSerializableMap() => {
        'image': serializeParam(
          _image,
          ParamType.String,
        ),
        'name': serializeParam(
          _name,
          ParamType.String,
        ),
      }.withoutNulls;

  static ChooseStyleModelStruct fromSerializableMap(
          Map<String, dynamic> data) =>
      ChooseStyleModelStruct(
        image: deserializeParam(
          data['image'],
          ParamType.String,
          false,
        ),
        name: deserializeParam(
          data['name'],
          ParamType.String,
          false,
        ),
      );

  @override
  String toString() => 'ChooseStyleModelStruct(${toMap()})';

  @override
  bool operator ==(Object other) {
    return other is ChooseStyleModelStruct &&
        image == other.image &&
        name == other.name;
  }

  @override
  int get hashCode => const ListEquality().hash([image, name]);
}

ChooseStyleModelStruct createChooseStyleModelStruct({
  String? image,
  String? name,
  Map<String, dynamic> fieldValues = const {},
  bool clearUnsetFields = true,
  bool create = false,
  bool delete = false,
}) =>
    ChooseStyleModelStruct(
      image: image,
      name: name,
      firestoreUtilData: FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
        delete: delete,
        fieldValues: fieldValues,
      ),
    );

ChooseStyleModelStruct? updateChooseStyleModelStruct(
  ChooseStyleModelStruct? chooseStyleModel, {
  bool clearUnsetFields = true,
  bool create = false,
}) =>
    chooseStyleModel
      ?..firestoreUtilData = FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
      );

void addChooseStyleModelStructData(
  Map<String, dynamic> firestoreData,
  ChooseStyleModelStruct? chooseStyleModel,
  String fieldName, [
  bool forFieldValue = false,
]) {
  firestoreData.remove(fieldName);
  if (chooseStyleModel == null) {
    return;
  }
  if (chooseStyleModel.firestoreUtilData.delete) {
    firestoreData[fieldName] = FieldValue.delete();
    return;
  }
  final clearFields =
      !forFieldValue && chooseStyleModel.firestoreUtilData.clearUnsetFields;
  if (clearFields) {
    firestoreData[fieldName] = <String, dynamic>{};
  }
  final chooseStyleModelData =
      getChooseStyleModelFirestoreData(chooseStyleModel, forFieldValue);
  final nestedData =
      chooseStyleModelData.map((k, v) => MapEntry('$fieldName.$k', v));

  final mergeFields = chooseStyleModel.firestoreUtilData.create || clearFields;
  firestoreData
      .addAll(mergeFields ? mergeNestedFields(nestedData) : nestedData);
}

Map<String, dynamic> getChooseStyleModelFirestoreData(
  ChooseStyleModelStruct? chooseStyleModel, [
  bool forFieldValue = false,
]) {
  if (chooseStyleModel == null) {
    return {};
  }
  final firestoreData = mapToFirestore(chooseStyleModel.toMap());

  // Add any Firestore field values
  mapToFirestore(chooseStyleModel.firestoreUtilData.fieldValues)
      .forEach((k, v) => firestoreData[k] = v);

  return forFieldValue ? mergeNestedFields(firestoreData) : firestoreData;
}

List<Map<String, dynamic>> getChooseStyleModelListFirestoreData(
  List<ChooseStyleModelStruct>? chooseStyleModels,
) =>
    chooseStyleModels
        ?.map((e) => getChooseStyleModelFirestoreData(e, true))
        .toList() ??
    [];
