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

bool isLikelyBarcode(String? code) {
  // A product barcode with a valid GS1 check digit: EAN-8 or UPC-E (8 digits), UPC-A (12),
  // EAN-13 (13) or GTIN-14 (14) - the same rule the backend applies.
  final d = (code ?? '').replaceAll(RegExp(r'[\s-]'), '');
  if (!RegExp(r'^(\d{8}|\d{12,14})$').hasMatch(d)) return false;
  int check(String body) {
    var sum = 0;
    for (var i = 0; i < body.length; i++) {
      final digit = body.codeUnitAt(body.length - 1 - i) - 48;
      sum += digit * (i % 2 == 0 ? 3 : 1);
    }
    return (10 - sum % 10) % 10;
  }

  final last = d.codeUnitAt(d.length - 1) - 48;
  if (check(d.substring(0, d.length - 1)) == last) return true;
  // UPC-E (small US packages): number system 0 or 1, six digits, the check digit of its UPC-A.
  if (d.length == 8 && (d[0] == '0' || d[0] == '1')) {
    final x = d.substring(1, 7);
    final s = x[5];
    final body = (s == '0' || s == '1' || s == '2')
        ? '${x.substring(0, 2)}${s}0000${x.substring(2, 5)}'
        : s == '3'
            ? '${x.substring(0, 3)}00000${x.substring(3, 5)}'
            : s == '4'
                ? '${x.substring(0, 4)}00000${x[4]}'
                : '${x.substring(0, 5)}0000$s';
    return check('${d[0]}$body') == last;
  }
  return false;
}
