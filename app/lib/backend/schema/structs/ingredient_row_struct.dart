// ignore_for_file: unnecessary_getters_setters

import 'package:cloud_firestore/cloud_firestore.dart' hide Type;

import '/backend/schema/util/firestore_util.dart';
import '/backend/schema/util/schema_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

/// Struct IngredientRow
class IngredientRowStruct extends FFFirebaseStruct {
  IngredientRowStruct({
    /// IngredientRow.id
    String? id,

    /// IngredientRow.position
    int? position,

    /// IngredientRow.name
    String? name,

    /// IngredientRow.labelText
    String? labelText,

    /// IngredientRow.kind
    String? kind,

    /// IngredientRow.role
    String? role,

    /// IngredientRow.color
    String? color,

    /// IngredientRow.reason
    String? reason,

    /// IngredientRow.whatItIs
    String? whatItIs,

    /// IngredientRow.whyUsed
    String? whyUsed,

    /// IngredientRow.benefitsRisks
    String? benefitsRisks,

    /// IngredientRow.relevance
    String? relevance,

    /// IngredientRow.petFlag
    String? petFlag,

    /// IngredientRow.uncertainty
    String? uncertainty,

    /// IngredientRow.statusIdentity
    String? statusIdentity,

    /// IngredientRow.statusRole
    String? statusRole,

    /// IngredientRow.statusRisk
    String? statusRisk,

    /// IngredientRow.statusExposure
    String? statusExposure,

    /// IngredientRow.statusHumanReview
    String? statusHumanReview,

    /// IngredientRow.checksText
    String? checksText,

    /// IngredientRow.sources
    List<ClaimSourceRowStruct>? sources,

    /// IngredientRow.children
    List<IngredientChildRowStruct>? children,

    /// IngredientRow.concernRank
    int? concernRank,
    FirestoreUtilData firestoreUtilData = const FirestoreUtilData(),
  })  : _id = id,
        _position = position,
        _name = name,
        _labelText = labelText,
        _kind = kind,
        _role = role,
        _color = color,
        _reason = reason,
        _whatItIs = whatItIs,
        _whyUsed = whyUsed,
        _benefitsRisks = benefitsRisks,
        _relevance = relevance,
        _petFlag = petFlag,
        _uncertainty = uncertainty,
        _statusIdentity = statusIdentity,
        _statusRole = statusRole,
        _statusRisk = statusRisk,
        _statusExposure = statusExposure,
        _statusHumanReview = statusHumanReview,
        _checksText = checksText,
        _sources = sources,
        _children = children,
        _concernRank = concernRank,
        super(firestoreUtilData);

  // "id" field.
  String? _id;
  String get id => _id ?? '';
  set id(String? val) => _id = val;

  bool hasId() => _id != null;

  // "position" field.
  int? _position;
  int get position => _position ?? 0;
  set position(int? val) => _position = val;

  void incrementPosition(int amount) => position = position + amount;

  bool hasPosition() => _position != null;

  // "name" field.
  String? _name;
  String get name => _name ?? '';
  set name(String? val) => _name = val;

  bool hasName() => _name != null;

  // "labelText" field.
  String? _labelText;
  String get labelText => _labelText ?? '';
  set labelText(String? val) => _labelText = val;

  bool hasLabelText() => _labelText != null;

  // "kind" field.
  String? _kind;
  String get kind => _kind ?? '';
  set kind(String? val) => _kind = val;

  bool hasKind() => _kind != null;

  // "role" field.
  String? _role;
  String get role => _role ?? '';
  set role(String? val) => _role = val;

  bool hasRole() => _role != null;

  // "color" field.
  String? _color;
  String get color => _color ?? '';
  set color(String? val) => _color = val;

  bool hasColor() => _color != null;

  // "reason" field.
  String? _reason;
  String get reason => _reason ?? '';
  set reason(String? val) => _reason = val;

  bool hasReason() => _reason != null;

