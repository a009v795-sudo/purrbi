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

import 'package:internet_connection_checker_plus/internet_connection_checker_plus.dart';
import 'package:http/http.dart' as http;

// A fresh reachability check, run before Purrbi refuses something for being offline. The app-wide
// `connected` flag (see `connected`) is refreshed every 30 s and on resume, so it can still say "offline"
// just after the connection came back. Same Firebase endpoints and rule as `connected`: no third-party
// hosts, a keyless GET, and any HTTP answer below 500 means "reachable". It updates the flag and returns
// the fresh answer; it never throws (a failed check counts as offline).
Future<bool> recheckConnection() async {
  final checker = InternetConnection.createInstance(
    useDefaultOptions: false,
    customCheckOptions: [
      InternetCheckOption(
        uri: Uri.parse('https://identitytoolkit.googleapis.com/v1/projects'),
        timeout: const Duration(seconds: 5),
      ),
      InternetCheckOption(
        uri: Uri.parse('https://firebase.googleapis.com/v1beta1/projects'),
        timeout: const Duration(seconds: 5),
      ),
    ],
    customConnectivityCheck: (option) async {
      try {
        final response = await http
            .get(option.uri, headers: option.headers)
            .timeout(option.timeout);
        return InternetCheckResult(
            option: option, isSuccess: response.statusCode < 500);
      } catch (_) {
        return InternetCheckResult(option: option, isSuccess: false);
      }
    },
  );
  bool online;
  try {
    online = await checker.hasInternetAccess;
  } catch (_) {
    online = false;
  }
  if (FFAppState().connected != online) {
    FFAppState().update(() {
      FFAppState().connected = online;
    });
  }
  return online;
}
