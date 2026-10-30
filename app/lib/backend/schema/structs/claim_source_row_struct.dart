// ignore_for_file: unnecessary_getters_setters

import 'package:cloud_firestore/cloud_firestore.dart' hide Type;

import '/backend/schema/util/firestore_util.dart';
import '/backend/schema/util/schema_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

/// Struct ClaimSourceRow
class ClaimSourceRowStruct extends FFFirebaseStruct {
  ClaimSourceRowStruct({
    /// ClaimSourceRow.claimType
    String? claimType,

    /// ClaimSourceRow.claim
    String? claim,

    /// ClaimSourceRow.ingredientForm
    String? ingredientForm,

    /// ClaimSourceRow.title
    String? title,

    /// ClaimSourceRow.url
    String? url,

    /// ClaimSourceRow.passage
    String? passage,

    /// ClaimSourceRow.speciesScope
    String? speciesScope,

    /// ClaimSourceRow.evidence
    String? evidence,

    /// ClaimSourceRow.doseContext
    String? doseContext,

    /// ClaimSourceRow.retrievedAt
    String? retrievedAt,

    /// ClaimSourceRow.publishedAt
    String? publishedAt,

    /// ClaimSourceRow.reviewStatus
    String? reviewStatus,

    /// ClaimSourceRow.label
    String? label,
    FirestoreUtilData firestoreUtilData = const FirestoreUtilData(),
  })  : _claimType = claimType,
        _claim = claim,
        _ingredientForm = ingredientForm,
        _title = title,
        _url = url,
        _passage = passage,
        _speciesScope = speciesScope,
        _evidence = evidence,
        _doseContext = doseContext,
        _retrievedAt = retrievedAt,
        _publishedAt = publishedAt,
        _reviewStatus = reviewStatus,
        _label = label,
        super(firestoreUtilData);

  // "claimType" field.
  String? _claimType;
  String get claimType => _claimType ?? '';
  set claimType(String? val) => _claimType = val;

  bool hasClaimType() => _claimType != null;

  // "claim" field.
  String? _claim;
  String get claim => _claim ?? '';
  set claim(String? val) => _claim = val;

  bool hasClaim() => _claim != null;

  // "ingredientForm" field.
  String? _ingredientForm;
  String get ingredientForm => _ingredientForm ?? '';
  set ingredientForm(String? val) => _ingredientForm = val;

  bool hasIngredientForm() => _ingredientForm != null;

  // "title" field.
  String? _title;
  String get title => _title ?? '';
  set title(String? val) => _title = val;

  bool hasTitle() => _title != null;

  // "url" field.
  String? _url;
  String get url => _url ?? '';
  set url(String? val) => _url = val;

  bool hasUrl() => _url != null;

  // "passage" field.
  String? _passage;
  String get passage => _passage ?? '';
  set passage(String? val) => _passage = val;

  bool hasPassage() => _passage != null;

  // "speciesScope" field.
  String? _speciesScope;
  String get speciesScope => _speciesScope ?? '';
  set speciesScope(String? val) => _speciesScope = val;

  bool hasSpeciesScope() => _speciesScope != null;

  // "evidence" field.
  String? _evidence;
  String get evidence => _evidence ?? '';
  set evidence(String? val) => _evidence = val;

  bool hasEvidence() => _evidence != null;

  // "doseContext" field.
  String? _doseContext;
  String get doseContext => _doseContext ?? '';
  set doseContext(String? val) => _doseContext = val;

  bool hasDoseContext() => _doseContext != null;

  // "retrievedAt" field.
  String? _retrievedAt;
  String get retrievedAt => _retrievedAt ?? '';
  set retrievedAt(String? val) => _retrievedAt = val;

  bool hasRetrievedAt() => _retrievedAt != null;

  // "publishedAt" field.
  String? _publishedAt;
  String get publishedAt => _publishedAt ?? '';
  set publishedAt(String? val) => _publishedAt = val;

  bool hasPublishedAt() => _publishedAt != null;

  // "reviewStatus" field.
  String? _reviewStatus;
  String get reviewStatus => _reviewStatus ?? '';
  set reviewStatus(String? val) => _reviewStatus = val;

