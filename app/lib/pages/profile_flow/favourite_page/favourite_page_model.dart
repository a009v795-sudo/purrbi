import '/backend/schema/structs/index.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/pages/components/main_appbar/main_appbar_widget.dart';
import '/pages/components/scan_component/scan_component_widget.dart';
import '/pages/empty_components/no_results_component/no_results_component_widget.dart';
import 'dart:ui';
import '/index.dart';
import 'favourite_page_widget.dart' show FavouritePageWidget;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class FavouritePageModel extends FlutterFlowModel<FavouritePageWidget> {
  ///  Local state fields for this page.

  int? tabIndex = 0;

  ///  State fields for stateful widgets in this page.

  // Model for MainAppbar component.
  late MainAppbarModel mainAppbarModel;
  // Models for ScanComponent dynamic component.
  late FlutterFlowDynamicModels<ScanComponentModel> scanComponentModels;
  // Model for NoResultsComponent component.
  late NoResultsComponentModel noResultsComponentModel;

  @override
  void initState(BuildContext context) {
    mainAppbarModel = createModel(context, () => MainAppbarModel());
    scanComponentModels = FlutterFlowDynamicModels(() => ScanComponentModel());
    noResultsComponentModel =
        createModel(context, () => NoResultsComponentModel());
  }

  @override
  void dispose() {
    mainAppbarModel.dispose();
    scanComponentModels.dispose();
    noResultsComponentModel.dispose();
  }
}
