// ignore_for_file: unnecessary_getters_setters

import 'package:cloud_firestore/cloud_firestore.dart' hide Type;

import '/backend/schema/util/firestore_util.dart';
import '/backend/schema/util/schema_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

/// Struct PhotoRequest
class PhotoRequestStruct extends FFFirebaseStruct {
  PhotoRequestStruct({
    /// PhotoRequest.purpose
    String? purpose,

    /// PhotoRequest.title
    String? title,

    /// PhotoRequest.reason
    String? reason,
    FirestoreUtilData firestoreUtilData = const FirestoreUtilData(),
  })  : _purpose = purpose,
        _title = title,
        _reason = reason,
        super(firestoreUtilData);

  // "purpose" field.
  String? _purpose;
  String get purpose => _purpose ?? '';
  set purpose(String? val) => _purpose = val;

  bool hasPurpose() => _purpose != null;

  // "title" field.
  String? _title;
  String get title => _title ?? '';
  set title(String? val) => _title = val;

  bool hasTitle() => _title != null;

  // "reason" field.
  String? _reason;
  String get reason => _reason ?? '';
  set reason(String? val) => _reason = val;

  bool hasReason() => _reason != null;

  static PhotoRequestStruct fromMap(Map<String, dynamic> data) =>
      PhotoRequestStruct(
        purpose: data['purpose'] as String?,
        title: data['title'] as String?,
        reason: data['reason'] as String?,
      );

  static PhotoRequestStruct? maybeFromMap(dynamic data) => data is Map
      ? PhotoRequestStruct.fromMap(data.cast<String, dynamic>())
      : null;

  Map<String, dynamic> toMap() => {
        'purpose': _purpose,
        'title': _title,
        'reason': _reason,
      }.withoutNulls;

  @override
  Map<String, dynamic> toSerializableMap() => {
        'purpose': serializeParam(
          _purpose,
          ParamType.String,
        ),
        'title': serializeParam(
          _title,
          ParamType.String,
        ),
        'reason': serializeParam(
          _reason,
          ParamType.String,
        ),
      }.withoutNulls;

  static PhotoRequestStruct fromSerializableMap(Map<String, dynamic> data) =>
      PhotoRequestStruct(
        purpose: deserializeParam(
          data['purpose'],
          ParamType.String,
          false,
        ),
        title: deserializeParam(
          data['title'],
          ParamType.String,
          false,
        ),
        reason: deserializeParam(
          data['reason'],
          ParamType.String,
          false,
        ),
      );

  @override
  String toString() => 'PhotoRequestStruct(${toMap()})';

  @override
  bool operator ==(Object other) {
    return other is PhotoRequestStruct &&
        purpose == other.purpose &&
        title == other.title &&
        reason == other.reason;
  }

  @override
  int get hashCode => const ListEquality().hash([purpose, title, reason]);
}

PhotoRequestStruct createPhotoRequestStruct({
  String? purpose,
  String? title,
  String? reason,
  Map<String, dynamic> fieldValues = const {},
  bool clearUnsetFields = true,
  bool create = false,
  bool delete = false,
}) =>
    PhotoRequestStruct(
      purpose: purpose,
      title: title,
      reason: reason,
      firestoreUtilData: FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
        delete: delete,
        fieldValues: fieldValues,
      ),
    );

PhotoRequestStruct? updatePhotoRequestStruct(
  PhotoRequestStruct? photoRequest, {
  bool clearUnsetFields = true,
  bool create = false,
}) =>
    photoRequest
      ?..firestoreUtilData = FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
      );

void addPhotoRequestStructData(
  Map<String, dynamic> firestoreData,
  PhotoRequestStruct? photoRequest,
  String fieldName, [
  bool forFieldValue = false,
]) {
  firestoreData.remove(fieldName);
  if (photoRequest == null) {
    return;
  }
  if (photoRequest.firestoreUtilData.delete) {
    firestoreData[fieldName] = FieldValue.delete();
    return;
  }
  final clearFields =
      !forFieldValue && photoRequest.firestoreUtilData.clearUnsetFields;
  if (clearFields) {
    firestoreData[fieldName] = <String, dynamic>{};
  }
  final photoRequestData =
      getPhotoRequestFirestoreData(photoRequest, forFieldValue);
  final nestedData =
      photoRequestData.map((k, v) => MapEntry('$fieldName.$k', v));

  final mergeFields = photoRequest.firestoreUtilData.create || clearFields;
  firestoreData
      .addAll(mergeFields ? mergeNestedFields(nestedData) : nestedData);
}

Map<String, dynamic> getPhotoRequestFirestoreData(
  PhotoRequestStruct? photoRequest, [
  bool forFieldValue = false,
]) {
  if (photoRequest == null) {
    return {};
  }
  final firestoreData = mapToFirestore(photoRequest.toMap());

  // Add any Firestore field values
  mapToFirestore(photoRequest.firestoreUtilData.fieldValues)
      .forEach((k, v) => firestoreData[k] = v);

  return forFieldValue ? mergeNestedFields(firestoreData) : firestoreData;
}

List<Map<String, dynamic>> getPhotoRequestListFirestoreData(
  List<PhotoRequestStruct>? photoRequests,
) =>
    photoRequests?.map((e) => getPhotoRequestFirestoreData(e, true)).toList() ??
    [];
