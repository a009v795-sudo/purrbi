// ignore_for_file: unnecessary_getters_setters

import 'package:cloud_firestore/cloud_firestore.dart' hide Type;

import '/backend/schema/util/firestore_util.dart';
import '/backend/schema/util/schema_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

class CategorieModelStruct extends FFFirebaseStruct {
  CategorieModelStruct({
    String? name,
    String? img,
    FirestoreUtilData firestoreUtilData = const FirestoreUtilData(),
  })  : _name = name,
        _img = img,
        super(firestoreUtilData);

  // "name" field.
  String? _name;
  String get name => _name ?? '';
  set name(String? val) => _name = val;

  bool hasName() => _name != null;

  // "img" field.
  String? _img;
  String get img => _img ?? '';
  set img(String? val) => _img = val;

  bool hasImg() => _img != null;

  static CategorieModelStruct fromMap(Map<String, dynamic> data) =>
      CategorieModelStruct(
        name: data['name'] as String?,
        img: data['img'] as String?,
      );

  static CategorieModelStruct? maybeFromMap(dynamic data) => data is Map
      ? CategorieModelStruct.fromMap(data.cast<String, dynamic>())
      : null;

  Map<String, dynamic> toMap() => {
        'name': _name,
        'img': _img,
      }.withoutNulls;

  @override
  Map<String, dynamic> toSerializableMap() => {
        'name': serializeParam(
          _name,
          ParamType.String,
        ),
        'img': serializeParam(
          _img,
          ParamType.String,
        ),
      }.withoutNulls;

  static CategorieModelStruct fromSerializableMap(Map<String, dynamic> data) =>
      CategorieModelStruct(
        name: deserializeParam(
          data['name'],
          ParamType.String,
          false,
        ),
        img: deserializeParam(
          data['img'],
          ParamType.String,
          false,
        ),
      );

  @override
  String toString() => 'CategorieModelStruct(${toMap()})';

  @override
  bool operator ==(Object other) {
    return other is CategorieModelStruct &&
        name == other.name &&
        img == other.img;
  }

  @override
  int get hashCode => const ListEquality().hash([name, img]);
}

CategorieModelStruct createCategorieModelStruct({
  String? name,
  String? img,
  Map<String, dynamic> fieldValues = const {},
  bool clearUnsetFields = true,
  bool create = false,
  bool delete = false,
}) =>
    CategorieModelStruct(
      name: name,
      img: img,
      firestoreUtilData: FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
        delete: delete,
        fieldValues: fieldValues,
      ),
    );

CategorieModelStruct? updateCategorieModelStruct(
  CategorieModelStruct? categorieModel, {
  bool clearUnsetFields = true,
  bool create = false,
}) =>
    categorieModel
      ?..firestoreUtilData = FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
      );

void addCategorieModelStructData(
  Map<String, dynamic> firestoreData,
  CategorieModelStruct? categorieModel,
  String fieldName, [
  bool forFieldValue = false,
]) {
  firestoreData.remove(fieldName);
  if (categorieModel == null) {
    return;
  }
  if (categorieModel.firestoreUtilData.delete) {
    firestoreData[fieldName] = FieldValue.delete();
    return;
  }
  final clearFields =
      !forFieldValue && categorieModel.firestoreUtilData.clearUnsetFields;
  if (clearFields) {
    firestoreData[fieldName] = <String, dynamic>{};
  }
  final categorieModelData =
      getCategorieModelFirestoreData(categorieModel, forFieldValue);
  final nestedData =
      categorieModelData.map((k, v) => MapEntry('$fieldName.$k', v));

  final mergeFields = categorieModel.firestoreUtilData.create || clearFields;
  firestoreData
      .addAll(mergeFields ? mergeNestedFields(nestedData) : nestedData);
}

Map<String, dynamic> getCategorieModelFirestoreData(
  CategorieModelStruct? categorieModel, [
  bool forFieldValue = false,
]) {
  if (categorieModel == null) {
    return {};
  }
  final firestoreData = mapToFirestore(categorieModel.toMap());

  // Add any Firestore field values
  mapToFirestore(categorieModel.firestoreUtilData.fieldValues)
      .forEach((k, v) => firestoreData[k] = v);

  return forFieldValue ? mergeNestedFields(firestoreData) : firestoreData;
}

List<Map<String, dynamic>> getCategorieModelListFirestoreData(
  List<CategorieModelStruct>? categorieModels,
) =>
    categorieModels
        ?.map((e) => getCategorieModelFirestoreData(e, true))
        .toList() ??
    [];
