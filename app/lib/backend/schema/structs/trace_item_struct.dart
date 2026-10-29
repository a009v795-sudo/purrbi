// ignore_for_file: unnecessary_getters_setters

import 'package:cloud_firestore/cloud_firestore.dart' hide Type;

import '/backend/schema/util/firestore_util.dart';
import '/backend/schema/util/schema_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

/// Struct TraceItem
class TraceItemStruct extends FFFirebaseStruct {
  TraceItemStruct({
    /// TraceItem.input
    String? input,

    /// TraceItem.value
    String? value,

    /// TraceItem.rule
    String? rule,

    /// TraceItem.effect
    String? effect,
    FirestoreUtilData firestoreUtilData = const FirestoreUtilData(),
  })  : _input = input,
        _value = value,
        _rule = rule,
        _effect = effect,
        super(firestoreUtilData);

  // "input" field.
  String? _input;
  String get input => _input ?? '';
  set input(String? val) => _input = val;

  bool hasInput() => _input != null;

  // "value" field.
  String? _value;
  String get value => _value ?? '';
  set value(String? val) => _value = val;

  bool hasValue() => _value != null;

  // "rule" field.
  String? _rule;
  String get rule => _rule ?? '';
  set rule(String? val) => _rule = val;

  bool hasRule() => _rule != null;

  // "effect" field.
  String? _effect;
  String get effect => _effect ?? '';
  set effect(String? val) => _effect = val;

  bool hasEffect() => _effect != null;

  static TraceItemStruct fromMap(Map<String, dynamic> data) => TraceItemStruct(
        input: data['input'] as String?,
        value: data['value'] as String?,
        rule: data['rule'] as String?,
        effect: data['effect'] as String?,
      );

  static TraceItemStruct? maybeFromMap(dynamic data) => data is Map
      ? TraceItemStruct.fromMap(data.cast<String, dynamic>())
      : null;

  Map<String, dynamic> toMap() => {
        'input': _input,
        'value': _value,
        'rule': _rule,
        'effect': _effect,
      }.withoutNulls;

  @override
  Map<String, dynamic> toSerializableMap() => {
        'input': serializeParam(
          _input,
          ParamType.String,
        ),
        'value': serializeParam(
          _value,
          ParamType.String,
        ),
        'rule': serializeParam(
          _rule,
          ParamType.String,
        ),
        'effect': serializeParam(
          _effect,
          ParamType.String,
        ),
      }.withoutNulls;

  static TraceItemStruct fromSerializableMap(Map<String, dynamic> data) =>
      TraceItemStruct(
        input: deserializeParam(
          data['input'],
          ParamType.String,
          false,
        ),
        value: deserializeParam(
          data['value'],
          ParamType.String,
          false,
        ),
        rule: deserializeParam(
          data['rule'],
          ParamType.String,
          false,
        ),
        effect: deserializeParam(
          data['effect'],
          ParamType.String,
          false,
        ),
      );

  @override
  String toString() => 'TraceItemStruct(${toMap()})';

  @override
  bool operator ==(Object other) {
    return other is TraceItemStruct &&
        input == other.input &&
        value == other.value &&
        rule == other.rule &&
        effect == other.effect;
  }

  @override
  int get hashCode => const ListEquality().hash([input, value, rule, effect]);
}

TraceItemStruct createTraceItemStruct({
  String? input,
  String? value,
  String? rule,
  String? effect,
  Map<String, dynamic> fieldValues = const {},
  bool clearUnsetFields = true,
  bool create = false,
  bool delete = false,
}) =>
    TraceItemStruct(
      input: input,
      value: value,
      rule: rule,
      effect: effect,
      firestoreUtilData: FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
        delete: delete,
        fieldValues: fieldValues,
      ),
    );

TraceItemStruct? updateTraceItemStruct(
  TraceItemStruct? traceItem, {
  bool clearUnsetFields = true,
  bool create = false,
}) =>
    traceItem
      ?..firestoreUtilData = FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
      );

void addTraceItemStructData(
  Map<String, dynamic> firestoreData,
  TraceItemStruct? traceItem,
  String fieldName, [
  bool forFieldValue = false,
]) {
  firestoreData.remove(fieldName);
  if (traceItem == null) {
    return;
  }
  if (traceItem.firestoreUtilData.delete) {
    firestoreData[fieldName] = FieldValue.delete();
    return;
  }
  final clearFields =
      !forFieldValue && traceItem.firestoreUtilData.clearUnsetFields;
  if (clearFields) {
    firestoreData[fieldName] = <String, dynamic>{};
  }
  final traceItemData = getTraceItemFirestoreData(traceItem, forFieldValue);
  final nestedData = traceItemData.map((k, v) => MapEntry('$fieldName.$k', v));

  final mergeFields = traceItem.firestoreUtilData.create || clearFields;
  firestoreData
      .addAll(mergeFields ? mergeNestedFields(nestedData) : nestedData);
}

Map<String, dynamic> getTraceItemFirestoreData(
  TraceItemStruct? traceItem, [
  bool forFieldValue = false,
]) {
  if (traceItem == null) {
    return {};
  }
  final firestoreData = mapToFirestore(traceItem.toMap());

  // Add any Firestore field values
  mapToFirestore(traceItem.firestoreUtilData.fieldValues)
      .forEach((k, v) => firestoreData[k] = v);

  return forFieldValue ? mergeNestedFields(firestoreData) : firestoreData;
}

List<Map<String, dynamic>> getTraceItemListFirestoreData(
  List<TraceItemStruct>? traceItems,
) =>
    traceItems?.map((e) => getTraceItemFirestoreData(e, true)).toList() ?? [];
