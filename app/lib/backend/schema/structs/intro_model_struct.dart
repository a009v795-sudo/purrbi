// ignore_for_file: unnecessary_getters_setters

import 'package:cloud_firestore/cloud_firestore.dart' hide Type;

import '/backend/schema/util/firestore_util.dart';
import '/backend/schema/util/schema_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

class IntroModelStruct extends FFFirebaseStruct {
  IntroModelStruct({
    String? image,
    String? darkImage,
    String? title,
    String? title2,
    String? subTitle,
    FirestoreUtilData firestoreUtilData = const FirestoreUtilData(),
  })  : _image = image,
        _darkImage = darkImage,
        _title = title,
        _title2 = title2,
        _subTitle = subTitle,
        super(firestoreUtilData);

  // "image" field.
  String? _image;
  String get image => _image ?? '';
  set image(String? val) => _image = val;

  bool hasImage() => _image != null;

  // "darkImage" field.
  String? _darkImage;
  String get darkImage => _darkImage ?? '';
  set darkImage(String? val) => _darkImage = val;

  bool hasDarkImage() => _darkImage != null;

  // "title" field.
  String? _title;
  String get title => _title ?? '';
  set title(String? val) => _title = val;

  bool hasTitle() => _title != null;

  // "title2" field.
  String? _title2;
  String get title2 => _title2 ?? '';
  set title2(String? val) => _title2 = val;

  bool hasTitle2() => _title2 != null;

  // "subTitle" field.
  String? _subTitle;
  String get subTitle => _subTitle ?? '';
  set subTitle(String? val) => _subTitle = val;

  bool hasSubTitle() => _subTitle != null;

  static IntroModelStruct fromMap(Map<String, dynamic> data) =>
      IntroModelStruct(
        image: data['image'] as String?,
        darkImage: data['darkImage'] as String?,
        title: data['title'] as String?,
        title2: data['title2'] as String?,
        subTitle: data['subTitle'] as String?,
      );

  static IntroModelStruct? maybeFromMap(dynamic data) => data is Map
      ? IntroModelStruct.fromMap(data.cast<String, dynamic>())
      : null;

  Map<String, dynamic> toMap() => {
        'image': _image,
        'darkImage': _darkImage,
        'title': _title,
        'title2': _title2,
        'subTitle': _subTitle,
      }.withoutNulls;

  @override
  Map<String, dynamic> toSerializableMap() => {
        'image': serializeParam(
          _image,
          ParamType.String,
        ),
        'darkImage': serializeParam(
          _darkImage,
          ParamType.String,
        ),
        'title': serializeParam(
          _title,
          ParamType.String,
        ),
        'title2': serializeParam(
          _title2,
          ParamType.String,
        ),
        'subTitle': serializeParam(
          _subTitle,
          ParamType.String,
        ),
      }.withoutNulls;

  static IntroModelStruct fromSerializableMap(Map<String, dynamic> data) =>
      IntroModelStruct(
        image: deserializeParam(
          data['image'],
          ParamType.String,
          false,
        ),
        darkImage: deserializeParam(
          data['darkImage'],
          ParamType.String,
          false,
        ),
        title: deserializeParam(
          data['title'],
          ParamType.String,
          false,
        ),
        title2: deserializeParam(
          data['title2'],
          ParamType.String,
          false,
        ),
        subTitle: deserializeParam(
          data['subTitle'],
          ParamType.String,
          false,
        ),
      );

  @override
  String toString() => 'IntroModelStruct(${toMap()})';

  @override
  bool operator ==(Object other) {
    return other is IntroModelStruct &&
        image == other.image &&
        darkImage == other.darkImage &&
        title == other.title &&
        title2 == other.title2 &&
        subTitle == other.subTitle;
  }

  @override
  int get hashCode =>
      const ListEquality().hash([image, darkImage, title, title2, subTitle]);
}

IntroModelStruct createIntroModelStruct({
  String? image,
  String? darkImage,
  String? title,
  String? title2,
  String? subTitle,
  Map<String, dynamic> fieldValues = const {},
  bool clearUnsetFields = true,
  bool create = false,
  bool delete = false,
}) =>
    IntroModelStruct(
      image: image,
      darkImage: darkImage,
      title: title,
      title2: title2,
      subTitle: subTitle,
      firestoreUtilData: FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
        delete: delete,
        fieldValues: fieldValues,
      ),
    );

IntroModelStruct? updateIntroModelStruct(
  IntroModelStruct? introModel, {
  bool clearUnsetFields = true,
  bool create = false,
}) =>
    introModel
      ?..firestoreUtilData = FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
      );

void addIntroModelStructData(
  Map<String, dynamic> firestoreData,
  IntroModelStruct? introModel,
  String fieldName, [
  bool forFieldValue = false,
]) {
  firestoreData.remove(fieldName);
  if (introModel == null) {
    return;
  }
  if (introModel.firestoreUtilData.delete) {
    firestoreData[fieldName] = FieldValue.delete();
    return;
  }
  final clearFields =
      !forFieldValue && introModel.firestoreUtilData.clearUnsetFields;
  if (clearFields) {
    firestoreData[fieldName] = <String, dynamic>{};
  }
  final introModelData = getIntroModelFirestoreData(introModel, forFieldValue);
  final nestedData = introModelData.map((k, v) => MapEntry('$fieldName.$k', v));

  final mergeFields = introModel.firestoreUtilData.create || clearFields;
  firestoreData
      .addAll(mergeFields ? mergeNestedFields(nestedData) : nestedData);
}

Map<String, dynamic> getIntroModelFirestoreData(
  IntroModelStruct? introModel, [
  bool forFieldValue = false,
]) {
  if (introModel == null) {
    return {};
  }
  final firestoreData = mapToFirestore(introModel.toMap());

  // Add any Firestore field values
  mapToFirestore(introModel.firestoreUtilData.fieldValues)
      .forEach((k, v) => firestoreData[k] = v);

  return forFieldValue ? mergeNestedFields(firestoreData) : firestoreData;
}

List<Map<String, dynamic>> getIntroModelListFirestoreData(
  List<IntroModelStruct>? introModels,
) =>
    introModels?.map((e) => getIntroModelFirestoreData(e, true)).toList() ?? [];
