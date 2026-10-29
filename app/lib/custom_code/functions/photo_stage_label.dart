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

String photoStageLabel(
  String? status,
  String? stage,
) {
  // A label photo's progress in the owner's words.
  switch (status) {
    case 'uploaded':
      return 'Submitted';
    case 'processing':
      return 'Reading the label…';
    case 'unreadable':
      return 'Couldn’t read it';
    case 'different_product':
      return 'Another product’s barcode';
    case 'rejected':
      return 'Not accepted';
    case 'failed':
      return 'Failed';
  }
  switch (stage) {
    case 'verified':
      return 'Matched to this product';
    case 'corroborated':
      return 'Read, partly matched';
    case 'disputed':
      return 'Doesn’t match this barcode';
    default:
      return 'Read';
  }
}
