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

String? convertMDToST(String? markDownText) {
  if (markDownText == null || markDownText.isEmpty) {
    return '';
  }

  String plainText = markDownText;

  // Remove headers (# Header)
  plainText = plainText.replaceAll(RegExp(r'#{1,6}\s'), '');

  // Remove bold and italic markers
  plainText = plainText.replaceAll(RegExp(r'\*\*|__'), '');
  plainText = plainText.replaceAll(RegExp(r'\*|_'), '');

  // Remove inline code
  plainText = plainText.replaceAll(RegExp(r'`([^`]+)`'), r'$1');

  // Remove code blocks
  plainText = plainText.replaceAll(RegExp(r'```[\s\S]*?```'), '');

  // Remove blockquotes
  plainText = plainText.replaceAll(RegExp(r'^\s*>\s', multiLine: true), '');

  // Convert list markers to plain text
  plainText = plainText.replaceAll(RegExp(r'^\s*[-*+]\s', multiLine: true), '');
  plainText = plainText.replaceAll(RegExp(r'^\s*\d+\.\s', multiLine: true), '');

  // Remove horizontal rules
  plainText =
      plainText.replaceAll(RegExp(r'^\s*[-*_]{3,}\s*$', multiLine: true), '');

  // Replace links [text](url) with just the text
  plainText = plainText.replaceAll(RegExp(r'\[([^\]]+)\]\([^\)]+\)'), r'$1');

  // Replace images ![alt](url) with just the alt text
  plainText = plainText.replaceAll(RegExp(r'!\[([^\]]+)\]\([^\)]+\)'), r'$1');

  // Remove HTML tags
  plainText = plainText.replaceAll(RegExp(r'<[^>]*>'), '');

  // Clean up excess whitespace
  plainText = plainText.replaceAll(RegExp(r'\n{3,}'), '\n\n');
  plainText = plainText.trim();

  return plainText;
}
