// ignore_for_file: unnecessary_getters_setters

import 'package:cloud_firestore/cloud_firestore.dart' hide Type;

import '/backend/schema/util/firestore_util.dart';
import '/backend/schema/util/schema_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

class ChatModelStruct extends FFFirebaseStruct {
  ChatModelStruct({
    String? userMessage,
    String? responce,
    FirestoreUtilData firestoreUtilData = const FirestoreUtilData(),
  })  : _userMessage = userMessage,
        _responce = responce,
        super(firestoreUtilData);

  // "UserMessage" field.
  String? _userMessage;
  String get userMessage => _userMessage ?? '';
  set userMessage(String? val) => _userMessage = val;

  bool hasUserMessage() => _userMessage != null;

  // "responce" field.
  String? _responce;
  String get responce => _responce ?? '';
  set responce(String? val) => _responce = val;

  bool hasResponce() => _responce != null;

  static ChatModelStruct fromMap(Map<String, dynamic> data) => ChatModelStruct(
        userMessage: data['UserMessage'] as String?,
        responce: data['responce'] as String?,
      );

  static ChatModelStruct? maybeFromMap(dynamic data) => data is Map
      ? ChatModelStruct.fromMap(data.cast<String, dynamic>())
      : null;

  Map<String, dynamic> toMap() => {
        'UserMessage': _userMessage,
        'responce': _responce,
      }.withoutNulls;

  @override
  Map<String, dynamic> toSerializableMap() => {
        'UserMessage': serializeParam(
          _userMessage,
          ParamType.String,
        ),
        'responce': serializeParam(
          _responce,
          ParamType.String,
        ),
      }.withoutNulls;

  static ChatModelStruct fromSerializableMap(Map<String, dynamic> data) =>
      ChatModelStruct(
        userMessage: deserializeParam(
          data['UserMessage'],
          ParamType.String,
          false,
        ),
        responce: deserializeParam(
          data['responce'],
          ParamType.String,
          false,
        ),
      );

  @override
  String toString() => 'ChatModelStruct(${toMap()})';

  @override
  bool operator ==(Object other) {
    return other is ChatModelStruct &&
        userMessage == other.userMessage &&
        responce == other.responce;
  }

  @override
  int get hashCode => const ListEquality().hash([userMessage, responce]);
}

ChatModelStruct createChatModelStruct({
  String? userMessage,
  String? responce,
  Map<String, dynamic> fieldValues = const {},
  bool clearUnsetFields = true,
  bool create = false,
  bool delete = false,
}) =>
    ChatModelStruct(
      userMessage: userMessage,
      responce: responce,
      firestoreUtilData: FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
        delete: delete,
        fieldValues: fieldValues,
      ),
    );

ChatModelStruct? updateChatModelStruct(
  ChatModelStruct? chatModel, {
  bool clearUnsetFields = true,
  bool create = false,
}) =>
    chatModel
      ?..firestoreUtilData = FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
      );

void addChatModelStructData(
  Map<String, dynamic> firestoreData,
  ChatModelStruct? chatModel,
  String fieldName, [
  bool forFieldValue = false,
]) {
  firestoreData.remove(fieldName);
  if (chatModel == null) {
    return;
  }
  if (chatModel.firestoreUtilData.delete) {
    firestoreData[fieldName] = FieldValue.delete();
    return;
  }
  final clearFields =
      !forFieldValue && chatModel.firestoreUtilData.clearUnsetFields;
  if (clearFields) {
    firestoreData[fieldName] = <String, dynamic>{};
  }
  final chatModelData = getChatModelFirestoreData(chatModel, forFieldValue);
  final nestedData = chatModelData.map((k, v) => MapEntry('$fieldName.$k', v));

  final mergeFields = chatModel.firestoreUtilData.create || clearFields;
  firestoreData
      .addAll(mergeFields ? mergeNestedFields(nestedData) : nestedData);
}

Map<String, dynamic> getChatModelFirestoreData(
  ChatModelStruct? chatModel, [
  bool forFieldValue = false,
]) {
  if (chatModel == null) {
    return {};
  }
  final firestoreData = mapToFirestore(chatModel.toMap());

  // Add any Firestore field values
  mapToFirestore(chatModel.firestoreUtilData.fieldValues)
      .forEach((k, v) => firestoreData[k] = v);

  return forFieldValue ? mergeNestedFields(firestoreData) : firestoreData;
}

List<Map<String, dynamic>> getChatModelListFirestoreData(
  List<ChatModelStruct>? chatModels,
) =>
    chatModels?.map((e) => getChatModelFirestoreData(e, true)).toList() ?? [];