  // "whatItIs" field.
  String? _whatItIs;
  String get whatItIs => _whatItIs ?? '';
  set whatItIs(String? val) => _whatItIs = val;

  bool hasWhatItIs() => _whatItIs != null;

  // "whyUsed" field.
  String? _whyUsed;
  String get whyUsed => _whyUsed ?? '';
  set whyUsed(String? val) => _whyUsed = val;

  bool hasWhyUsed() => _whyUsed != null;

  // "benefitsRisks" field.
  String? _benefitsRisks;
  String get benefitsRisks => _benefitsRisks ?? '';
  set benefitsRisks(String? val) => _benefitsRisks = val;

  bool hasBenefitsRisks() => _benefitsRisks != null;

  // "relevance" field.
  String? _relevance;
  String get relevance => _relevance ?? '';
  set relevance(String? val) => _relevance = val;

  bool hasRelevance() => _relevance != null;

  // "petFlag" field.
  String? _petFlag;
  String get petFlag => _petFlag ?? '';
  set petFlag(String? val) => _petFlag = val;

  bool hasPetFlag() => _petFlag != null;

  // "uncertainty" field.
  String? _uncertainty;
  String get uncertainty => _uncertainty ?? '';
  set uncertainty(String? val) => _uncertainty = val;

  bool hasUncertainty() => _uncertainty != null;

  // "statusIdentity" field.
  String? _statusIdentity;
  String get statusIdentity => _statusIdentity ?? '';
  set statusIdentity(String? val) => _statusIdentity = val;

  bool hasStatusIdentity() => _statusIdentity != null;

  // "statusRole" field.
  String? _statusRole;
  String get statusRole => _statusRole ?? '';
  set statusRole(String? val) => _statusRole = val;

  bool hasStatusRole() => _statusRole != null;

  // "statusRisk" field.
  String? _statusRisk;
  String get statusRisk => _statusRisk ?? '';
  set statusRisk(String? val) => _statusRisk = val;

  bool hasStatusRisk() => _statusRisk != null;

  // "statusExposure" field.
  String? _statusExposure;
  String get statusExposure => _statusExposure ?? '';
  set statusExposure(String? val) => _statusExposure = val;

  bool hasStatusExposure() => _statusExposure != null;

  // "statusHumanReview" field.
  String? _statusHumanReview;
  String get statusHumanReview => _statusHumanReview ?? '';
  set statusHumanReview(String? val) => _statusHumanReview = val;

  bool hasStatusHumanReview() => _statusHumanReview != null;

  // "checksText" field.
  String? _checksText;
  String get checksText => _checksText ?? '';
  set checksText(String? val) => _checksText = val;

  bool hasChecksText() => _checksText != null;

  // "sources" field.
  List<ClaimSourceRowStruct>? _sources;
  List<ClaimSourceRowStruct> get sources => _sources ?? const [];
  set sources(List<ClaimSourceRowStruct>? val) => _sources = val;

  void updateSources(Function(List<ClaimSourceRowStruct>) updateFn) {
    updateFn(_sources ??= []);
  }

  bool hasSources() => _sources != null;

  // "children" field.
  List<IngredientChildRowStruct>? _children;
  List<IngredientChildRowStruct> get children => _children ?? const [];
  set children(List<IngredientChildRowStruct>? val) => _children = val;

  void updateChildren(Function(List<IngredientChildRowStruct>) updateFn) {
    updateFn(_children ??= []);
  }

  bool hasChildren() => _children != null;

  // "concernRank" field.
  int? _concernRank;
  int get concernRank => _concernRank ?? 0;
  set concernRank(int? val) => _concernRank = val;

  void incrementConcernRank(int amount) => concernRank = concernRank + amount;

  bool hasConcernRank() => _concernRank != null;

