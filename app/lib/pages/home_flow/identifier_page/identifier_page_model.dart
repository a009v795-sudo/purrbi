import '/auth/firebase_auth/auth_util.dart';
import '/backend/backend.dart';
import '/flutter_flow/ff_builtin_enums.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/pages/components/main_appbar/main_appbar_widget.dart';
import 'dart:ui';
import '/actions/actions.dart' as action_blocks;
import '/flutter_flow/custom_functions.dart' as functions;
import '/index.dart';
import 'identifier_page_widget.dart' show IdentifierPageWidget;
import 'package:cloud_firestore/cloud_firestore.dart' hide Type;
import 'package:auto_size_text/auto_size_text.dart';
import 'package:flutter/material.dart';
import 'package:flutter_barcode_scanner/flutter_barcode_scanner.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class IdentifierPageModel extends FlutterFlowModel<IdentifierPageWidget> {
  ///  Local state fields for this page.

  String? lastScan = '';

  DocumentReference? createdScan;

  ///  State fields for stateful widgets in this page.

  // Model for MainAppbar component.
  late MainAppbarModel mainAppbarModel;
  var scannedCode = '';
  // Stores action output result for [Backend Call - Create Document] action in Container widget.
  ScansRecord? newScan;
  // State field(s) for manualBarcodeField widget.
  FocusNode? manualBarcodeFieldFocusNode;
  TextEditingController? manualBarcodeFieldTextController;
  String? Function(BuildContext, String?)?
      manualBarcodeFieldTextControllerValidator;
  // Stores action output result for [Backend Call - Create Document] action in Button widget.
  ScansRecord? typedScan;

  @override
  void initState(BuildContext context) {
    mainAppbarModel = createModel(context, () => MainAppbarModel());
  }

  @override
  void dispose() {
    mainAppbarModel.dispose();
    manualBarcodeFieldFocusNode?.dispose();
    manualBarcodeFieldTextController?.dispose();
  }
}
