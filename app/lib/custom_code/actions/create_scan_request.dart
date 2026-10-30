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

import 'dart:async';

import '/app_state.dart';
import '/auth/firebase_auth/auth_util.dart';

// Creates the scan request the backend worker picks up (users/{uid}/scans/{id}, status "queued"), with
// exactly the fields the security rules accept for a new scan. It returns the new document's id and keeps its
// reference in app state (lastScanRef: a FlutterFlow custom action cannot return a document reference), so the
// Scan page opens it. It never throws: when the request cannot be created (signed out, refused by the rules, a
// Firestore error) it returns '' after tracing why, so the Scan page can release its "creating" guard and say
// so. A server confirmation that has not come within 10 s (a weak connection) does not hold the page:
// Firestore keeps the write and sends it when it can, and the result page shows the request from its local
// copy until then.
Future<String> createScanRequest(
  String barcode,
  String? petId,
  String source,
) async {
  final user = currentUserReference;
  if (user == null || !loggedIn) {
    await traceScan('create_failed', '', '', 'signed_out');
    return '';
  }
  final ref = ScansRecord.createDoc(user);
  try {
    await ref.set({
      ...createScansRecordData(
        barcode: barcode,
        petId: petId ?? '',
        source: source,
        status: 'queued',
        clientVersion: 'purrbi-app-1.2.0',
      ),
      ...mapToFirestore({'createdAt': FieldValue.serverTimestamp()}),
    }).timeout(const Duration(seconds: 10));
  } on TimeoutException {
    await traceScan('create_pending', ref.id, '', source);
  } on FirebaseException catch (e) {
    await traceScan('create_failed', '', '', e.code);
    return '';
  } catch (_) {
    await traceScan('create_failed', '', '', 'error');
    return '';
  }
  FFAppState().lastScanRef = ref;
  return ref.id;
}
