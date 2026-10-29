import 'dart:async';

import 'package:collection/collection.dart';

import '/backend/schema/util/firestore_util.dart';
import '/backend/schema/util/schema_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

/// Collection photos
class PhotosRecord extends FirestoreRecord {
  PhotosRecord._(
    DocumentReference reference,
    Map<String, dynamic> data,
  ) : super(reference, data) {
    _initializeFields();
  }

  // "scanId" field.
  String? _scanId;
  String get scanId => _scanId ?? '';
  bool hasScanId() => _scanId != null;

  // "purpose" field.
  String? _purpose;
  String get purpose => _purpose ?? '';
  bool hasPurpose() => _purpose != null;

  // "imageUrl" field.
  String? _imageUrl;
  String get imageUrl => _imageUrl ?? '';
  bool hasImageUrl() => _imageUrl != null;

  // "status" field.
  String? _status;
  String get status => _status ?? '';
  bool hasStatus() => _status != null;

  // "createdAt" field.
  DateTime? _createdAt;
  DateTime? get createdAt => _createdAt;
  bool hasCreatedAt() => _createdAt != null;

  // "statusMessage" field.
  String? _statusMessage;
  String get statusMessage => _statusMessage ?? '';
  bool hasStatusMessage() => _statusMessage != null;

  // "panels" field.
  List<String>? _panels;
  List<String> get panels => _panels ?? const [];
  bool hasPanels() => _panels != null;

  // "fieldsFound" field.
  List<String>? _fieldsFound;
  List<String> get fieldsFound => _fieldsFound ?? const [];
  bool hasFieldsFound() => _fieldsFound != null;

  // "uncertainFields" field.
  List<String>? _uncertainFields;
  List<String> get uncertainFields => _uncertainFields ?? const [];
  bool hasUncertainFields() => _uncertainFields != null;

  // "processedAt" field.
  DateTime? _processedAt;
  DateTime? get processedAt => _processedAt;
  bool hasProcessedAt() => _processedAt != null;

  // "updatedAt" field.
  DateTime? _updatedAt;
  DateTime? get updatedAt => _updatedAt;
  bool hasUpdatedAt() => _updatedAt != null;

  DocumentReference get parentReference => reference.parent.parent!;

  void _initializeFields() {
    _scanId = snapshotData['scanId'] as String?;
    _purpose = snapshotData['purpose'] as String?;
    _imageUrl = snapshotData['imageUrl'] as String?;
    _status = snapshotData['status'] as String?;
    _createdAt = snapshotData['createdAt'] as DateTime?;
    _statusMessage = snapshotData['statusMessage'] as String?;
    _panels = getDataList(snapshotData['panels']);
    _fieldsFound = getDataList(snapshotData['fieldsFound']);
    _uncertainFields = getDataList(snapshotData['uncertainFields']);
    _processedAt = snapshotData['processedAt'] as DateTime?;
    _updatedAt = snapshotData['updatedAt'] as DateTime?;
  }

  static Query<Map<String, dynamic>> collection([DocumentReference? parent]) =>
      parent != null
          ? parent.collection('photos')
          : FirebaseFirestore.instance.collectionGroup('photos');

  static DocumentReference createDoc(DocumentReference parent, {String? id}) =>
      parent.collection('photos').doc(id);

  static Stream<PhotosRecord> getDocument(DocumentReference ref) =>
      ref.snapshots().map((s) => PhotosRecord.fromSnapshot(s));

  static Future<PhotosRecord> getDocumentOnce(DocumentReference ref) =>
      ref.get().then((s) => PhotosRecord.fromSnapshot(s));

  static PhotosRecord fromSnapshot(DocumentSnapshot snapshot) => PhotosRecord._(
        snapshot.reference,
        mapFromFirestore(snapshot.data() as Map<String, dynamic>),
      );

  static PhotosRecord getDocumentFromData(
    Map<String, dynamic> data,
    DocumentReference reference,
  ) =>
      PhotosRecord._(reference, mapFromFirestore(data));

  @override
  String toString() =>
      'PhotosRecord(reference: ${reference.path}, data: $snapshotData)';

  @override
  int get hashCode => reference.path.hashCode;

  @override
  bool operator ==(other) =>
      other is PhotosRecord && reference.path == other.reference.path;
}

Map<String, dynamic> createPhotosRecordData({
  String? scanId,
  String? purpose,
  String? imageUrl,
  String? status,
  DateTime? createdAt,
  String? statusMessage,
  DateTime? processedAt,
  DateTime? updatedAt,
}) {
  final firestoreData = mapToFirestore(
    <String, dynamic>{
      'scanId': scanId,
      'purpose': purpose,
      'imageUrl': imageUrl,
      'status': status,
      'createdAt': createdAt,
      'statusMessage': statusMessage,
      'processedAt': processedAt,
      'updatedAt': updatedAt,
    }.withoutNulls,
  );

  return firestoreData;
}

class PhotosRecordDocumentEquality implements Equality<PhotosRecord> {
  const PhotosRecordDocumentEquality();

  @override
  bool equals(PhotosRecord? e1, PhotosRecord? e2) {
    const listEquality = ListEquality();
    return e1?.scanId == e2?.scanId &&
        e1?.purpose == e2?.purpose &&
        e1?.imageUrl == e2?.imageUrl &&
        e1?.status == e2?.status &&
        e1?.createdAt == e2?.createdAt &&
        e1?.statusMessage == e2?.statusMessage &&
        listEquality.equals(e1?.panels, e2?.panels) &&
        listEquality.equals(e1?.fieldsFound, e2?.fieldsFound) &&
        listEquality.equals(e1?.uncertainFields, e2?.uncertainFields) &&
        e1?.processedAt == e2?.processedAt &&
        e1?.updatedAt == e2?.updatedAt;
  }

  @override
  int hash(PhotosRecord? e) => const ListEquality().hash([
        e?.scanId,
        e?.purpose,
        e?.imageUrl,
        e?.status,
        e?.createdAt,
        e?.statusMessage,
        const ListEquality().hash(e?.panels),
        const ListEquality().hash(e?.fieldsFound),
        const ListEquality().hash(e?.uncertainFields),
        e?.processedAt,
        e?.updatedAt
      ]);

  @override
  bool isValidKey(Object? o) => o is PhotosRecord;
}
