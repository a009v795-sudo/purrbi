// ignore_for_file: unnecessary_getters_setters

import '/backend/schema/util/schema_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

class HelpSupportModelStruct extends BaseStruct {
  HelpSupportModelStruct({
    String? title,
    String? description,
  })  : _title = title,
        _description = description;

  // "title" field.
  String? _title;
  String get title => _title ?? '';
  set title(String? val) => _title = val;

  bool hasTitle() => _title != null;

  // "description" field.
  String? _description;
  String get description => _description ?? '';
  set description(String? val) => _description = val;

  bool hasDescription() => _description != null;

  static HelpSupportModelStruct fromMap(Map<String, dynamic> data) =>
      HelpSupportModelStruct(
        title: data['title'] as String?,
        description: data['description'] as String?,
      );

  static HelpSupportModelStruct? maybeFromMap(dynamic data) => data is Map
      ? HelpSupportModelStruct.fromMap(data.cast<String, dynamic>())
      : null;

  Map<String, dynamic> toMap() => {
        'title': _title,
        'description': _description,
      }.withoutNulls;

  @override
  Map<String, dynamic> toSerializableMap() => {
        'title': serializeParam(
          _title,
          ParamType.String,
        ),
        'description': serializeParam(
          _description,
          ParamType.String,
        ),
      }.withoutNulls;

  static HelpSupportModelStruct fromSerializableMap(
          Map<String, dynamic> data) =>
      HelpSupportModelStruct(
        title: deserializeParam(
          data['title'],
          ParamType.String,
          false,
        ),
        description: deserializeParam(
          data['description'],
          ParamType.String,
          false,
        ),
      );

  @override
  String toString() => 'HelpSupportModelStruct(${toMap()})';

  @override
  bool operator ==(Object other) {
    return other is HelpSupportModelStruct &&
        title == other.title &&
        description == other.description;
  }

  @override
  int get hashCode => const ListEquality().hash([title, description]);
}

HelpSupportModelStruct createHelpSupportModelStruct({
  String? title,
  String? description,
}) =>
    HelpSupportModelStruct(
      title: title,
      description: description,
    );
