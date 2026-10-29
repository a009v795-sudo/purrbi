// ignore_for_file: unnecessary_getters_setters

import 'package:cloud_firestore/cloud_firestore.dart' hide Type;

import '/backend/schema/util/firestore_util.dart';
import '/backend/schema/util/schema_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

/// Struct EvidenceSource
class EvidenceSourceStruct extends FFFirebaseStruct {
  EvidenceSourceStruct({
    /// EvidenceSource.name
    String? name,

    /// EvidenceSource.type
    String? type,

    /// EvidenceSource.url
    String? url,

    /// EvidenceSource.retrievedAt
    String? retrievedAt,

    /// EvidenceSource.license
    String? license,

    /// EvidenceSource.match
    String? match,

    /// EvidenceSource.label
    String? label,
    FirestoreUtilData firestoreUtilData = const FirestoreUtilData(),
  })  : _name = name,
        _type = type,
        _url = url,
        _retrievedAt = retrievedAt,
        _license = license,
        _match = match,
        _label = label,
        super(firestoreUtilData);

  // "name" field.
  String? _name;
  String get name => _name ?? '';
  set name(String? val) => _name = val;

  bool hasName() => _name != null;

  // "type" field.
  String? _type;
  String get type => _type ?? '';
  set type(String? val) => _type = val;

  bool hasType() => _type != null;

  // "url" field.
  String? _url;
  String get url => _url ?? '';
  set url(String? val) => _url = val;

  bool hasUrl() => _url != null;

  // "retrievedAt" field.
  String? _retrievedAt;
  String get retrievedAt => _retrievedAt ?? '';
  set retrievedAt(String? val) => _retrievedAt = val;

  bool hasRetrievedAt() => _retrievedAt != null;

  // "license" field.
  String? _license;
  String get license => _license ?? '';
  set license(String? val) => _license = val;

  bool hasLicense() => _license != null;

  // "match" field.
  String? _match;
  String get match => _match ?? '';
  set match(String? val) => _match = val;

  bool hasMatch() => _match != null;

  // "label" field.
  String? _label;
  String get label => _label ?? '';
  set label(String? val) => _label = val;

  bool hasLabel() => _label != null;

  static EvidenceSourceStruct fromMap(Map<String, dynamic> data) =>
      EvidenceSourceStruct(
        name: data['name'] as String?,
        type: data['type'] as String?,
        url: data['url'] as String?,
        retrievedAt: data['retrievedAt'] as String?,
        license: data['license'] as String?,
        match: data['match'] as String?,
        label: data['label'] as String?,
      );

  static EvidenceSourceStruct? maybeFromMap(dynamic data) => data is Map
      ? EvidenceSourceStruct.fromMap(data.cast<String, dynamic>())
      : null;

  Map<String, dynamic> toMap() => {
        'name': _name,
        'type': _type,
        'url': _url,
        'retrievedAt': _retrievedAt,
        'license': _license,
        'match': _match,
        'label': _label,
      }.withoutNulls;

  @override
  Map<String, dynamic> toSerializableMap() => {
        'name': serializeParam(
          _name,
          ParamType.String,
        ),
        'type': serializeParam(
          _type,
          ParamType.String,
        ),
        'url': serializeParam(
          _url,
          ParamType.String,
        ),
        'retrievedAt': serializeParam(
          _retrievedAt,
          ParamType.String,
        ),
        'license': serializeParam(
          _license,
          ParamType.String,
        ),
        'match': serializeParam(
          _match,
          ParamType.String,
        ),
        'label': serializeParam(
          _label,
          ParamType.String,
        ),
      }.withoutNulls;

  static EvidenceSourceStruct fromSerializableMap(Map<String, dynamic> data) =>
      EvidenceSourceStruct(
        name: deserializeParam(
          data['name'],
          ParamType.String,
          false,
        ),
        type: deserializeParam(
          data['type'],
          ParamType.String,
          false,
        ),
        url: deserializeParam(
          data['url'],
          ParamType.String,
          false,
        ),
        retrievedAt: deserializeParam(
          data['retrievedAt'],
          ParamType.String,
          false,
        ),
        license: deserializeParam(
          data['license'],
          ParamType.String,
          false,
        ),
        match: deserializeParam(
          data['match'],
          ParamType.String,
          false,
        ),
        label: deserializeParam(
          data['label'],
          ParamType.String,
          false,
        ),
      );

  @override
  String toString() => 'EvidenceSourceStruct(${toMap()})';

  @override
  bool operator ==(Object other) {
    return other is EvidenceSourceStruct &&
        name == other.name &&
        type == other.type &&
        url == other.url &&
        retrievedAt == other.retrievedAt &&
        license == other.license &&
        match == other.match &&
        label == other.label;
  }

  @override
  int get hashCode => const ListEquality()
      .hash([name, type, url, retrievedAt, license, match, label]);
}

EvidenceSourceStruct createEvidenceSourceStruct({
  String? name,
  String? type,
  String? url,
  String? retrievedAt,
  String? license,
  String? match,
  String? label,
  Map<String, dynamic> fieldValues = const {},
  bool clearUnsetFields = true,
  bool create = false,
  bool delete = false,
}) =>
    EvidenceSourceStruct(
      name: name,
      type: type,
      url: url,
      retrievedAt: retrievedAt,
      license: license,
      match: match,
      label: label,
      firestoreUtilData: FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
        delete: delete,
        fieldValues: fieldValues,
      ),
    );

EvidenceSourceStruct? updateEvidenceSourceStruct(
  EvidenceSourceStruct? evidenceSource, {
  bool clearUnsetFields = true,
  bool create = false,
}) =>
    evidenceSource
      ?..firestoreUtilData = FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
      );

void addEvidenceSourceStructData(
  Map<String, dynamic> firestoreData,
  EvidenceSourceStruct? evidenceSource,
  String fieldName, [
  bool forFieldValue = false,
]) {
  firestoreData.remove(fieldName);
  if (evidenceSource == null) {
    return;
  }
  if (evidenceSource.firestoreUtilData.delete) {
    firestoreData[fieldName] = FieldValue.delete();
    return;
  }
  final clearFields =
      !forFieldValue && evidenceSource.firestoreUtilData.clearUnsetFields;
  if (clearFields) {
    firestoreData[fieldName] = <String, dynamic>{};
  }
  final evidenceSourceData =
      getEvidenceSourceFirestoreData(evidenceSource, forFieldValue);
  final nestedData =
      evidenceSourceData.map((k, v) => MapEntry('$fieldName.$k', v));

  final mergeFields = evidenceSource.firestoreUtilData.create || clearFields;
  firestoreData
      .addAll(mergeFields ? mergeNestedFields(nestedData) : nestedData);
}

Map<String, dynamic> getEvidenceSourceFirestoreData(
  EvidenceSourceStruct? evidenceSource, [
  bool forFieldValue = false,
]) {
  if (evidenceSource == null) {
    return {};
  }
  final firestoreData = mapToFirestore(evidenceSource.toMap());

  // Add any Firestore field values
  mapToFirestore(evidenceSource.firestoreUtilData.fieldValues)
      .forEach((k, v) => firestoreData[k] = v);

  return forFieldValue ? mergeNestedFields(firestoreData) : firestoreData;
}

List<Map<String, dynamic>> getEvidenceSourceListFirestoreData(
  List<EvidenceSourceStruct>? evidenceSources,
) =>
    evidenceSources
        ?.map((e) => getEvidenceSourceFirestoreData(e, true))
        .toList() ??
    [];
