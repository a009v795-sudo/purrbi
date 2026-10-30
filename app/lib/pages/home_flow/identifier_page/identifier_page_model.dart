import '/auth/firebase_auth/auth_util.dart';
import '/flutter_flow/ff_builtin_enums.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/pages/components/main_appbar/main_appbar_widget.dart';
import 'dart:ui';
import '/actions/actions.dart' as action_blocks;
import '/custom_code/actions/index.dart' as actions;
import '/custom_code/widgets/index.dart' as custom_widgets;
import '/flutter_flow/custom_functions.dart' as functions;
import '/flutter_flow/permissions_util.dart';
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

  bool? creating = false;

  String? createdScanId = '';

  ///  State fields for stateful widgets in this page.

  // Model for MainAppbar component.
  late MainAppbarModel mainAppbarModel;
  var scannedBarcode = '';
  // Stores action output result for [Custom Action - createScanRequest] action in Container widget.
  String? cameraRequest;
  // State field(s) for manualBarcodeField widget.
  FocusNode? manualBarcodeFieldFocusNode;
  TextEditingController? manualBarcodeFieldTextController;
  String? Function(BuildContext, String?)?
      manualBarcodeFieldTextControllerValidator;
  // Stores action output result for [Custom Action - createScanRequest] action in Button widget.
  String? manualRequest;

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
