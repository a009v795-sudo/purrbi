// ignore_for_file: unnecessary_getters_setters

import 'package:cloud_firestore/cloud_firestore.dart' hide Type;

import '/backend/schema/util/firestore_util.dart';
import '/backend/schema/util/schema_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

class RecentiModelStruct extends FFFirebaseStruct {
  RecentiModelStruct({
    String? img,
    String? title,
    String? subtext,
    String? date,
    String? barcode,
    String? time,
    String? macth,
    FirestoreUtilData firestoreUtilData = const FirestoreUtilData(),
  })  : _img = img,
        _title = title,
        _subtext = subtext,
        _date = date,
        _barcode = barcode,
        _time = time,
        _macth = macth,
        super(firestoreUtilData);

  // "img" field.
  String? _img;
  String get img => _img ?? '';
  set img(String? val) => _img = val;

  bool hasImg() => _img != null;

  // "title" field.
  String? _title;
  String get title => _title ?? '';
  set title(String? val) => _title = val;

  bool hasTitle() => _title != null;

  // "subtext" field.
  String? _subtext;
  String get subtext => _subtext ?? '';
  set subtext(String? val) => _subtext = val;

  bool hasSubtext() => _subtext != null;

  // "date" field.
  String? _date;
  String get date => _date ?? '';
  set date(String? val) => _date = val;

  bool hasDate() => _date != null;

  // "barcode" field.
  String? _barcode;
  String get barcode => _barcode ?? '';
  set barcode(String? val) => _barcode = val;

  bool hasBarcode() => _barcode != null;

  // "time" field.
  String? _time;
  String get time => _time ?? '';
  set time(String? val) => _time = val;

  bool hasTime() => _time != null;

  // "macth" field.
  String? _macth;
  String get macth => _macth ?? '';
  set macth(String? val) => _macth = val;

  bool hasMacth() => _macth != null;

  static RecentiModelStruct fromMap(Map<String, dynamic> data) =>
      RecentiModelStruct(
        img: data['img'] as String?,
        title: data['title'] as String?,
        subtext: data['subtext'] as String?,
        date: data['date'] as String?,
        barcode: data['barcode'] as String?,
        time: data['time'] as String?,
        macth: data['macth'] as String?,
      );

  static RecentiModelStruct? maybeFromMap(dynamic data) => data is Map
      ? RecentiModelStruct.fromMap(data.cast<String, dynamic>())
      : null;

  Map<String, dynamic> toMap() => {
        'img': _img,
        'title': _title,
        'subtext': _subtext,
        'date': _date,
        'barcode': _barcode,
        'time': _time,
        'macth': _macth,
      }.withoutNulls;

  @override
  Map<String, dynamic> toSerializableMap() => {
        'img': serializeParam(
          _img,
          ParamType.String,
        ),
        'title': serializeParam(
          _title,
          ParamType.String,
        ),
        'subtext': serializeParam(
          _subtext,
          ParamType.String,
        ),
        'date': serializeParam(
          _date,
          ParamType.String,
        ),
        'barcode': serializeParam(
          _barcode,
          ParamType.String,
        ),
        'time': serializeParam(
          _time,
          ParamType.String,
        ),
        'macth': serializeParam(
          _macth,
          ParamType.String,
        ),
      }.withoutNulls;

  static RecentiModelStruct fromSerializableMap(Map<String, dynamic> data) =>
      RecentiModelStruct(
        img: deserializeParam(
          data['img'],
          ParamType.String,
          false,
        ),
        title: deserializeParam(
          data['title'],
          ParamType.String,
          false,
        ),
        subtext: deserializeParam(
          data['subtext'],
          ParamType.String,
          false,
        ),
        date: deserializeParam(
          data['date'],
          ParamType.String,
          false,
        ),
        barcode: deserializeParam(
          data['barcode'],
          ParamType.String,
          false,
        ),
        time: deserializeParam(
          data['time'],
          ParamType.String,
          false,
        ),
        macth: deserializeParam(
          data['macth'],
          ParamType.String,
          false,
        ),
      );

  @override
  String toString() => 'RecentiModelStruct(${toMap()})';

  @override
  bool operator ==(Object other) {
    return other is RecentiModelStruct &&
        img == other.img &&
        title == other.title &&
        subtext == other.subtext &&
        date == other.date &&
        barcode == other.barcode &&
        time == other.time &&
        macth == other.macth;
  }

  @override
  int get hashCode => const ListEquality()
      .hash([img, title, subtext, date, barcode, time, macth]);
}

RecentiModelStruct createRecentiModelStruct({
  String? img,
  String? title,
  String? subtext,
  String? date,
  String? barcode,
  String? time,
  String? macth,
  Map<String, dynamic> fieldValues = const {},
  bool clearUnsetFields = true,
  bool create = false,
  bool delete = false,
}) =>
    RecentiModelStruct(
      img: img,
      title: title,
      subtext: subtext,
      date: date,
      barcode: barcode,
      time: time,
      macth: macth,
      firestoreUtilData: FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
        delete: delete,
        fieldValues: fieldValues,
      ),
    );

RecentiModelStruct? updateRecentiModelStruct(
  RecentiModelStruct? recentiModel, {
  bool clearUnsetFields = true,
  bool create = false,
}) =>
    recentiModel
      ?..firestoreUtilData = FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
      );

void addRecentiModelStructData(
  Map<String, dynamic> firestoreData,
  RecentiModelStruct? recentiModel,
  String fieldName, [
  bool forFieldValue = false,
]) {
  firestoreData.remove(fieldName);
  if (recentiModel == null) {
    return;
  }
  if (recentiModel.firestoreUtilData.delete) {
    firestoreData[fieldName] = FieldValue.delete();
    return;
  }
  final clearFields =
      !forFieldValue && recentiModel.firestoreUtilData.clearUnsetFields;
  if (clearFields) {
    firestoreData[fieldName] = <String, dynamic>{};
  }
  final recentiModelData =
      getRecentiModelFirestoreData(recentiModel, forFieldValue);
  final nestedData =
      recentiModelData.map((k, v) => MapEntry('$fieldName.$k', v));

  final mergeFields = recentiModel.firestoreUtilData.create || clearFields;
  firestoreData
      .addAll(mergeFields ? mergeNestedFields(nestedData) : nestedData);
}

Map<String, dynamic> getRecentiModelFirestoreData(
  RecentiModelStruct? recentiModel, [
  bool forFieldValue = false,
]) {
  if (recentiModel == null) {
    return {};
  }
  final firestoreData = mapToFirestore(recentiModel.toMap());

  // Add any Firestore field values
  mapToFirestore(recentiModel.firestoreUtilData.fieldValues)
      .forEach((k, v) => firestoreData[k] = v);

  return forFieldValue ? mergeNestedFields(firestoreData) : firestoreData;
}

List<Map<String, dynamic>> getRecentiModelListFirestoreData(
  List<RecentiModelStruct>? recentiModels,
) =>
    recentiModels?.map((e) => getRecentiModelFirestoreData(e, true)).toList() ??
    [];
