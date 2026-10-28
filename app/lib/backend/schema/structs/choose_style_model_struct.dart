// ignore_for_file: unnecessary_getters_setters

import '/backend/schema/util/schema_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

class ChooseStyleModelStruct extends BaseStruct {
  ChooseStyleModelStruct({
    String? image,
    String? name,
  })  : _image = image,
        _name = name;

  // "image" field.
  String? _image;
  String get image => _image ?? '';
  set image(String? val) => _image = val;

  bool hasImage() => _image != null;

  // "name" field.
  String? _name;
  String get name => _name ?? '';
  set name(String? val) => _name = val;

  bool hasName() => _name != null;

  static ChooseStyleModelStruct fromMap(Map<String, dynamic> data) =>
      ChooseStyleModelStruct(
        image: data['image'] as String?,
        name: data['name'] as String?,
      );

  static ChooseStyleModelStruct? maybeFromMap(dynamic data) => data is Map
      ? ChooseStyleModelStruct.fromMap(data.cast<String, dynamic>())
      : null;

  Map<String, dynamic> toMap() => {
        'image': _image,
        'name': _name,
      }.withoutNulls;

  @override
  Map<String, dynamic> toSerializableMap() => {
        'image': serializeParam(
          _image,
          ParamType.String,
        ),
        'name': serializeParam(
          _name,
          ParamType.String,
        ),
      }.withoutNulls;

  static ChooseStyleModelStruct fromSerializableMap(
          Map<String, dynamic> data) =>
      ChooseStyleModelStruct(
        image: deserializeParam(
          data['image'],
          ParamType.String,
          false,
        ),
        name: deserializeParam(
          data['name'],
          ParamType.String,
          false,
        ),
      );

  @override
  String toString() => 'ChooseStyleModelStruct(${toMap()})';

  @override
  bool operator ==(Object other) {
    return other is ChooseStyleModelStruct &&
        image == other.image &&
        name == other.name;
  }

  @override
  int get hashCode => const ListEquality().hash([image, name]);
}

ChooseStyleModelStruct createChooseStyleModelStruct({
  String? image,
  String? name,
}) =>
    ChooseStyleModelStruct(
      image: image,
      name: name,
    );