  static IngredientRowStruct fromMap(Map<String, dynamic> data) =>
      IngredientRowStruct(
        id: data['id'] as String?,
        position: castToType<int>(data['position']),
        name: data['name'] as String?,
        labelText: data['labelText'] as String?,
        kind: data['kind'] as String?,
        role: data['role'] as String?,
        color: data['color'] as String?,
        reason: data['reason'] as String?,
        whatItIs: data['whatItIs'] as String?,
        whyUsed: data['whyUsed'] as String?,
        benefitsRisks: data['benefitsRisks'] as String?,
        relevance: data['relevance'] as String?,
        petFlag: data['petFlag'] as String?,
        uncertainty: data['uncertainty'] as String?,
        statusIdentity: data['statusIdentity'] as String?,
        statusRole: data['statusRole'] as String?,
        statusRisk: data['statusRisk'] as String?,
        statusExposure: data['statusExposure'] as String?,
        statusHumanReview: data['statusHumanReview'] as String?,
        checksText: data['checksText'] as String?,
        sources: getStructList(
          data['sources'],
          ClaimSourceRowStruct.fromMap,
        ),
        children: getStructList(
          data['children'],
          IngredientChildRowStruct.fromMap,
        ),
        concernRank: castToType<int>(data['concernRank']),
      );

  static IngredientRowStruct? maybeFromMap(dynamic data) => data is Map
      ? IngredientRowStruct.fromMap(data.cast<String, dynamic>())
      : null;

  Map<String, dynamic> toMap() => {
        'id': _id,
        'position': _position,
        'name': _name,
        'labelText': _labelText,
        'kind': _kind,
        'role': _role,
        'color': _color,
        'reason': _reason,
        'whatItIs': _whatItIs,
        'whyUsed': _whyUsed,
        'benefitsRisks': _benefitsRisks,
        'relevance': _relevance,
        'petFlag': _petFlag,
        'uncertainty': _uncertainty,
        'statusIdentity': _statusIdentity,
        'statusRole': _statusRole,
        'statusRisk': _statusRisk,
        'statusExposure': _statusExposure,
        'statusHumanReview': _statusHumanReview,
        'checksText': _checksText,
        'sources': _sources?.map((e) => e.toMap()).toList(),
        'children': _children?.map((e) => e.toMap()).toList(),
        'concernRank': _concernRank,
      }.withoutNulls;

  @override
  Map<String, dynamic> toSerializableMap() => {
        'id': serializeParam(
          _id,
          ParamType.String,
        ),
        'position': serializeParam(
          _position,
          ParamType.int,
        ),
        'name': serializeParam(
          _name,
          ParamType.String,
        ),
        'labelText': serializeParam(
          _labelText,
          ParamType.String,
        ),
        'kind': serializeParam(
          _kind,
          ParamType.String,
        ),
        'role': serializeParam(
          _role,
          ParamType.String,
        ),
        'color': serializeParam(
          _color,
          ParamType.String,
        ),
        'reason': serializeParam(
          _reason,
          ParamType.String,
        ),
        'whatItIs': serializeParam(
          _whatItIs,
          ParamType.String,
        ),
        'whyUsed': serializeParam(
          _whyUsed,
          ParamType.String,
        ),
        'benefitsRisks': serializeParam(
          _benefitsRisks,
          ParamType.String,
        ),
        'relevance': serializeParam(
          _relevance,
          ParamType.String,
        ),
        'petFlag': serializeParam(
          _petFlag,
          ParamType.String,
        ),
        'uncertainty': serializeParam(
          _uncertainty,
          ParamType.String,
        ),
        'statusIdentity': serializeParam(
          _statusIdentity,
          ParamType.String,
        ),
        'statusRole': serializeParam(
          _statusRole,
          ParamType.String,
        ),
        'statusRisk': serializeParam(
          _statusRisk,
          ParamType.String,
        ),
        'statusExposure': serializeParam(
          _statusExposure,
          ParamType.String,
        ),
        'statusHumanReview': serializeParam(
          _statusHumanReview,
          ParamType.String,
        ),
        'checksText': serializeParam(
          _checksText,
          ParamType.String,
        ),
        'sources': serializeParam(
          _sources,
          ParamType.DataStruct,
          isList: true,
        ),
        'children': serializeParam(
          _children,
          ParamType.DataStruct,
          isList: true,
        ),
        'concernRank': serializeParam(
          _concernRank,
          ParamType.int,
        ),
      }.withoutNulls;

