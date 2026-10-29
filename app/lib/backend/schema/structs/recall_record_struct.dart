// ignore_for_file: unnecessary_getters_setters

import 'package:cloud_firestore/cloud_firestore.dart' hide Type;

import '/backend/schema/util/firestore_util.dart';
import '/backend/schema/util/schema_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

/// Struct RecallRecord
class RecallRecordStruct extends FFFirebaseStruct {
  RecallRecordStruct({
    /// RecallRecord.recallNumber
    String? recallNumber,

    /// RecallRecord.status
    String? status,

    /// RecallRecord.classification
    String? classification,

    /// RecallRecord.reason
    String? reason,

    /// RecallRecord.reportDate
    String? reportDate,

    /// RecallRecord.productDescription
    String? productDescription,

    /// RecallRecord.recallingFirm
    String? recallingFirm,

    /// RecallRecord.match
    String? match,
    FirestoreUtilData firestoreUtilData = const FirestoreUtilData(),
  })  : _recallNumber = recallNumber,
        _status = status,
        _classification = classification,
        _reason = reason,
        _reportDate = reportDate,
        _productDescription = productDescription,
        _recallingFirm = recallingFirm,
        _match = match,
        super(firestoreUtilData);

  // "recallNumber" field.
  String? _recallNumber;
  String get recallNumber => _recallNumber ?? '';
  set recallNumber(String? val) => _recallNumber = val;

  bool hasRecallNumber() => _recallNumber != null;

  // "status" field.
  String? _status;
  String get status => _status ?? '';
  set status(String? val) => _status = val;

  bool hasStatus() => _status != null;

  // "classification" field.
  String? _classification;
  String get classification => _classification ?? '';
  set classification(String? val) => _classification = val;

  bool hasClassification() => _classification != null;

  // "reason" field.
  String? _reason;
  String get reason => _reason ?? '';
  set reason(String? val) => _reason = val;

  bool hasReason() => _reason != null;

  // "reportDate" field.
  String? _reportDate;
  String get reportDate => _reportDate ?? '';
  set reportDate(String? val) => _reportDate = val;

  bool hasReportDate() => _reportDate != null;

  // "productDescription" field.
  String? _productDescription;
  String get productDescription => _productDescription ?? '';
  set productDescription(String? val) => _productDescription = val;

  bool hasProductDescription() => _productDescription != null;

  // "recallingFirm" field.
  String? _recallingFirm;
  String get recallingFirm => _recallingFirm ?? '';
  set recallingFirm(String? val) => _recallingFirm = val;

  bool hasRecallingFirm() => _recallingFirm != null;

  // "match" field.
  String? _match;
  String get match => _match ?? '';
  set match(String? val) => _match = val;

  bool hasMatch() => _match != null;

  static RecallRecordStruct fromMap(Map<String, dynamic> data) =>
      RecallRecordStruct(
        recallNumber: data['recallNumber'] as String?,
        status: data['status'] as String?,
        classification: data['classification'] as String?,
        reason: data['reason'] as String?,
        reportDate: data['reportDate'] as String?,
        productDescription: data['productDescription'] as String?,
        recallingFirm: data['recallingFirm'] as String?,
        match: data['match'] as String?,
      );

  static RecallRecordStruct? maybeFromMap(dynamic data) => data is Map
      ? RecallRecordStruct.fromMap(data.cast<String, dynamic>())
      : null;

  Map<String, dynamic> toMap() => {
        'recallNumber': _recallNumber,
        'status': _status,
        'classification': _classification,
        'reason': _reason,
        'reportDate': _reportDate,
        'productDescription': _productDescription,
        'recallingFirm': _recallingFirm,
        'match': _match,
      }.withoutNulls;

  @override
  Map<String, dynamic> toSerializableMap() => {
        'recallNumber': serializeParam(
          _recallNumber,
          ParamType.String,
        ),
        'status': serializeParam(
          _status,
          ParamType.String,
        ),
        'classification': serializeParam(
          _classification,
          ParamType.String,
        ),
        'reason': serializeParam(
          _reason,
          ParamType.String,
        ),
        'reportDate': serializeParam(
          _reportDate,
          ParamType.String,
        ),
        'productDescription': serializeParam(
          _productDescription,
          ParamType.String,
        ),
        'recallingFirm': serializeParam(
          _recallingFirm,
          ParamType.String,
        ),
        'match': serializeParam(
          _match,
          ParamType.String,
        ),
      }.withoutNulls;

