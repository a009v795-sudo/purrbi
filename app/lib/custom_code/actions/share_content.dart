// Automatic FlutterFlow imports
import '/backend/schema/structs/index.dart';
import '/actions/actions.dart' as action_blocks;
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/custom_code/actions/index.dart'; // Imports other custom actions
import '/flutter_flow/custom_functions.dart'; // Imports custom functions
import 'package:flutter/material.dart' hide RepeatMode;
// Begin custom action code
// DO NOT REMOVE OR MODIFY THE CODE ABOVE!

import 'package:share_plus/share_plus.dart';

Future shareContent(String? content) async {
  // Add your function code here!
  if (content == null || content.isEmpty) {
    // Handle the case where content is null or empty
    print('No content to share.');
    return;
  }

  try {
    await Share.share(content);
  } catch (e) {
    print('Error sharing content: $e');
  }
}
