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

import 'package:firebase_auth/firebase_auth.dart';

// What is true of the signed-in account right now, read from Firebase itself (not the app's cached copy):
// "signed_out" when no one is signed in (after a successful account deletion, too), "no_profile" when the
// signed-in user has no users/{uid} document (the splash screen cannot route such an account), "ok"
// otherwise, and "unknown" when it could not be read (offline).
Future<String> accountState() async {
  final user = FirebaseAuth.instance.currentUser;
  if (user == null) return 'signed_out';
  try {
    final snap = await UsersRecord.collection.doc(user.uid).get();
    return snap.exists ? 'ok' : 'no_profile';
  } catch (_) {
    return 'unknown';
  }
}
