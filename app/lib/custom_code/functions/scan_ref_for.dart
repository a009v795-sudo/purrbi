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

/// The signed-in owner's scan document users/{uid}/scans/{scanId}, built from
/// the id createScanRequest returns.
///
/// Null (no scan to open) without an owner or an id.
DocumentReference? scanRefFor(
  DocumentReference? owner,
  String? scanId,
) {
  if (owner == null || scanId == null || scanId.isEmpty) {
    return null;
  }
  return owner.collection('scans').doc(scanId);
}