  bool hasReviewStatus() => _reviewStatus != null;

  // "label" field.
  String? _label;
  String get label => _label ?? '';
  set label(String? val) => _label = val;

  bool hasLabel() => _label != null;

  static ClaimSourceRowStruct fromMap(Map<String, dynamic> data) =>
      ClaimSourceRowStruct(
        claimType: data['claimType'] as String?,
        claim: data['claim'] as String?,
        ingredientForm: data['ingredientForm'] as String?,
        title: data['title'] as String?,
        url: data['url'] as String?,
        passage: data['passage'] as String?,
        speciesScope: data['speciesScope'] as String?,
        evidence: data['evidence'] as String?,
        doseContext: data['doseContext'] as String?,
        retrievedAt: data['retrievedAt'] as String?,
        publishedAt: data['publishedAt'] as String?,
        reviewStatus: data['reviewStatus'] as String?,
        label: data['label'] as String?,
      );

  static ClaimSourceRowStruct? maybeFromMap(dynamic data) => data is Map
      ? ClaimSourceRowStruct.fromMap(data.cast<String, dynamic>())
      : null;

  Map<String, dynamic> toMap() => {
        'claimType': _claimType,
        'claim': _claim,
        'ingredientForm': _ingredientForm,
        'title': _title,
        'url': _url,
        'passage': _passage,
        'speciesScope': _speciesScope,
        'evidence': _evidence,
        'doseContext': _doseContext,
        'retrievedAt': _retrievedAt,
        'publishedAt': _publishedAt,
        'reviewStatus': _reviewStatus,
        'label': _label,
      }.withoutNulls;

  @override
  Map<String, dynamic> toSerializableMap() => {
        'claimType': serializeParam(
          _claimType,
          ParamType.String,
        ),
        'claim': serializeParam(
          _claim,
          ParamType.String,
        ),
        'ingredientForm': serializeParam(
          _ingredientForm,
          ParamType.String,
        ),
        'title': serializeParam(
          _title,
          ParamType.String,
        ),
        'url': serializeParam(
          _url,
          ParamType.String,
        ),
        'passage': serializeParam(
          _passage,
          ParamType.String,
        ),
        'speciesScope': serializeParam(
          _speciesScope,
          ParamType.String,
        ),
        'evidence': serializeParam(
          _evidence,
          ParamType.String,
        ),
        'doseContext': serializeParam(
          _doseContext,
          ParamType.String,
        ),
        'retrievedAt': serializeParam(
          _retrievedAt,
          ParamType.String,
        ),
        'publishedAt': serializeParam(
          _publishedAt,
          ParamType.String,
        ),
        'reviewStatus': serializeParam(
          _reviewStatus,
          ParamType.String,
        ),
        'label': serializeParam(
          _label,
          ParamType.String,
        ),
      }.withoutNulls;

