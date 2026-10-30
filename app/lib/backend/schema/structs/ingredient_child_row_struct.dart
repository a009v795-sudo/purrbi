// ignore_for_file: unnecessary_getters_setters

import 'package:cloud_firestore/cloud_firestore.dart' hide Type;

import '/backend/schema/util/firestore_util.dart';
import '/backend/schema/util/schema_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

/// Struct IngredientChildRow
class IngredientChildRowStruct extends FFFirebaseStruct {
  IngredientChildRowStruct({
    /// IngredientChildRow.id
    String? id,

    /// IngredientChildRow.name
    String? name,

    /// IngredientChildRow.labelText
    String? labelText,

    /// IngredientChildRow.role
    String? role,

    /// IngredientChildRow.color
    String? color,

    /// IngredientChildRow.reason
    String? reason,

    /// IngredientChildRow.whatItIs
    String? whatItIs,

    /// IngredientChildRow.whyUsed
    String? whyUsed,

    /// IngredientChildRow.benefitsRisks
    String? benefitsRisks,

    /// IngredientChildRow.uncertainty
    String? uncertainty,

    /// IngredientChildRow.checksText
    String? checksText,

    /// IngredientChildRow.sources
    List<ClaimSourceRowStruct>? sources,
    FirestoreUtilData firestoreUtilData = const FirestoreUtilData(),
  })  : _id = id,
        _name = name,
        _labelText = labelText,
        _role = role,
        _color = color,
        _reason = reason,
        _whatItIs = whatItIs,
        _whyUsed = whyUsed,
        _benefitsRisks = benefitsRisks,
        _uncertainty = uncertainty,
        _checksText = checksText,
        _sources = sources,
        super(firestoreUtilData);

  // "id" field.
  String? _id;
  String get id => _id ?? '';
  set id(String? val) => _id = val;

  bool hasId() => _id != null;

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

  // "uncertainty" field.
  String? _uncertainty;
  String get uncertainty => _uncertainty ?? '';
  set uncertainty(String? val) => _uncertainty = val;

  bool hasUncertainty() => _uncertainty != null;

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

  static IngredientChildRowStruct fromMap(Map<String, dynamic> data) =>
      IngredientChildRowStruct(
        id: data['id'] as String?,
        name: data['name'] as String?,
        labelText: data['labelText'] as String?,
        role: data['role'] as String?,
        color: data['color'] as String?,
        reason: data['reason'] as String?,
        whatItIs: data['whatItIs'] as String?,
        whyUsed: data['whyUsed'] as String?,
        benefitsRisks: data['benefitsRisks'] as String?,
        uncertainty: data['uncertainty'] as String?,
        checksText: data['checksText'] as String?,
        sources: getStructList(
          data['sources'],
          ClaimSourceRowStruct.fromMap,
        ),
      );

  static IngredientChildRowStruct? maybeFromMap(dynamic data) => data is Map
      ? IngredientChildRowStruct.fromMap(data.cast<String, dynamic>())
      : null;

  Map<String, dynamic> toMap() => {
        'id': _id,
        'name': _name,
        'labelText': _labelText,
        'role': _role,
        'color': _color,
        'reason': _reason,
        'whatItIs': _whatItIs,
        'whyUsed': _whyUsed,
        'benefitsRisks': _benefitsRisks,
        'uncertainty': _uncertainty,
        'checksText': _checksText,
        'sources': _sources?.map((e) => e.toMap()).toList(),
      }.withoutNulls;

