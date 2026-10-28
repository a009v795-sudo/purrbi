// ignore_for_file: unnecessary_getters_setters

import '/backend/schema/util/schema_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

class MainChatModelStruct extends BaseStruct {
  MainChatModelStruct({
    int? id,
    String? title,
    List<ChatModelStruct>? chatModelList,
  })  : _id = id,
        _title = title,
        _chatModelList = chatModelList;

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
}) =>
    MainChatModelStruct(
      id: id,
      title: title,
    );