  static IngredientRowStruct fromSerializableMap(Map<String, dynamic> data) =>
      IngredientRowStruct(
        id: deserializeParam(
          data['id'],
          ParamType.String,
          false,
        ),
        position: deserializeParam(
          data['position'],
          ParamType.int,
          false,
        ),
        name: deserializeParam(
          data['name'],
          ParamType.String,
          false,
        ),
        labelText: deserializeParam(
          data['labelText'],
          ParamType.String,
          false,
        ),
        kind: deserializeParam(
          data['kind'],
          ParamType.String,
          false,
        ),
        role: deserializeParam(
          data['role'],
          ParamType.String,
          false,
        ),
        color: deserializeParam(
          data['color'],
          ParamType.String,
          false,
        ),
        reason: deserializeParam(
          data['reason'],
          ParamType.String,
          false,
        ),
        whatItIs: deserializeParam(
          data['whatItIs'],
          ParamType.String,
          false,
        ),
        whyUsed: deserializeParam(
          data['whyUsed'],
          ParamType.String,
          false,
        ),
        benefitsRisks: deserializeParam(
          data['benefitsRisks'],
          ParamType.String,
          false,
        ),
        relevance: deserializeParam(
          data['relevance'],
          ParamType.String,
          false,
        ),
        petFlag: deserializeParam(
          data['petFlag'],
          ParamType.String,
          false,
        ),
        uncertainty: deserializeParam(
          data['uncertainty'],
          ParamType.String,
          false,
        ),
        statusIdentity: deserializeParam(
          data['statusIdentity'],
          ParamType.String,
          false,
        ),
        statusRole: deserializeParam(
          data['statusRole'],
          ParamType.String,
          false,
        ),
        statusRisk: deserializeParam(
          data['statusRisk'],
          ParamType.String,
          false,
        ),
        statusExposure: deserializeParam(
          data['statusExposure'],
          ParamType.String,
          false,
        ),
        statusHumanReview: deserializeParam(
          data['statusHumanReview'],
          ParamType.String,
          false,
        ),
        checksText: deserializeParam(
          data['checksText'],
          ParamType.String,
          false,
        ),
        sources: deserializeStructParam<ClaimSourceRowStruct>(
          data['sources'],
          ParamType.DataStruct,
          true,
          structBuilder: ClaimSourceRowStruct.fromSerializableMap,
        ),
        children: deserializeStructParam<IngredientChildRowStruct>(
          data['children'],
          ParamType.DataStruct,
          true,
          structBuilder: IngredientChildRowStruct.fromSerializableMap,
        ),
        concernRank: deserializeParam(
          data['concernRank'],
          ParamType.int,
          false,
        ),
      );

  @override
  String toString() => 'IngredientRowStruct(${toMap()})';

  @override
  bool operator ==(Object other) {
    const listEquality = ListEquality();
    return other is IngredientRowStruct &&
        id == other.id &&
        position == other.position &&
        name == other.name &&
        labelText == other.labelText &&
        kind == other.kind &&
        role == other.role &&
        color == other.color &&
        reason == other.reason &&
        whatItIs == other.whatItIs &&
        whyUsed == other.whyUsed &&
        benefitsRisks == other.benefitsRisks &&
        relevance == other.relevance &&
        petFlag == other.petFlag &&
        uncertainty == other.uncertainty &&
        statusIdentity == other.statusIdentity &&
        statusRole == other.statusRole &&
        statusRisk == other.statusRisk &&
        statusExposure == other.statusExposure &&
        statusHumanReview == other.statusHumanReview &&
        checksText == other.checksText &&
        listEquality.equals(sources, other.sources) &&
        listEquality.equals(children, other.children) &&
        concernRank == other.concernRank;
  }

