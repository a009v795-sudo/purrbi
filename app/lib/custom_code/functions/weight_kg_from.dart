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
import '/backend/backend.dart';
import 'package:cloud_firestore/cloud_firestore.dart' hide Type;
import '/backend/schema/structs/index.dart';
import '/flutter_flow/ff_builtin_enums.dart';
import '/auth/firebase_auth/auth_util.dart';

double? weightKgFrom(
  String? value,
  String? unit,
) {
  // Normalised weight; the value and unit as entered are stored separately.
  final v = double.tryParse((value ?? '').trim().replaceAll(',', '.'));
  if (v == null || v <= 0) return null;
  final kg = unit == 'lb' ? v * 0.45359237 : v;
  if (kg < 0.1 || kg > 120) return null;
  return (kg * 100).round() / 100;
}
