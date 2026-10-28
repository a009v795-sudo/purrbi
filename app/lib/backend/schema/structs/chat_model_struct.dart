// ignore_for_file: unnecessary_getters_setters

import '/backend/schema/util/schema_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

class ChatModelStruct extends BaseStruct {
  ChatModelStruct({
    String? userMessage,
    String? responce,
  })  : _userMessage = userMessage,
        _responce = responce;

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
}) =>
    ChatModelStruct(
      userMessage: userMessage,
      responce: responce,
    );
