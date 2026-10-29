// ignore_for_file: unnecessary_getters_setters

import 'package:cloud_firestore/cloud_firestore.dart' hide Type;

import '/backend/schema/util/firestore_util.dart';
import '/backend/schema/util/schema_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

/// Struct NutritionLine
class NutritionLineStruct extends FFFirebaseStruct {
  NutritionLineStruct({
    /// NutritionLine.label
    String? label,

    /// NutritionLine.qualifier
    String? qualifier,

    /// NutritionLine.value
    double? value,

    /// NutritionLine.unit
    String? unit,

    /// NutritionLine.display
    String? display,

    /// NutritionLine.dryMatter
    String? dryMatter,

    /// NutritionLine.meaning
    String? meaning,

    /// NutritionLine.context
    String? context,

    /// NutritionLine.contextSource
    String? contextSource,
    FirestoreUtilData firestoreUtilData = const FirestoreUtilData(),
  })  : _label = label,
        _qualifier = qualifier,
        _value = value,
        _unit = unit,
        _display = display,
        _dryMatter = dryMatter,
        _meaning = meaning,
        _context = context,
        _contextSource = contextSource,
        super(firestoreUtilData);

  // "label" field.
  String? _label;
  String get label => _label ?? '';
  set label(String? val) => _label = val;

  bool hasLabel() => _label != null;

  // "qualifier" field.
  String? _qualifier;
  String get qualifier => _qualifier ?? '';
  set qualifier(String? val) => _qualifier = val;

  bool hasQualifier() => _qualifier != null;

  // "value" field.
  double? _value;
  double get value => _value ?? 0.0;
  set value(double? val) => _value = val;

  void incrementValue(double amount) => value = value + amount;

  bool hasValue() => _value != null;

  // "unit" field.
  String? _unit;
  String get unit => _unit ?? '';
  set unit(String? val) => _unit = val;

  bool hasUnit() => _unit != null;

  // "display" field.
  String? _display;
  String get display => _display ?? '';
  set display(String? val) => _display = val;

  bool hasDisplay() => _display != null;

  // "dryMatter" field.
  String? _dryMatter;
  String get dryMatter => _dryMatter ?? '';
  set dryMatter(String? val) => _dryMatter = val;

  bool hasDryMatter() => _dryMatter != null;

  // "meaning" field.
  String? _meaning;
  String get meaning => _meaning ?? '';
  set meaning(String? val) => _meaning = val;

  bool hasMeaning() => _meaning != null;

  // "context" field.
  String? _context;
  String get context => _context ?? '';
  set context(String? val) => _context = val;

  bool hasContext() => _context != null;

  // "contextSource" field.
  String? _contextSource;
  String get contextSource => _contextSource ?? '';
  set contextSource(String? val) => _contextSource = val;

  bool hasContextSource() => _contextSource != null;

  static NutritionLineStruct fromMap(Map<String, dynamic> data) =>
      NutritionLineStruct(
        label: data['label'] as String?,
        qualifier: data['qualifier'] as String?,
        value: castToType<double>(data['value']),
        unit: data['unit'] as String?,
        display: data['display'] as String?,
        dryMatter: data['dryMatter'] as String?,
        meaning: data['meaning'] as String?,
        context: data['context'] as String?,
        contextSource: data['contextSource'] as String?,
      );

  static NutritionLineStruct? maybeFromMap(dynamic data) => data is Map
      ? NutritionLineStruct.fromMap(data.cast<String, dynamic>())
      : null;

  Map<String, dynamic> toMap() => {
        'label': _label,
        'qualifier': _qualifier,
        'value': _value,
        'unit': _unit,
        'display': _display,
        'dryMatter': _dryMatter,
        'meaning': _meaning,
        'context': _context,
        'contextSource': _contextSource,
      }.withoutNulls;

  @override
  Map<String, dynamic> toSerializableMap() => {
        'label': serializeParam(
          _label,
          ParamType.String,
        ),
        'qualifier': serializeParam(
          _qualifier,
          ParamType.String,
        ),
        'value': serializeParam(
          _value,
          ParamType.double,
        ),
        'unit': serializeParam(
          _unit,
          ParamType.String,
        ),
        'display': serializeParam(
          _display,
          ParamType.String,
        ),
        'dryMatter': serializeParam(
          _dryMatter,
          ParamType.String,
        ),
        'meaning': serializeParam(
          _meaning,
          ParamType.String,
        ),
        'context': serializeParam(
          _context,
          ParamType.String,
        ),
        'contextSource': serializeParam(
          _contextSource,
          ParamType.String,
        ),
      }.withoutNulls;

