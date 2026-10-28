// ignore_for_file: unnecessary_getters_setters

import '/backend/schema/util/schema_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

class CategorieModelStruct extends BaseStruct {
  CategorieModelStruct({
    String? name,
    String? img,
  })  : _name = name,
        _img = img;

  // "name" field.
  String? _name;
  String get name => _name ?? '';
  set name(String? val) => _name = val;

  bool hasName() => _name != null;

  // "img" field.
  String? _img;
  String get img => _img ?? '';
  set img(String? val) => _img = val;

  bool hasImg() => _img != null;

  static CategorieModelStruct fromMap(Map<String, dynamic> data) =>
      CategorieModelStruct(
        name: data['name'] as String?,
        img: data['img'] as String?,
      );

  static CategorieModelStruct? maybeFromMap(dynamic data) => data is Map
      ? CategorieModelStruct.fromMap(data.cast<String, dynamic>())
      : null;

  Map<String, dynamic> toMap() => {
        'name': _name,
        'img': _img,
      }.withoutNulls;

  @override
  Map<String, dynamic> toSerializableMap() => {
        'name': serializeParam(
          _name,
          ParamType.String,
        ),
        'img': serializeParam(
          _img,
          ParamType.String,
        ),
      }.withoutNulls;

  static CategorieModelStruct fromSerializableMap(Map<String, dynamic> data) =>
      CategorieModelStruct(
        name: deserializeParam(
          data['name'],
          ParamType.String,
          false,
        ),
        img: deserializeParam(
          data['img'],
          ParamType.String,
          false,
        ),
      );

  @override
  String toString() => 'CategorieModelStruct(${toMap()})';

  @override
  bool operator ==(Object other) {
    return other is CategorieModelStruct &&
        name == other.name &&
        img == other.img;
  }

  @override
  int get hashCode => const ListEquality().hash([name, img]);
}

CategorieModelStruct createCategorieModelStruct({
  String? name,
  String? img,
}) =>
    CategorieModelStruct(
      name: name,
      img: img,
    );
