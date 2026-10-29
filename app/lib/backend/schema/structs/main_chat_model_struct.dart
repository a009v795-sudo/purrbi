// ignore_for_file: unnecessary_getters_setters

import 'package:cloud_firestore/cloud_firestore.dart' hide Type;

import '/backend/schema/util/firestore_util.dart';
import '/backend/schema/util/schema_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

class MainChatModelStruct extends FFFirebaseStruct {
  MainChatModelStruct({
    int? id,
    String? title,
    List<ChatModelStruct>? chatModelList,
    FirestoreUtilData firestoreUtilData = const FirestoreUtilData(),
  })  : _id = id,
        _title = title,
        _chatModelList = chatModelList,
        super(firestoreUtilData);

  // "id" field.
  int? _id;
  int get id => _id ?? 0;
  set id(int? val) => _id = val;

  void incrementId(int amount) => id = id + amount;

  bool hasId() => _id != null;

  // "title" field.
  String? _title;
  String get title => _title ?? '';
  set title(String? val) => _title = val;

  bool hasTitle() => _title != null;

  // "chatModelList" field.
  List<ChatModelStruct>? _chatModelList;
  List<ChatModelStruct> get chatModelList => _chatModelList ?? const [];
  set chatModelList(List<ChatModelStruct>? val) => _chatModelList = val;

  void updateChatModelList(Function(List<ChatModelStruct>) updateFn) {
    updateFn(_chatModelList ??= []);
  }

  bool hasChatModelList() => _chatModelList != null;

  static MainChatModelStruct fromMap(Map<String, dynamic> data) =>
      MainChatModelStruct(
        id: castToType<int>(data['id']),
        title: data['title'] as String?,
        chatModelList: getStructList(
          data['chatModelList'],
          ChatModelStruct.fromMap,
        ),
      );

  static MainChatModelStruct? maybeFromMap(dynamic data) => data is Map
      ? MainChatModelStruct.fromMap(data.cast<String, dynamic>())
      : null;

  Map<String, dynamic> toMap() => {
        'id': _id,
        'title': _title,
        'chatModelList': _chatModelList?.map((e) => e.toMap()).toList(),
      }.withoutNulls;

  @override
  Map<String, dynamic> toSerializableMap() => {
        'id': serializeParam(
          _id,
          ParamType.int,
        ),
        'title': serializeParam(
          _title,
          ParamType.String,
        ),
        'chatModelList': serializeParam(
          _chatModelList,
          ParamType.DataStruct,
          isList: true,
        ),
      }.withoutNulls;

  static MainChatModelStruct fromSerializableMap(Map<String, dynamic> data) =>
      MainChatModelStruct(
        id: deserializeParam(
          data['id'],
          ParamType.int,
          false,
        ),
        title: deserializeParam(
          data['title'],
          ParamType.String,
          false,
        ),
        chatModelList: deserializeStructParam<ChatModelStruct>(
          data['chatModelList'],
          ParamType.DataStruct,
          true,
          structBuilder: ChatModelStruct.fromSerializableMap,
        ),
      );

  @override
  String toString() => 'MainChatModelStruct(${toMap()})';

  @override
  bool operator ==(Object other) {
    const listEquality = ListEquality();
    return other is MainChatModelStruct &&
        id == other.id &&
        title == other.title &&
        listEquality.equals(chatModelList, other.chatModelList);
  }

  @override
  int get hashCode => const ListEquality()
      .hash([id, title, const ListEquality().hash(chatModelList)]);
}

MainChatModelStruct createMainChatModelStruct({
  int? id,
  String? title,
  Map<String, dynamic> fieldValues = const {},
  bool clearUnsetFields = true,
  bool create = false,
  bool delete = false,
}) =>
    MainChatModelStruct(
      id: id,
      title: title,
      firestoreUtilData: FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
        delete: delete,
        fieldValues: fieldValues,
      ),
    );

MainChatModelStruct? updateMainChatModelStruct(
  MainChatModelStruct? mainChatModel, {
  bool clearUnsetFields = true,
  bool create = false,
}) =>
    mainChatModel
      ?..firestoreUtilData = FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
      );

void addMainChatModelStructData(
  Map<String, dynamic> firestoreData,
  MainChatModelStruct? mainChatModel,
  String fieldName, [
  bool forFieldValue = false,
]) {
  firestoreData.remove(fieldName);
  if (mainChatModel == null) {
    return;
  }
  if (mainChatModel.firestoreUtilData.delete) {
    firestoreData[fieldName] = FieldValue.delete();
    return;
  }
  final clearFields =
      !forFieldValue && mainChatModel.firestoreUtilData.clearUnsetFields;
  if (clearFields) {
    firestoreData[fieldName] = <String, dynamic>{};
  }
  final mainChatModelData =
      getMainChatModelFirestoreData(mainChatModel, forFieldValue);
  final nestedData =
      mainChatModelData.map((k, v) => MapEntry('$fieldName.$k', v));

  final mergeFields = mainChatModel.firestoreUtilData.create || clearFields;
  firestoreData
      .addAll(mergeFields ? mergeNestedFields(nestedData) : nestedData);
}

Map<String, dynamic> getMainChatModelFirestoreData(
  MainChatModelStruct? mainChatModel, [
  bool forFieldValue = false,
]) {
  if (mainChatModel == null) {
    return {};
  }
  final firestoreData = mapToFirestore(mainChatModel.toMap());

  // Add any Firestore field values
  mapToFirestore(mainChatModel.firestoreUtilData.fieldValues)
      .forEach((k, v) => firestoreData[k] = v);

  return forFieldValue ? mergeNestedFields(firestoreData) : firestoreData;
}

List<Map<String, dynamic>> getMainChatModelListFirestoreData(
  List<MainChatModelStruct>? mainChatModels,
) =>
    mainChatModels
        ?.map((e) => getMainChatModelFirestoreData(e, true))
        .toList() ??
    [];
