import 'dart:convert';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:timeago/timeago.dart' as timeago;
import '/flutter_flow/custom_functions.dart';
import '/flutter_flow/lat_lng.dart';
import '/flutter_flow/place.dart';
import '/flutter_flow/uploaded_file.dart';
import '/backend/schema/structs/index.dart';

List<MainDataModelStruct> searchFunction(
  String? search,
  List<MainDataModelStruct> list,
) {
  if (search == null || search.trim().isEmpty) {
    return list;
  }

  final query = search.trim().toLowerCase();

  return list.where((item) {
    final name = item.name?.toLowerCase() ?? '';
    return name.contains(query);
  }).toList();
}
