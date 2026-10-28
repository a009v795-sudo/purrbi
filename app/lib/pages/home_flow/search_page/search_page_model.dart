import '/backend/schema/structs/index.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/pages/components/main_appbar/main_appbar_widget.dart';
import '/pages/components/no_internet_component/no_internet_component_widget.dart';
import '/pages/components/scan_component/scan_component_widget.dart';
import '/pages/empty_components/no_data_found_component/no_data_found_component_widget.dart';
import 'dart:ui';
import '/flutter_flow/custom_functions.dart' as functions;
import '/index.dart';
import 'search_page_widget.dart' show SearchPageWidget;
import 'package:easy_debounce/easy_debounce.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class SearchPageModel extends FlutterFlowModel<SearchPageWidget> {
  ///  State fields for stateful widgets in this page.

  // Model for MainAppbar component.
  late MainAppbarModel mainAppbarModel;
  // State field(s) for TextField widget.
  FocusNode? textFieldFocusNode;
  TextEditingController? textController;
  String? Function(BuildContext, String?)? textControllerValidator;
  // Models for ScanComponent dynamic component.
  late FlutterFlowDynamicModels<ScanComponentModel> scanComponentModels1;
  // Models for ScanComponent dynamic component.
  late FlutterFlowDynamicModels<ScanComponentModel> scanComponentModels2;
  // Model for NoDataFoundComponent component.
  late NoDataFoundComponentModel noDataFoundComponentModel;
  // Model for NoInternetComponent component.
  late NoInternetComponentModel noInternetComponentModel;

  @override
  void initState(BuildContext context) {
    mainAppbarModel = createModel(context, () => MainAppbarModel());
    scanComponentModels1 = FlutterFlowDynamicModels(() => ScanComponentModel());
    scanComponentModels2 = FlutterFlowDynamicModels(() => ScanComponentModel());
    noDataFoundComponentModel =
        createModel(context, () => NoDataFoundComponentModel());
    noInternetComponentModel =
        createModel(context, () => NoInternetComponentModel());
  }

  @override
  void dispose() {
    mainAppbarModel.dispose();
    textFieldFocusNode?.dispose();
    textController?.dispose();

    scanComponentModels1.dispose();
    scanComponentModels2.dispose();
    noDataFoundComponentModel.dispose();
    noInternetComponentModel.dispose();
  }
}
