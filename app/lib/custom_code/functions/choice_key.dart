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

String choiceKey(
  String kind,
  String? label,
) {
  // Stored value for an onboarding choice. "No ..." / "Not sure" / "Prefer not to say" stay distinct.
  final l = (label ?? '').trim().toLowerCase();
  switch (kind) {
    case 'disclosure':
      if (l == 'yes') return 'reported';
      if (l == 'not sure') return 'not_sure';
      if (l.startsWith('no')) return 'none_reported';
      return 'not_provided';
    case 'species':
      return l == 'dog' ? 'dog' : (l == 'cat' ? 'cat' : '');
    case 'sex':
      return l == 'female' ? 'female' : (l == 'male' ? 'male' : 'unknown');
    case 'neutered':
      return l == 'yes' ? 'yes' : (l == 'no' ? 'no' : 'unknown');
    case 'reproduction':
      if (l == 'pregnant') return 'pregnant';
      if (l == 'nursing') return 'lactating';
      if (l == 'neither') return 'none';
      return 'not_provided';
    case 'size':
      if (l.startsWith('small')) return 'small';
      if (l.startsWith('medium')) return 'medium';
      if (l.startsWith('large')) return 'large';
      if (l.startsWith('giant')) return 'xlarge';
      return 'unknown';
    case 'unit':
      return l == 'lb' ? 'lb' : 'kg';
    default:
      return l;
  }
}
