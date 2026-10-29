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

String statusLabel(String? status) {
  // Short label for an ingredient note status or a photo status.
  switch (status) {
    case 'concern':
      return 'Documented concern';
    case 'caution':
      return 'Caution';
    case 'positive':
      return 'Good to know';
    case 'info':
      return 'Explained';
    case 'unknown':
      return 'Not yet reviewed';
    case 'uploaded':
      return 'Uploaded';
    case 'processing':
      return 'Reading the label…';
    case 'processed':
      return 'Label read';
    case 'unreadable':
      return 'Couldn’t read it';
    case 'different_product':
      return 'Different product';
    case 'rejected':
      return 'Not accepted';
    case 'failed':
      return 'Failed';
    default:
      return status ?? '';
  }
}
