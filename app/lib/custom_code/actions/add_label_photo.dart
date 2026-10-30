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

import '/auth/firebase_auth/auth_util.dart';
import '/backend/firebase_storage/storage.dart';
import '/flutter_flow/upload_data.dart';

// One label photo for a scan, from picking it to the photo request the backend reads. The owner picks or
// takes a photo, downscaled to at most 2048 px at JPEG quality 85 (well under the 10 MB upload limit; a
// HEIC photo becomes a JPEG); it is uploaded to the owner's own folder and the photo document is created.
// It never throws, so the page's "uploading" flag is always released, and each call keeps its own file and
// address (the photo rows no longer share one upload field). It says what happened: "added", "cancelled"
// (nothing picked), "too_large", "upload_failed", "not_accepted" (the result is being updated, so the rules
// refuse a photo for now) or "error".
Future<String> addLabelPhoto(
  BuildContext context,
  String scanId,
  String purpose,
) async {
  final user = currentUserReference;
  if (user == null || currentUserUid.isEmpty) return 'error';
  List<SelectedFile>? picked;
  try {
    picked = await selectMediaWithSourceBottomSheet(
      context: context,
      maxWidth: 2048.00,
      maxHeight: 2048.00,
      imageQuality: 85,
      allowPhoto: true,
    );
  } catch (_) {
    return 'error';
  }
  if (picked == null || picked.isEmpty) return 'cancelled';
  final file = picked.first;
  if (file.bytes.length >= 10 * 1024 * 1024) return 'too_large';
  String? url;
  if (context.mounted) {
    showUploadMessage(context, 'Uploading the photo…', showLoading: true);
  }
  try {
    url = await uploadData(file.storagePath, file.bytes);
  } catch (_) {
    url = null;
  } finally {
    if (context.mounted) ScaffoldMessenger.of(context).hideCurrentSnackBar();
  }
  if (url == null || url.isEmpty) {
    await traceScan('photo_failed', scanId, '', 'upload');
    return 'upload_failed';
  }
  try {
    await PhotosRecord.createDoc(user).set({
      ...createPhotosRecordData(
        scanId: scanId,
        purpose: purpose,
        imageUrl: url,
        status: 'uploaded',
      ),
      ...mapToFirestore({'createdAt': FieldValue.serverTimestamp()}),
    });
  } on FirebaseException catch (e) {
    await traceScan('photo_failed', scanId, '', e.code);
    return e.code == 'permission-denied' ? 'not_accepted' : 'error';
  } catch (_) {
    await traceScan('photo_failed', scanId, '', 'error');
    return 'error';
  }
  await traceScan('photo_added', scanId, '', purpose);
  return 'added';
}
