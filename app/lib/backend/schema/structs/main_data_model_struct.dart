// ignore_for_file: unnecessary_getters_setters

import 'package:cloud_firestore/cloud_firestore.dart' hide Type;

import '/backend/schema/util/firestore_util.dart';
import '/backend/schema/util/schema_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

class MainDataModelStruct extends FFFirebaseStruct {
  MainDataModelStruct({
    int? id,
    String? image,
    String? name,
    List<String>? categorieName,
    bool? popularfootprint,
    bool? trendingnow,
    String? subName,
    String? barcode,
    String? date,
    String? time,
    FirestoreUtilData firestoreUtilData = const FirestoreUtilData(),
  })  : _id = id,
        _image = image,
        _name = name,
        _categorieName = categorieName,
        _popularfootprint = popularfootprint,
        _trendingnow = trendingnow,
        _subName = subName,
        _barcode = barcode,
        _date = date,
        _time = time,
        super(firestoreUtilData);

  // "id" field.
  int? _id;
  int get id => _id ?? 0;
  set id(int? val) => _id = val;

  void incrementId(int amount) => id = id + amount;

  bool hasId() => _id != null;

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

  // "categorieName" field.
  List<String>? _categorieName;
  List<String> get categorieName => _categorieName ?? const [];
  set categorieName(List<String>? val) => _categorieName = val;

  void updateCategorieName(Function(List<String>) updateFn) {
    updateFn(_categorieName ??= []);
  }

  bool hasCategorieName() => _categorieName != null;

  // "Popularfootprint" field.
  bool? _popularfootprint;
  bool get popularfootprint => _popularfootprint ?? false;
  set popularfootprint(bool? val) => _popularfootprint = val;

  bool hasPopularfootprint() => _popularfootprint != null;

  // "Trendingnow" field.
  bool? _trendingnow;
  bool get trendingnow => _trendingnow ?? false;
  set trendingnow(bool? val) => _trendingnow = val;

  bool hasTrendingnow() => _trendingnow != null;

  // "subName" field.
  String? _subName;
  String get subName => _subName ?? '';
  set subName(String? val) => _subName = val;

  bool hasSubName() => _subName != null;

  // "Barcode" field.
  String? _barcode;
  String get barcode => _barcode ?? '';
  set barcode(String? val) => _barcode = val;

  bool hasBarcode() => _barcode != null;

  // "date" field.
  String? _date;
  String get date => _date ?? '';
  set date(String? val) => _date = val;

  bool hasDate() => _date != null;

  // "time" field.
  String? _time;
  String get time => _time ?? '';
  set time(String? val) => _time = val;

  bool hasTime() => _time != null;

  static MainDataModelStruct fromMap(Map<String, dynamic> data) =>
      MainDataModelStruct(
        id: castToType<int>(data['id']),
        image: data['image'] as String?,
        name: data['name'] as String?,
        categorieName: getDataList(data['categorieName']),
        popularfootprint: data['Popularfootprint'] as bool?,
        trendingnow: data['Trendingnow'] as bool?,
        subName: data['subName'] as String?,
        barcode: data['Barcode'] as String?,
        date: data['date'] as String?,
        time: data['time'] as String?,
      );

  static MainDataModelStruct? maybeFromMap(dynamic data) => data is Map
      ? MainDataModelStruct.fromMap(data.cast<String, dynamic>())
      : null;

  Map<String, dynamic> toMap() => {
        'id': _id,
        'image': _image,
        'name': _name,
        'categorieName': _categorieName,
        'Popularfootprint': _popularfootprint,
        'Trendingnow': _trendingnow,
        'subName': _subName,
        'Barcode': _barcode,
        'date': _date,
        'time': _time,
      }.withoutNulls;

  @override
  Map<String, dynamic> toSerializableMap() => {
        'id': serializeParam(
          _id,
          ParamType.int,
        ),
        'image': serializeParam(
          _image,
          ParamType.String,
        ),
        'name': serializeParam(
          _name,
          ParamType.String,
        ),
        'categorieName': serializeParam(
          _categorieName,
          ParamType.String,
          isList: true,
        ),
        'Popularfootprint': serializeParam(
          _popularfootprint,
          ParamType.bool,
        ),
        'Trendingnow': serializeParam(
          _trendingnow,
          ParamType.bool,
        ),
        'subName': serializeParam(
          _subName,
          ParamType.String,
        ),
        'Barcode': serializeParam(
          _barcode,
          ParamType.String,
        ),
        'date': serializeParam(
          _date,
          ParamType.String,
        ),
        'time': serializeParam(
          _time,
          ParamType.String,
        ),
      }.withoutNulls;

