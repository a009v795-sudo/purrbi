// ignore_for_file: unnecessary_getters_setters

import '/backend/schema/util/schema_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

class BolgModelStruct extends BaseStruct {
  BolgModelStruct({
    String? image,
    String? name,
    String? desc,
    String? time,
  })  : _image = image,
        _name = name,
        _desc = desc,
        _time = time;

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

  // "desc" field.
  String? _desc;
  String get desc => _desc ?? '';
  set desc(String? val) => _desc = val;

  bool hasDesc() => _desc != null;

  // "time" field.
  String? _time;
  String get time => _time ?? '';
  set time(String? val) => _time = val;

  bool hasTime() => _time != null;

  static BolgModelStruct fromMap(Map<String, dynamic> data) => BolgModelStruct(
        image: data['image'] as String?,
        name: data['name'] as String?,
        desc: data['desc'] as String?,
        time: data['time'] as String?,
      );

  static BolgModelStruct? maybeFromMap(dynamic data) => data is Map
      ? BolgModelStruct.fromMap(data.cast<String, dynamic>())
      : null;

  Map<String, dynamic> toMap() => {
        'image': _image,
        'name': _name,
        'desc': _desc,
        'time': _time,
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
        'desc': serializeParam(
          _desc,
          ParamType.String,
        ),
        'time': serializeParam(
          _time,
          ParamType.String,
        ),
      }.withoutNulls;

  static BolgModelStruct fromSerializableMap(Map<String, dynamic> data) =>
      BolgModelStruct(
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
        desc: deserializeParam(
          data['desc'],
          ParamType.String,
          false,
        ),
        time: deserializeParam(
          data['time'],
          ParamType.String,
          false,
        ),
      );

  @override
  String toString() => 'BolgModelStruct(${toMap()})';

  @override
  bool operator ==(Object other) {
    return other is BolgModelStruct &&
        image == other.image &&
        name == other.name &&
        desc == other.desc &&
        time == other.time;
  }

  @override
  int get hashCode => const ListEquality().hash([image, name, desc, time]);
}

BolgModelStruct createBolgModelStruct({
  String? image,
  String? name,
  String? desc,
  String? time,
}) =>
    BolgModelStruct(
      image: image,
      name: name,
      desc: desc,
      time: time,
    );
