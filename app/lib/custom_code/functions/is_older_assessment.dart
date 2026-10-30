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

bool isOlderAssessment(
  String? saved,
  String current,
) {
  // Whether a saved result was assessed by older rules than this app's ("assessment-3.0.0"): a missing or
  // unreadable version counts as older; a newer one is never re-requested (the backend's own test).
  List<int>? parse(String? v) {
    final m = RegExp(r'^assessment-(\d+)\.(\d+)\.(\d+)$')
        .firstMatch((v ?? '').trim());
    return m == null
        ? null
        : [
            int.parse(m.group(1)!),
            int.parse(m.group(2)!),
            int.parse(m.group(3)!)
          ];
  }

  final a = parse(saved);
  final b = parse(current);
  if (b == null) return false;
  if (a == null) return true;
  for (var i = 0; i < 3; i++) {
    if (a[i] != b[i]) return a[i] < b[i];
  }
  return false;
}