  @override
  Map<String, dynamic> toSerializableMap() => {
        'id': serializeParam(
          _id,
          ParamType.String,
        ),
        'name': serializeParam(
          _name,
          ParamType.String,
        ),
        'labelText': serializeParam(
          _labelText,
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
        'uncertainty': serializeParam(
          _uncertainty,
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
      }.withoutNulls;

  static IngredientChildRowStruct fromSerializableMap(
          Map<String, dynamic> data) =>
      IngredientChildRowStruct(
        id: deserializeParam(
          data['id'],
          ParamType.String,
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
        uncertainty: deserializeParam(
          data['uncertainty'],
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
      );

  @override
  String toString() => 'IngredientChildRowStruct(${toMap()})';

  @override
  bool operator ==(Object other) {
    const listEquality = ListEquality();
    return other is IngredientChildRowStruct &&
        id == other.id &&
        name == other.name &&
        labelText == other.labelText &&
        role == other.role &&
        color == other.color &&
        reason == other.reason &&
        whatItIs == other.whatItIs &&
        whyUsed == other.whyUsed &&
        benefitsRisks == other.benefitsRisks &&
        uncertainty == other.uncertainty &&
        checksText == other.checksText &&
        listEquality.equals(sources, other.sources);
  }

  @override
  int get hashCode => const ListEquality().hash([
        id,
        name,
        labelText,
        role,
        color,
        reason,
        whatItIs,
        whyUsed,
        benefitsRisks,
        uncertainty,
        checksText,
        const ListEquality().hash(sources)
      ]);
}

IngredientChildRowStruct createIngredientChildRowStruct({
  String? id,
  String? name,
  String? labelText,
  String? role,
  String? color,
  String? reason,
  String? whatItIs,
  String? whyUsed,
  String? benefitsRisks,
  String? uncertainty,
  String? checksText,
  Map<String, dynamic> fieldValues = const {},
  bool clearUnsetFields = true,
  bool create = false,
  bool delete = false,
}) =>
    IngredientChildRowStruct(
      id: id,
      name: name,
      labelText: labelText,
      role: role,
      color: color,
      reason: reason,
      whatItIs: whatItIs,
      whyUsed: whyUsed,
      benefitsRisks: benefitsRisks,
      uncertainty: uncertainty,
      checksText: checksText,
      firestoreUtilData: FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
        delete: delete,
        fieldValues: fieldValues,
      ),
    );

IngredientChildRowStruct? updateIngredientChildRowStruct(
  IngredientChildRowStruct? ingredientChildRow, {
  bool clearUnsetFields = true,
  bool create = false,
}) =>
    ingredientChildRow
      ?..firestoreUtilData = FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
      );

void addIngredientChildRowStructData(
  Map<String, dynamic> firestoreData,
  IngredientChildRowStruct? ingredientChildRow,
  String fieldName, [
  bool forFieldValue = false,
]) {
  firestoreData.remove(fieldName);
  if (ingredientChildRow == null) {
    return;
  }
  if (ingredientChildRow.firestoreUtilData.delete) {
    firestoreData[fieldName] = FieldValue.delete();
    return;
  }
  final clearFields =
      !forFieldValue && ingredientChildRow.firestoreUtilData.clearUnsetFields;
  if (clearFields) {
    firestoreData[fieldName] = <String, dynamic>{};
  }
  final ingredientChildRowData =
      getIngredientChildRowFirestoreData(ingredientChildRow, forFieldValue);
  final nestedData =
      ingredientChildRowData.map((k, v) => MapEntry('$fieldName.$k', v));

  final mergeFields =
      ingredientChildRow.firestoreUtilData.create || clearFields;
  firestoreData
      .addAll(mergeFields ? mergeNestedFields(nestedData) : nestedData);
}

Map<String, dynamic> getIngredientChildRowFirestoreData(
  IngredientChildRowStruct? ingredientChildRow, [
  bool forFieldValue = false,
]) {
  if (ingredientChildRow == null) {
    return {};
  }
  final firestoreData = mapToFirestore(ingredientChildRow.toMap());

  // Add any Firestore field values
  mapToFirestore(ingredientChildRow.firestoreUtilData.fieldValues)
      .forEach((k, v) => firestoreData[k] = v);

  return forFieldValue ? mergeNestedFields(firestoreData) : firestoreData;
}

List<Map<String, dynamic>> getIngredientChildRowListFirestoreData(
  List<IngredientChildRowStruct>? ingredientChildRows,
) =>
    ingredientChildRows
        ?.map((e) => getIngredientChildRowFirestoreData(e, true))
        .toList() ??
    [];