  static ClaimSourceRowStruct fromSerializableMap(Map<String, dynamic> data) =>
      ClaimSourceRowStruct(
        claimType: deserializeParam(
          data['claimType'],
          ParamType.String,
          false,
        ),
        claim: deserializeParam(
          data['claim'],
          ParamType.String,
          false,
        ),
        ingredientForm: deserializeParam(
          data['ingredientForm'],
          ParamType.String,
          false,
        ),
        title: deserializeParam(
          data['title'],
          ParamType.String,
          false,
        ),
        url: deserializeParam(
          data['url'],
          ParamType.String,
          false,
        ),
        passage: deserializeParam(
          data['passage'],
          ParamType.String,
          false,
        ),
        speciesScope: deserializeParam(
          data['speciesScope'],
          ParamType.String,
          false,
        ),
        evidence: deserializeParam(
          data['evidence'],
          ParamType.String,
          false,
        ),
        doseContext: deserializeParam(
          data['doseContext'],
          ParamType.String,
          false,
        ),
        retrievedAt: deserializeParam(
          data['retrievedAt'],
          ParamType.String,
          false,
        ),
        publishedAt: deserializeParam(
          data['publishedAt'],
          ParamType.String,
          false,
        ),
        reviewStatus: deserializeParam(
          data['reviewStatus'],
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
  String toString() => 'ClaimSourceRowStruct(${toMap()})';

  @override
  bool operator ==(Object other) {
    return other is ClaimSourceRowStruct &&
        claimType == other.claimType &&
        claim == other.claim &&
        ingredientForm == other.ingredientForm &&
        title == other.title &&
        url == other.url &&
        passage == other.passage &&
        speciesScope == other.speciesScope &&
        evidence == other.evidence &&
        doseContext == other.doseContext &&
        retrievedAt == other.retrievedAt &&
        publishedAt == other.publishedAt &&
        reviewStatus == other.reviewStatus &&
        label == other.label;
  }

  @override
  int get hashCode => const ListEquality().hash([
        claimType,
        claim,
        ingredientForm,
        title,
        url,
        passage,
        speciesScope,
        evidence,
        doseContext,
        retrievedAt,
        publishedAt,
        reviewStatus,
        label
      ]);
}

ClaimSourceRowStruct createClaimSourceRowStruct({
  String? claimType,
  String? claim,
  String? ingredientForm,
  String? title,
  String? url,
  String? passage,
  String? speciesScope,
  String? evidence,
  String? doseContext,
  String? retrievedAt,
  String? publishedAt,
  String? reviewStatus,
  String? label,
  Map<String, dynamic> fieldValues = const {},
  bool clearUnsetFields = true,
  bool create = false,
  bool delete = false,
}) =>
    ClaimSourceRowStruct(
      claimType: claimType,
      claim: claim,
      ingredientForm: ingredientForm,
      title: title,
      url: url,
      passage: passage,
      speciesScope: speciesScope,
      evidence: evidence,
      doseContext: doseContext,
      retrievedAt: retrievedAt,
      publishedAt: publishedAt,
      reviewStatus: reviewStatus,
      label: label,
      firestoreUtilData: FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
        delete: delete,
        fieldValues: fieldValues,
      ),
    );

ClaimSourceRowStruct? updateClaimSourceRowStruct(
  ClaimSourceRowStruct? claimSourceRow, {
  bool clearUnsetFields = true,
  bool create = false,
}) =>
    claimSourceRow
      ?..firestoreUtilData = FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
      );

void addClaimSourceRowStructData(
  Map<String, dynamic> firestoreData,
  ClaimSourceRowStruct? claimSourceRow,
  String fieldName, [
  bool forFieldValue = false,
]) {
  firestoreData.remove(fieldName);
  if (claimSourceRow == null) {
    return;
  }
  if (claimSourceRow.firestoreUtilData.delete) {
    firestoreData[fieldName] = FieldValue.delete();
    return;
  }
  final clearFields =
      !forFieldValue && claimSourceRow.firestoreUtilData.clearUnsetFields;
  if (clearFields) {
    firestoreData[fieldName] = <String, dynamic>{};
  }
  final claimSourceRowData =
      getClaimSourceRowFirestoreData(claimSourceRow, forFieldValue);
  final nestedData =
      claimSourceRowData.map((k, v) => MapEntry('$fieldName.$k', v));

  final mergeFields = claimSourceRow.firestoreUtilData.create || clearFields;
  firestoreData
      .addAll(mergeFields ? mergeNestedFields(nestedData) : nestedData);
}

Map<String, dynamic> getClaimSourceRowFirestoreData(
  ClaimSourceRowStruct? claimSourceRow, [
  bool forFieldValue = false,
]) {
  if (claimSourceRow == null) {
    return {};
  }
  final firestoreData = mapToFirestore(claimSourceRow.toMap());

  // Add any Firestore field values
  mapToFirestore(claimSourceRow.firestoreUtilData.fieldValues)
      .forEach((k, v) => firestoreData[k] = v);

  return forFieldValue ? mergeNestedFields(firestoreData) : firestoreData;
}

List<Map<String, dynamic>> getClaimSourceRowListFirestoreData(
  List<ClaimSourceRowStruct>? claimSourceRows,
) =>
    claimSourceRows
        ?.map((e) => getClaimSourceRowFirestoreData(e, true))
        .toList() ??
    [];