  static NutritionLineStruct fromSerializableMap(Map<String, dynamic> data) =>
      NutritionLineStruct(
        label: deserializeParam(
          data['label'],
          ParamType.String,
          false,
        ),
        qualifier: deserializeParam(
          data['qualifier'],
          ParamType.String,
          false,
        ),
        value: deserializeParam(
          data['value'],
          ParamType.double,
          false,
        ),
        unit: deserializeParam(
          data['unit'],
          ParamType.String,
          false,
        ),
        display: deserializeParam(
          data['display'],
          ParamType.String,
          false,
        ),
        dryMatter: deserializeParam(
          data['dryMatter'],
          ParamType.String,
          false,
        ),
        meaning: deserializeParam(
          data['meaning'],
          ParamType.String,
          false,
        ),
        context: deserializeParam(
          data['context'],
          ParamType.String,
          false,
        ),
        contextSource: deserializeParam(
          data['contextSource'],
          ParamType.String,
          false,
        ),
      );

  @override
  String toString() => 'NutritionLineStruct(${toMap()})';

  @override
  bool operator ==(Object other) {
    return other is NutritionLineStruct &&
        label == other.label &&
        qualifier == other.qualifier &&
        value == other.value &&
        unit == other.unit &&
        display == other.display &&
        dryMatter == other.dryMatter &&
        meaning == other.meaning &&
        context == other.context &&
        contextSource == other.contextSource;
  }

  @override
  int get hashCode => const ListEquality().hash([
        label,
        qualifier,
        value,
        unit,
        display,
        dryMatter,
        meaning,
        context,
        contextSource
      ]);
}

NutritionLineStruct createNutritionLineStruct({
  String? label,
  String? qualifier,
  double? value,
  String? unit,
  String? display,
  String? dryMatter,
  String? meaning,
  String? context,
  String? contextSource,
  Map<String, dynamic> fieldValues = const {},
  bool clearUnsetFields = true,
  bool create = false,
  bool delete = false,
}) =>
    NutritionLineStruct(
      label: label,
      qualifier: qualifier,
      value: value,
      unit: unit,
      display: display,
      dryMatter: dryMatter,
      meaning: meaning,
      context: context,
      contextSource: contextSource,
      firestoreUtilData: FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
        delete: delete,
        fieldValues: fieldValues,
      ),
    );

NutritionLineStruct? updateNutritionLineStruct(
  NutritionLineStruct? nutritionLine, {
  bool clearUnsetFields = true,
  bool create = false,
}) =>
    nutritionLine
      ?..firestoreUtilData = FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
      );

void addNutritionLineStructData(
  Map<String, dynamic> firestoreData,
  NutritionLineStruct? nutritionLine,
  String fieldName, [
  bool forFieldValue = false,
]) {
  firestoreData.remove(fieldName);
  if (nutritionLine == null) {
    return;
  }
  if (nutritionLine.firestoreUtilData.delete) {
    firestoreData[fieldName] = FieldValue.delete();
    return;
  }
  final clearFields =
      !forFieldValue && nutritionLine.firestoreUtilData.clearUnsetFields;
  if (clearFields) {
    firestoreData[fieldName] = <String, dynamic>{};
  }
  final nutritionLineData =
      getNutritionLineFirestoreData(nutritionLine, forFieldValue);
  final nestedData =
      nutritionLineData.map((k, v) => MapEntry('$fieldName.$k', v));

  final mergeFields = nutritionLine.firestoreUtilData.create || clearFields;
  firestoreData
      .addAll(mergeFields ? mergeNestedFields(nestedData) : nestedData);
}

Map<String, dynamic> getNutritionLineFirestoreData(
  NutritionLineStruct? nutritionLine, [
  bool forFieldValue = false,
]) {
  if (nutritionLine == null) {
    return {};
  }
  final firestoreData = mapToFirestore(nutritionLine.toMap());

  // Add any Firestore field values
  mapToFirestore(nutritionLine.firestoreUtilData.fieldValues)
      .forEach((k, v) => firestoreData[k] = v);

  return forFieldValue ? mergeNestedFields(firestoreData) : firestoreData;
}

List<Map<String, dynamic>> getNutritionLineListFirestoreData(
  List<NutritionLineStruct>? nutritionLines,
) =>
    nutritionLines
        ?.map((e) => getNutritionLineFirestoreData(e, true))
        .toList() ??
    [];
