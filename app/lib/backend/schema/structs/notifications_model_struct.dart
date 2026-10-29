// ignore_for_file: unnecessary_getters_setters

import 'package:cloud_firestore/cloud_firestore.dart' hide Type;

import '/backend/schema/util/firestore_util.dart';
import '/backend/schema/util/schema_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

class NotificationsModelStruct extends FFFirebaseStruct {
  NotificationsModelStruct({
    String? title,
    String? subTitle,
    String? createAt,
    FirestoreUtilData firestoreUtilData = const FirestoreUtilData(),
  })  : _title = title,
        _subTitle = subTitle,
        _createAt = createAt,
        super(firestoreUtilData);

  // "title" field.
  String? _title;
  String get title => _title ?? '';
  set title(String? val) => _title = val;

  bool hasTitle() => _title != null;

  // "subTitle" field.
  String? _subTitle;
  String get subTitle => _subTitle ?? '';
  set subTitle(String? val) => _subTitle = val;

  bool hasSubTitle() => _subTitle != null;

  // "createAt" field.
  String? _createAt;
  String get createAt => _createAt ?? '';
  set createAt(String? val) => _createAt = val;

  bool hasCreateAt() => _createAt != null;

  static NotificationsModelStruct fromMap(Map<String, dynamic> data) =>
      NotificationsModelStruct(
        title: data['title'] as String?,
        subTitle: data['subTitle'] as String?,
        createAt: data['createAt'] as String?,
      );

  static NotificationsModelStruct? maybeFromMap(dynamic data) => data is Map
      ? NotificationsModelStruct.fromMap(data.cast<String, dynamic>())
      : null;

  Map<String, dynamic> toMap() => {
        'title': _title,
        'subTitle': _subTitle,
        'createAt': _createAt,
      }.withoutNulls;

  @override
  Map<String, dynamic> toSerializableMap() => {
        'title': serializeParam(
          _title,
          ParamType.String,
        ),
        'subTitle': serializeParam(
          _subTitle,
          ParamType.String,
        ),
        'createAt': serializeParam(
          _createAt,
          ParamType.String,
        ),
      }.withoutNulls;

  static NotificationsModelStruct fromSerializableMap(
          Map<String, dynamic> data) =>
      NotificationsModelStruct(
        title: deserializeParam(
          data['title'],
          ParamType.String,
          false,
        ),
        subTitle: deserializeParam(
          data['subTitle'],
          ParamType.String,
          false,
        ),
        createAt: deserializeParam(
          data['createAt'],
          ParamType.String,
          false,
        ),
      );

  @override
  String toString() => 'NotificationsModelStruct(${toMap()})';

  @override
  bool operator ==(Object other) {
    return other is NotificationsModelStruct &&
        title == other.title &&
        subTitle == other.subTitle &&
        createAt == other.createAt;
  }

  @override
  int get hashCode => const ListEquality().hash([title, subTitle, createAt]);
}

NotificationsModelStruct createNotificationsModelStruct({
  String? title,
  String? subTitle,
  String? createAt,
  Map<String, dynamic> fieldValues = const {},
  bool clearUnsetFields = true,
  bool create = false,
  bool delete = false,
}) =>
    NotificationsModelStruct(
      title: title,
      subTitle: subTitle,
      createAt: createAt,
      firestoreUtilData: FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
        delete: delete,
        fieldValues: fieldValues,
      ),
    );

NotificationsModelStruct? updateNotificationsModelStruct(
  NotificationsModelStruct? notificationsModel, {
  bool clearUnsetFields = true,
  bool create = false,
}) =>
    notificationsModel
      ?..firestoreUtilData = FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
      );

void addNotificationsModelStructData(
  Map<String, dynamic> firestoreData,
  NotificationsModelStruct? notificationsModel,
  String fieldName, [
  bool forFieldValue = false,
]) {
  firestoreData.remove(fieldName);
  if (notificationsModel == null) {
    return;
  }
  if (notificationsModel.firestoreUtilData.delete) {
    firestoreData[fieldName] = FieldValue.delete();
    return;
  }
  final clearFields =
      !forFieldValue && notificationsModel.firestoreUtilData.clearUnsetFields;
  if (clearFields) {
    firestoreData[fieldName] = <String, dynamic>{};
  }
  final notificationsModelData =
      getNotificationsModelFirestoreData(notificationsModel, forFieldValue);
  final nestedData =
      notificationsModelData.map((k, v) => MapEntry('$fieldName.$k', v));

  final mergeFields =
      notificationsModel.firestoreUtilData.create || clearFields;
  firestoreData
      .addAll(mergeFields ? mergeNestedFields(nestedData) : nestedData);
}

Map<String, dynamic> getNotificationsModelFirestoreData(
  NotificationsModelStruct? notificationsModel, [
  bool forFieldValue = false,
]) {
  if (notificationsModel == null) {
    return {};
  }
  final firestoreData = mapToFirestore(notificationsModel.toMap());

  // Add any Firestore field values
  mapToFirestore(notificationsModel.firestoreUtilData.fieldValues)
      .forEach((k, v) => firestoreData[k] = v);

  return forFieldValue ? mergeNestedFields(firestoreData) : firestoreData;
}

List<Map<String, dynamic>> getNotificationsModelListFirestoreData(
  List<NotificationsModelStruct>? notificationsModels,
) =>
    notificationsModels
        ?.map((e) => getNotificationsModelFirestoreData(e, true))
        .toList() ??
    [];
