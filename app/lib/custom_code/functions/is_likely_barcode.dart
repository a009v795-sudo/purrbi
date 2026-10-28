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

bool isLikelyBarcode(String? code) {
  // A product barcode (EAN-8, UPC-A, EAN-13 or GTIN-14) has 8 to 14 digits.
  // The full GS1 check-digit validation happens on the backend.
  final digits = (code ?? '').replaceAll(RegExp(r'[\s-]'), '');
  return RegExp(r'^\d{8,14}$').hasMatch(digits);
}
