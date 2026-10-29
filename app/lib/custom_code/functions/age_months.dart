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

int? ageMonths(
  String? years,
  String? months,
) {
  // Approximate age in months; stored with the date it was entered so it keeps advancing.
  final y = int.tryParse((years ?? '').trim());
  final m = int.tryParse((months ?? '').trim());
  if (y == null && m == null) return null;
  final total = (y ?? 0) * 12 + (m ?? 0);
  return (total < 0 || total > 360) ? null : total;
}