  static MainDataModelStruct fromSerializableMap(Map<String, dynamic> data) =>
      MainDataModelStruct(
        id: deserializeParam(
          data['id'],
          ParamType.int,
          false,
        ),
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
        categorieName: deserializeParam<String>(
          data['categorieName'],
          ParamType.String,
          true,
        ),
        popularfootprint: deserializeParam(
          data['Popularfootprint'],
          ParamType.bool,
          false,
        ),
        trendingnow: deserializeParam(
          data['Trendingnow'],
          ParamType.bool,
          false,
        ),
        subName: deserializeParam(
          data['subName'],
          ParamType.String,
          false,
        ),
        barcode: deserializeParam(
          data['Barcode'],
          ParamType.String,
          false,
        ),
        date: deserializeParam(
          data['date'],
          ParamType.String,
          false,
        ),
        time: deserializeParam(
          data['time'],
          ParamType.String,
          false,
        ),
      );

  @override
  String toString() => 'MainDataModelStruct(${toMap()})';

  @override
  bool operator ==(Object other) {
    const listEquality = ListEquality();
    return other is MainDataModelStruct &&
        id == other.id &&
        image == other.image &&
        name == other.name &&
        listEquality.equals(categorieName, other.categorieName) &&
        popularfootprint == other.popularfootprint &&
        trendingnow == other.trendingnow &&
        subName == other.subName &&
        barcode == other.barcode &&
        date == other.date &&
        time == other.time;
  }

  @override
  int get hashCode => const ListEquality().hash([
        id,
        image,
        name,
        const ListEquality().hash(categorieName),
        popularfootprint,
        trendingnow,
        subName,
        barcode,
        date,
        time
      ]);
}

MainDataModelStruct createMainDataModelStruct({
  int? id,
  String? image,
  String? name,
  bool? popularfootprint,
  bool? trendingnow,
  String? subName,
  String? barcode,
  String? date,
  String? time,
  Map<String, dynamic> fieldValues = const {},
  bool clearUnsetFields = true,
  bool create = false,
  bool delete = false,
}) =>
    MainDataModelStruct(
      id: id,
      image: image,
      name: name,
      popularfootprint: popularfootprint,
      trendingnow: trendingnow,
      subName: subName,
      barcode: barcode,
      date: date,
      time: time,
      firestoreUtilData: FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
        delete: delete,
        fieldValues: fieldValues,
      ),
    );

MainDataModelStruct? updateMainDataModelStruct(
  MainDataModelStruct? mainDataModel, {
  bool clearUnsetFields = true,
  bool create = false,
}) =>
    mainDataModel
      ?..firestoreUtilData = FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
      );

void addMainDataModelStructData(
  Map<String, dynamic> firestoreData,
  MainDataModelStruct? mainDataModel,
  String fieldName, [
  bool forFieldValue = false,
]) {
  firestoreData.remove(fieldName);
  if (mainDataModel == null) {
    return;
  }
  if (mainDataModel.firestoreUtilData.delete) {
    firestoreData[fieldName] = FieldValue.delete();
    return;
  }
  final clearFields =
      !forFieldValue && mainDataModel.firestoreUtilData.clearUnsetFields;
  if (clearFields) {
    firestoreData[fieldName] = <String, dynamic>{};
  }
  final mainDataModelData =
      getMainDataModelFirestoreData(mainDataModel, forFieldValue);
  final nestedData =
      mainDataModelData.map((k, v) => MapEntry('$fieldName.$k', v));

  final mergeFields = mainDataModel.firestoreUtilData.create || clearFields;
  firestoreData
      .addAll(mergeFields ? mergeNestedFields(nestedData) : nestedData);
}

Map<String, dynamic> getMainDataModelFirestoreData(
  MainDataModelStruct? mainDataModel, [
  bool forFieldValue = false,
]) {
  if (mainDataModel == null) {
    return {};
  }
  final firestoreData = mapToFirestore(mainDataModel.toMap());

  // Add any Firestore field values
  mapToFirestore(mainDataModel.firestoreUtilData.fieldValues)
      .forEach((k, v) => firestoreData[k] = v);

  return forFieldValue ? mergeNestedFields(firestoreData) : firestoreData;
}

List<Map<String, dynamic>> getMainDataModelListFirestoreData(
  List<MainDataModelStruct>? mainDataModels,
) =>
    mainDataModels
        ?.map((e) => getMainDataModelFirestoreData(e, true))
        .toList() ??
    [];
