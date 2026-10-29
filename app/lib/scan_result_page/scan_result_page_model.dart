import '/auth/firebase_auth/auth_util.dart';
import '/backend/backend.dart';
import '/backend/firebase_storage/storage.dart';
import '/backend/schema/structs/index.dart';
import '/components/bullet_text_widget.dart';
import '/components/finding_row_widget.dart';
import '/flutter_flow/ff_builtin_enums.dart';
import '/flutter_flow/flutter_flow_icon_button.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/flutter_flow/upload_data.dart';
import '/pages/components/main_appbar/main_appbar_widget.dart';
import 'dart:ui';
import '/flutter_flow/custom_functions.dart' as functions;
import '/index.dart';
import 'package:cloud_firestore/cloud_firestore.dart' hide Type;
import 'scan_result_page_widget.dart' show ScanResultPageWidget;
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:percent_indicator/percent_indicator.dart';
import 'package:provider/provider.dart';

class ScanResultPageModel extends FlutterFlowModel<ScanResultPageWidget> {
  ///  Local state fields for this page.

  bool? uploading = false;

  DocumentReference? chosenPet;

  ///  State fields for stateful widgets in this page.

  // Model for MainAppbar.
  late MainAppbarModel mainAppbarModel;
  bool isDataUploading_uploadData = false;
  FFUploadedFile uploadedLocalFile_uploadData =
      FFUploadedFile(bytes: Uint8List.fromList([]), originalFilename: '');
  String uploadedFileUrl_uploadData = '';

  // Stores action output result for [Backend Call - Create Document] action in Button widget.
  PhotosRecord? document;
  // Models for BulletText.
  late FlutterFlowDynamicModels<BulletTextModel> bulletTextModels1;
  // Models for FindingRow.
  late FlutterFlowDynamicModels<FindingRowModel> findingRowModels1;
  // Models for BulletText.
  late FlutterFlowDynamicModels<BulletTextModel> bulletTextModels2;
  // Models for FindingRow.
  late FlutterFlowDynamicModels<FindingRowModel> findingRowModels2;
  // Models for BulletText.
  late FlutterFlowDynamicModels<BulletTextModel> bulletTextModels3;
  // Models for FindingRow.
  late FlutterFlowDynamicModels<FindingRowModel> findingRowModels3;
  // Models for BulletText.
  late FlutterFlowDynamicModels<BulletTextModel> bulletTextModels4;
  // Models for BulletText.
  late FlutterFlowDynamicModels<BulletTextModel> bulletTextModels5;

  @override
  void initState(BuildContext context) {
    mainAppbarModel = createModel(context, () => MainAppbarModel());
    bulletTextModels1 = FlutterFlowDynamicModels(() => BulletTextModel());
    findingRowModels1 = FlutterFlowDynamicModels(() => FindingRowModel());
    bulletTextModels2 = FlutterFlowDynamicModels(() => BulletTextModel());
    findingRowModels2 = FlutterFlowDynamicModels(() => FindingRowModel());
    bulletTextModels3 = FlutterFlowDynamicModels(() => BulletTextModel());
    findingRowModels3 = FlutterFlowDynamicModels(() => FindingRowModel());
    bulletTextModels4 = FlutterFlowDynamicModels(() => BulletTextModel());
    bulletTextModels5 = FlutterFlowDynamicModels(() => BulletTextModel());
  }

  @override
  void dispose() {
    mainAppbarModel.dispose();
    bulletTextModels1.dispose();
    findingRowModels1.dispose();
    bulletTextModels2.dispose();
    findingRowModels2.dispose();
    bulletTextModels3.dispose();
    findingRowModels3.dispose();
    bulletTextModels4.dispose();
    bulletTextModels5.dispose();
  }
}