  static RecallRecordStruct fromSerializableMap(Map<String, dynamic> data) =>
      RecallRecordStruct(
        recallNumber: deserializeParam(
          data['recallNumber'],
          ParamType.String,
          false,
        ),
        status: deserializeParam(
          data['status'],
          ParamType.String,
          false,
        ),
        classification: deserializeParam(
          data['classification'],
          ParamType.String,
          false,
        ),
        reason: deserializeParam(
          data['reason'],
          ParamType.String,
          false,
        ),
        reportDate: deserializeParam(
          data['reportDate'],
          ParamType.String,
          false,
        ),
        productDescription: deserializeParam(
          data['productDescription'],
          ParamType.String,
          false,
        ),
        recallingFirm: deserializeParam(
          data['recallingFirm'],
          ParamType.String,
          false,
        ),
        match: deserializeParam(
          data['match'],
          ParamType.String,
          false,
        ),
      );

  @override
  String toString() => 'RecallRecordStruct(${toMap()})';

  @override
  bool operator ==(Object other) {
    return other is RecallRecordStruct &&
        recallNumber == other.recallNumber &&
        status == other.status &&
        classification == other.classification &&
        reason == other.reason &&
        reportDate == other.reportDate &&
        productDescription == other.productDescription &&
        recallingFirm == other.recallingFirm &&
        match == other.match;
  }

  @override
  int get hashCode => const ListEquality().hash([
        recallNumber,
        status,
        classification,
        reason,
        reportDate,
        productDescription,
        recallingFirm,
        match
      ]);
}

RecallRecordStruct createRecallRecordStruct({
  String? recallNumber,
  String? status,
  String? classification,
  String? reason,
  String? reportDate,
  String? productDescription,
  String? recallingFirm,
  String? match,
  Map<String, dynamic> fieldValues = const {},
  bool clearUnsetFields = true,
  bool create = false,
  bool delete = false,
}) =>
    RecallRecordStruct(
      recallNumber: recallNumber,
      status: status,
      classification: classification,
      reason: reason,
      reportDate: reportDate,
      productDescription: productDescription,
      recallingFirm: recallingFirm,
      match: match,
      firestoreUtilData: FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
        delete: delete,
        fieldValues: fieldValues,
      ),
    );

RecallRecordStruct? updateRecallRecordStruct(
  RecallRecordStruct? recallRecord, {
  bool clearUnsetFields = true,
  bool create = false,
}) =>
    recallRecord
      ?..firestoreUtilData = FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
      );

void addRecallRecordStructData(
  Map<String, dynamic> firestoreData,
  RecallRecordStruct? recallRecord,
  String fieldName, [
  bool forFieldValue = false,
]) {
  firestoreData.remove(fieldName);
  if (recallRecord == null) {
    return;
  }
  if (recallRecord.firestoreUtilData.delete) {
    firestoreData[fieldName] = FieldValue.delete();
    return;
  }
  final clearFields =
      !forFieldValue && recallRecord.firestoreUtilData.clearUnsetFields;
  if (clearFields) {
    firestoreData[fieldName] = <String, dynamic>{};
  }
  final recallRecordData =
      getRecallRecordFirestoreData(recallRecord, forFieldValue);
  final nestedData =
      recallRecordData.map((k, v) => MapEntry('$fieldName.$k', v));

  final mergeFields = recallRecord.firestoreUtilData.create || clearFields;
  firestoreData
      .addAll(mergeFields ? mergeNestedFields(nestedData) : nestedData);
}

Map<String, dynamic> getRecallRecordFirestoreData(
  RecallRecordStruct? recallRecord, [
  bool forFieldValue = false,
]) {
  if (recallRecord == null) {
    return {};
  }
  final firestoreData = mapToFirestore(recallRecord.toMap());

  // Add any Firestore field values
  mapToFirestore(recallRecord.firestoreUtilData.fieldValues)
      .forEach((k, v) => firestoreData[k] = v);

  return forFieldValue ? mergeNestedFields(firestoreData) : firestoreData;
}

List<Map<String, dynamic>> getRecallRecordListFirestoreData(
  List<RecallRecordStruct>? recallRecords,
) =>
    recallRecords?.map((e) => getRecallRecordFirestoreData(e, true)).toList() ??
    [];
