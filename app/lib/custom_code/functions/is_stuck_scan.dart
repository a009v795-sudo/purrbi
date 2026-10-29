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

bool isStuckScan(
  String? status,
  DateTime? updatedAt,
  DateTime? createdAt,
) {
  // Still marked as working, but nothing has changed for more than 6 minutes: the job stopped without
  // a result (jobs time out after 5 minutes). The owner can then retry it (the rules allow the same).
  const working = [
    'queued',
    'identifying',
    'researching',
    'checking_alerts',
    'assessing',
    'processing_photo'
  ];
  if (!working.contains(status ?? 'queued')) return false;
  final last = updatedAt ?? createdAt;
  if (last == null) return false;
  return DateTime.now().difference(last).inMinutes >= 6;
}
