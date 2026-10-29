import '/auth/firebase_auth/auth_util.dart';
import '/backend/backend.dart';
import '/backend/firebase_storage/storage.dart';
import '/backend/schema/structs/index.dart';
import '/components/bullet_text_widget.dart';
import '/components/finding_row_widget.dart';
import '/components/highlight_row_widget.dart';
import '/flutter_flow/ff_builtin_enums.dart';
import '/flutter_flow/flutter_flow_icon_button.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/flutter_flow/upload_data.dart';
import '/pages/components/main_appbar/main_appbar_widget.dart';
import 'dart:ui';
import '/custom_code/actions/index.dart' as actions;
import '/flutter_flow/custom_functions.dart' as functions;
import '/index.dart';
import 'package:cloud_firestore/cloud_firestore.dart' hide Type;
import 'scan_result_page_widget.dart' show ScanResultPageWidget;
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:percent_indicator/percent_indicator.dart';
import 'package:provider/provider.dart';

class ScanResultPageModel extends FlutterFlowModel<ScanResultPageWidget> {
  ///  Local state fields for this page.

  bool? uploading = false;

  DocumentReference? chosenPet;

  bool? showAllIngredients = false;

  bool? showPersonal = false;

  bool? showNutrition = false;

  bool? showScore = false;

  bool? showLabel = false;

  bool? showSources = false;

  bool? showRecall = false;

  ///  State fields for stateful widgets in this page.

  // Model for MainAppbar.
  late MainAppbarModel mainAppbarModel;
  bool isDataUploading_frontUpload = false;
  FFUploadedFile uploadedLocalFile_frontUpload =
      FFUploadedFile(bytes: Uint8List.fromList([]), originalFilename: '');
  String uploadedFileUrl_frontUpload = '';

  // Stores action output result for [Backend Call - Create Document] action in Button widget.
  PhotosRecord? frontPhoto;
  // Models for HighlightRowItem1.
  late FlutterFlowDynamicModels<HighlightRowModel> highlightRowItem1Models;
  // Models for HighlightRowItem2.
  late FlutterFlowDynamicModels<HighlightRowModel> highlightRowItem2Models;
  bool isDataUploading_uploadData = false;
  FFUploadedFile uploadedLocalFile_uploadData =
      FFUploadedFile(bytes: Uint8List.fromList([]), originalFilename: '');
  String uploadedFileUrl_uploadData = '';

  // Stores action output result for [Backend Call - Create Document] action in Button widget.
  PhotosRecord? requestedPhoto;
  // Models for FindingRowItem1.
  late FlutterFlowDynamicModels<FindingRowModel> findingRowItem1Models;
  // Models for BulletTextItem1.
  late FlutterFlowDynamicModels<BulletTextModel> bulletTextItem1Models;
  // Models for FindingRowItem2.
  late FlutterFlowDynamicModels<FindingRowModel> findingRowItem2Models;
  // Models for BulletTextItem2.
  late FlutterFlowDynamicModels<BulletTextModel> bulletTextItem2Models;
  // Models for BulletTextItem3.
  late FlutterFlowDynamicModels<BulletTextModel> bulletTextItem3Models;
  // Models for FindingRowItem3.
  late FlutterFlowDynamicModels<FindingRowModel> findingRowItem3Models;
  // Models for BulletTextItem4.
  late FlutterFlowDynamicModels<BulletTextModel> bulletTextItem4Models;

  @override
  void initState(BuildContext context) {
    mainAppbarModel = createModel(context, () => MainAppbarModel());
    highlightRowItem1Models =
        FlutterFlowDynamicModels(() => HighlightRowModel());
    highlightRowItem2Models =
        FlutterFlowDynamicModels(() => HighlightRowModel());
    findingRowItem1Models = FlutterFlowDynamicModels(() => FindingRowModel());
    bulletTextItem1Models = FlutterFlowDynamicModels(() => BulletTextModel());
    findingRowItem2Models = FlutterFlowDynamicModels(() => FindingRowModel());
    bulletTextItem2Models = FlutterFlowDynamicModels(() => BulletTextModel());
    bulletTextItem3Models = FlutterFlowDynamicModels(() => BulletTextModel());
    findingRowItem3Models = FlutterFlowDynamicModels(() => FindingRowModel());
    bulletTextItem4Models = FlutterFlowDynamicModels(() => BulletTextModel());
  }

  @override
  void dispose() {
    mainAppbarModel.dispose();
    highlightRowItem1Models.dispose();
    highlightRowItem2Models.dispose();
    findingRowItem1Models.dispose();
    bulletTextItem1Models.dispose();
    findingRowItem2Models.dispose();
    bulletTextItem2Models.dispose();
    bulletTextItem3Models.dispose();
    findingRowItem3Models.dispose();
    bulletTextItem4Models.dispose();
  }
}
