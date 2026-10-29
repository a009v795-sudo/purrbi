// Automatic FlutterFlow imports
import '/backend/backend.dart';
import '/backend/schema/structs/index.dart';
import '/flutter_flow/ff_builtin_enums.dart';
import '/actions/actions.dart' as action_blocks;
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/custom_code/actions/index.dart'; // Imports other custom actions
import '/flutter_flow/custom_functions.dart'; // Imports custom functions
import 'package:flutter/material.dart' hide RepeatMode;
// Begin custom action code
// DO NOT REMOVE OR MODIFY THE CODE ABOVE!

import 'package:flutter/foundation.dart';

// TEMPORARY client tracing for the scan-flow audit: one sanitized line per step in the device log
// (adb logcat | grep purrbi-trace). It records the step, the scan's document id, the backend trace id
// and a short detail such as a status or a digit count - never a barcode, a pet's details, a name, an
// e-mail address or a token. Set _enabled to false (or delete the calls) once the audit is closed.
const bool _enabled = true;
final Stopwatch _clock = Stopwatch()..start();

Future traceScan(
    String step, String? scanId, String? traceId, String? detail) async {
  if (!_enabled) return;
  String clean(String? v, int max) {
    final s = (v ?? '').replaceAll(RegExp(r'[^A-Za-z0-9_.:/ -]'), '');
    return s.length > max ? s.substring(0, max) : s;
  }

  debugPrint(
      '[purrbi-trace] t=${_clock.elapsedMilliseconds}ms step=${clean(step, 40)} scan=${clean(scanId, 40)} trace=${clean(traceId, 20)} ${clean(detail, 80)}');
}