  @override
  int get hashCode => const ListEquality().hash([
        id,
        position,
        name,
        labelText,
        kind,
        role,
        color,
        reason,
        whatItIs,
        whyUsed,
        benefitsRisks,
        relevance,
        petFlag,
        uncertainty,
        statusIdentity,
        statusRole,
        statusRisk,
        statusExposure,
        statusHumanReview,
        checksText,
        const ListEquality().hash(sources),
        const ListEquality().hash(children),
        concernRank
      ]);
}

IngredientRowStruct createIngredientRowStruct({
  String? id,
  int? position,
  String? name,
  String? labelText,
  String? kind,
  String? role,
  String? color,
  String? reason,
  String? whatItIs,
  String? whyUsed,
  String? benefitsRisks,
  String? relevance,
  String? petFlag,
  String? uncertainty,
  String? statusIdentity,
  String? statusRole,
  String? statusRisk,
  String? statusExposure,
  String? statusHumanReview,
  String? checksText,
  int? concernRank,
  Map<String, dynamic> fieldValues = const {},
  bool clearUnsetFields = true,
  bool create = false,
  bool delete = false,
}) =>
    IngredientRowStruct(
      id: id,
      position: position,
      name: name,
      labelText: labelText,
      kind: kind,
      role: role,
      color: color,
      reason: reason,
      whatItIs: whatItIs,
      whyUsed: whyUsed,
      benefitsRisks: benefitsRisks,
      relevance: relevance,
      petFlag: petFlag,
      uncertainty: uncertainty,
      statusIdentity: statusIdentity,
      statusRole: statusRole,
      statusRisk: statusRisk,
      statusExposure: statusExposure,
      statusHumanReview: statusHumanReview,
      checksText: checksText,
      concernRank: concernRank,
      firestoreUtilData: FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
        delete: delete,
        fieldValues: fieldValues,
      ),
    );

IngredientRowStruct? updateIngredientRowStruct(
  IngredientRowStruct? ingredientRow, {
  bool clearUnsetFields = true,
  bool create = false,
}) =>
    ingredientRow
      ?..firestoreUtilData = FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
      );

void addIngredientRowStructData(
  Map<String, dynamic> firestoreData,
  IngredientRowStruct? ingredientRow,
  String fieldName, [
  bool forFieldValue = false,
]) {
  firestoreData.remove(fieldName);
  if (ingredientRow == null) {
    return;
  }
  if (ingredientRow.firestoreUtilData.delete) {
    firestoreData[fieldName] = FieldValue.delete();
    return;
  }
  final clearFields =
      !forFieldValue && ingredientRow.firestoreUtilData.clearUnsetFields;
  if (clearFields) {
    firestoreData[fieldName] = <String, dynamic>{};
  }
  final ingredientRowData =
      getIngredientRowFirestoreData(ingredientRow, forFieldValue);
  final nestedData =
      ingredientRowData.map((k, v) => MapEntry('$fieldName.$k', v));

  final mergeFields = ingredientRow.firestoreUtilData.create || clearFields;
  firestoreData
      .addAll(mergeFields ? mergeNestedFields(nestedData) : nestedData);
}

Map<String, dynamic> getIngredientRowFirestoreData(
  IngredientRowStruct? ingredientRow, [
  bool forFieldValue = false,
]) {
  if (ingredientRow == null) {
    return {};
  }
  final firestoreData = mapToFirestore(ingredientRow.toMap());

  // Add any Firestore field values
  mapToFirestore(ingredientRow.firestoreUtilData.fieldValues)
      .forEach((k, v) => firestoreData[k] = v);

  return forFieldValue ? mergeNestedFields(firestoreData) : firestoreData;
}

List<Map<String, dynamic>> getIngredientRowListFirestoreData(
  List<IngredientRowStruct>? ingredientRows,
) =>
    ingredientRows
        ?.map((e) => getIngredientRowFirestoreData(e, true))
        .toList() ??
    [];
