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

String scanStatusText(
  String? status,
  String? statusMessage,
) {
  // The progress line: the backend's message, or a plain one before the job has picked the scan up.
  final m = (statusMessage ?? '').trim();
  if (m.isNotEmpty) return m;
  return (status ?? 'queued') == 'queued'
      ? 'Queued: starting the lookup…'
      : 'Working on it…';
}
