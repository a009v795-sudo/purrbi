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
import 'package:flutter/widgets.dart';
import 'dart:async';

// Global instances (do not remove)
StreamSubscription<InternetStatus>? _connectionSubscription;
AppLifecycleListener? _lifecycleListener;
// Reachability of the Firebase services Purrbi uses; no third-party hosts are contacted. A keyless
// request to the Auth API is refused before any project is involved (no cost). The check uses GET
// because Google answers the package's default HEAD without CORS headers, which a browser cannot
// read. Any HTTP answer below 500 means "reachable".
final InternetConnection _connection = InternetConnection.createInstance(
  useDefaultOptions: false,
  checkInterval: const Duration(seconds: 30),
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

Future connected() async {
  // Add your function code here!
  void startListening() {
    _connectionSubscription?.cancel();

    _connectionSubscription =
        _connection.onStatusChange.listen((InternetStatus status) {
      final bool isConnected = status == InternetStatus.connected;

      if (FFAppState().connected != isConnected) {
        FFAppState().update(() {
          FFAppState().connected = isConnected;
        });
        debugPrint('Internet Status Changed: $isConnected');
      }
    });
  }

  /// 🛑 Stop Listener (used on background)
  void stopListening() {
    _connectionSubscription?.cancel();
    _connectionSubscription = null;
  }

  /// ✅ Initial Internet Check (App Start)
  final bool hasInternet = await _connection.hasInternetAccess;
  if (FFAppState().connected != hasInternet) {
    FFAppState().update(() {
      FFAppState().connected = hasInternet;
    });
  }

  /// ▶️ Start listening immediately
  startListening();

  /// ♻️ Dispose old lifecycle listener
  _lifecycleListener?.dispose();

  /// 📱 App Lifecycle Handling
  _lifecycleListener = AppLifecycleListener(
    onResume: () async {
      debugPrint('App Resumed: Checking Internet');

      startListening();

      final bool currentStatus = await _connection.hasInternetAccess;
      if (FFAppState().connected != currentStatus) {
        FFAppState().update(() {
          FFAppState().connected = currentStatus;
        });
      }
    },
    onPause: () {
      debugPrint('App Paused: Internet check stopped');
      stopListening();
    },
  );
}
